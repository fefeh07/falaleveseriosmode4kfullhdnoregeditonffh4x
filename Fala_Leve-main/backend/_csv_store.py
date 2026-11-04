"""
_csv_store.py — persistência local em CSV, espelhando cada tabela do Supabase.

Cada tabela vira um arquivo `dados_csv/<tabela>.csv`. O cabeçalho é derivado
das colunas conhecidas em database.py (mais `senha_hash` para tabelas com senha).
Usado como fallback/espelho: se o Supabase falhar, o dado fica salvo localmente.
"""

import csv
import logging
import os
import threading
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path

logger = logging.getLogger("clinica.csv")

# Pasta onde os CSVs ficam salvos (criada automaticamente)
PASTA = Path(os.getenv("CSV_DIR", Path(__file__).resolve().parent / "dados_csv"))
PASTA.mkdir(parents=True, exist_ok=True)

_lock = threading.Lock()


# ---------------------------------------------------------------- Serialização
def _serializar(valor):
    """Converte date/time/Decimal/dict para texto que o CSV aceita."""
    if valor is None:
        return ""
    if isinstance(valor, (date, datetime, time)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return str(valor)
    if isinstance(valor, (dict, list)):
        import json
        return json.dumps(valor, ensure_ascii=False)
    return str(valor)


def _desserializar(valor: str):
    """Devolve string vazia como None. Tipos numéricos são mantidos como texto
    (o Pydantic do router converte de volta ao ler)."""
    return valor if valor != "" else None


# ---------------------------------------------------------------- Caminhos
def _arquivo(tabela: str) -> Path:
    return PASTA / f"{tabela}.csv"


def _campos(tabela: str, colunas_select: str, tem_senha: bool, registro: dict | None = None) -> list[str]:
    """Cabeçalho = colunas do SELECT (+ senha_hash) (+ criado_em se não houver).
    Se um registro for passado, inclui também chaves extras que vierem dele
    (ex.: id_* devolvido pelo Supabase após insert)."""
    campos = [c.strip() for c in colunas_select.split(",") if c.strip()]
    if tem_senha and "senha_hash" not in campos:
        campos.append("senha_hash")
    if registro:
        for chave in registro.keys():
            if chave not in campos:
                campos.append(chave)
    return campos


# ---------------------------------------------------------------- Leitura
def ler(tabela: str) -> list[dict]:
    """Lê o CSV inteiro. Retorna [] se o arquivo ainda não existe."""
    arq = _arquivo(tabela)
    if not arq.exists():
        return []
    with _lock, arq.open("r", encoding="utf-8", newline="") as f:
        leitor = csv.DictReader(f)
        return [dict(linha) for linha in leitor]


def _ler_cabecalho(tabela: str) -> list[str]:
    arq = _arquivo(tabela)
    if not arq.exists():
        return []
    with arq.open("r", encoding="utf-8", newline="") as f:
        return next(csv.reader(f), [])


# ---------------------------------------------------------------- Escrita
def _garantir_cabecalho(tabela: str, campos: list[str]) -> list[str]:
    """Se o arquivo existe, mescla o cabeçalho existente com os novos campos
    (assim colunas novas aparecem no fim). Retorna o cabeçalho efetivo."""
    existentes = _ler_cabecalho(tabela)
    if not existentes:
        arq = _arquivo(tabela)
        with arq.open("w", encoding="utf-8", newline="") as f:
            csv.writer(f).writerow(campos)
        return campos

    # Mescla preservando ordem: existentes + novos
    efetivos = list(existentes)
    for c in campos:
        if c not in efetivos:
            efetivos.append(c)

    if efetivos != existentes:
        # Reescreve o CSV inteiro com o novo cabeçalho, preenchendo lacunas
        registros = ler(tabela)
        arq = _arquivo(tabela)
        with arq.open("w", encoding="utf-8", newline="") as f:
            escritor = csv.DictWriter(f, fieldnames=efetivos, extrasaction="ignore")
            escritor.writeheader()
            for reg in registros:
                escritor.writerow({c: reg.get(c, "") for c in efetivos})
    return efetivos


def anexar(tabela: str, colunas_select: str, tem_senha: bool, registro: dict) -> dict:
    """Anexa uma linha ao CSV. Retorna o registro como foi gravado."""
    campos = _garantir_cabecalho(
        tabela,
        _campos(tabela, colunas_select, tem_senha, registro),
    )
    linha = {c: _serializar(registro.get(c)) for c in campos}
    arq = _arquivo(tabela)
    with _lock, arq.open("a", encoding="utf-8", newline="") as f:
        csv.DictWriter(f, fieldnames=campos, extrasaction="ignore").writerow(linha)
    return registro


def atualizar_linha(tabela: str, campo_id: str, valor_id, dados: dict,
                    colunas_select: str, tem_senha: bool) -> dict | None:
    """Atualiza a linha cujo `campo_id` bate com `valor_id`. Retorna a linha
    resultante ou None se não encontrou."""
    registros = ler(tabela)
    if not registros:
        return None

    alvo = str(valor_id)
    atualizado = None
    for reg in registros:
        if reg.get(campo_id) == alvo:
            reg.update({k: _serializar(v) for k, v in dados.items() if k != campo_id})
            atualizado = reg
            break

    if atualizado is None:
        return None

    campos = _garantir_cabecalho(
        tabela,
        _campos(tabela, colunas_select, tem_senha, atualizado),
    )
    arq = _arquivo(tabela)
    with _lock, arq.open("w", encoding="utf-8", newline="") as f:
        escritor = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        escritor.writeheader()
        for reg in registros:
            escritor.writerow({c: reg.get(c, "") for c in campos})
    return atualizado


def deletar_linha(tabela: str, campo_id: str, valor_id) -> bool:
    registros = ler(tabela)
    if not registros:
        return False

    alvo = str(valor_id)
    novos = [r for r in registros if r.get(campo_id) != alvo]
    if len(novos) == len(registros):
        return False

    campos = _ler_cabecalho(tabela)
    arq = _arquivo(tabela)
    with _lock, arq.open("w", encoding="utf-8", newline="") as f:
        escritor = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        escritor.writeheader()
        for reg in novos:
            escritor.writerow({c: reg.get(c, "") for c in campos})
    return True


def listar_paginado(tabela: str, limite: int, offset: int, ordem: str = "criado_em") -> list[dict]:
    """Lista em memória (fallback). Ordena desc pela coluna `ordem`, se existir."""
    registros = ler(tabela)
    if not registros:
        return []
    if ordem and ordem in registros[0]:
        registros = sorted(registros, key=lambda r: r.get(ordem, ""), reverse=True)
    return registros[offset: offset + limite]


def buscar_um(tabela: str, campo: str, valor) -> dict | None:
    alvo = str(valor)
    for reg in ler(tabela):
        if reg.get(campo) == alvo:
            return reg
    return None