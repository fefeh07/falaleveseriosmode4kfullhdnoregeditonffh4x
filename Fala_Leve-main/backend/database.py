"""
database.py — conexão com o Supabase e operações no banco (CRUD).
Espelha as operações em CSV (pasta `dados_csv/`).
"""

import logging
import os
import re
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from postgrest import APIError
from supabase import Client, create_client

import _csv_store as csv_store

load_dotenv()

logger = logging.getLogger("clinica.database")

# ---------------------------------------------------------------- Conexão
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "Defina SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env"
    )
if SUPABASE_SECRET_KEY.startswith("sb_publishable_"):
    raise RuntimeError(
        "SUPABASE_SECRET_KEY recebeu a chave publishable. Use a chave SECRETA."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

# ---------------------------------------------------------------- Tabelas
METODO_PAGAMENTO = "metodo_pagamento"
RESPONSAVEL      = "responsavel"
PACIENTE         = "paciente"
PSICOLOGO        = "psicologo"
ASSINATURA       = "assinatura"
MENSAGEM_CHAT    = "mensagem_chat"
SESSAO_VIDEO     = "sessao_video"
FICHA_CLINICA    = "ficha_clinica"

# ---------------------------------------------------------------- Colunas
COLUNAS_METODO = "id_metodo, descricao"

COLUNAS_RESPONSAVEL = (
    "id_responsavel, nome_responsavel, cpf_responsavel, rg_responsavel, "
    "pagamento_responsavel, telefone_responsavel, email_responsavel, "
    "estado_responsavel, cidade_responsavel, bairro_responsavel, rua_responsavel, "
    "numero_responsavel, endereco_responsavel, cep_responsavel, "
    "data_nascimento_responsavel, id_metodo_pagamento, criado_em"
)

COLUNAS_PACIENTE = (
    "id_paciente, id_responsavel, nome_paciente, cpf_paciente, "
    "data_nascimento_paciente, data_inicio_tratamento, pagamento_paciente, "
    "telefone_paciente, email_paciente, estado_paciente, cidade_paciente, "
    "bairro_paciente, rua_paciente, endereco_paciente, cep_paciente, criado_em"
)

COLUNAS_PSICOLOGO = (
    "id_psicologo, nome_psicologo, cpf_psicologo, rg_psicologo, crp_psicologo, "
    "regiao_psicologo, status_psicologo, data_formatura_psicologo, "
    "email_psicologo, telefone_psicologo, area_especialidade, "
    "data_nascimento_psicologo, criado_em"
)

COLUNAS_ASSINATURA = (
    "id_assinatura, id_paciente, status_assinatura, data_inicio, "
    "data_renovacao, valor_mensalidade, criado_em"
)

COLUNAS_MENSAGEM = (
    "id_mensagem, id_paciente, id_psicologo, enviado_por, conteudo_texto, data_envio"
)

COLUNAS_SESSAO = (
    "id_sessao, id_paciente, id_psicologo, data_sessao, hora_inicio, "
    "hora_fim, status_sessao, criado_em"
)

COLUNAS_FICHA = (
    "id_ficha, id_paciente, id_psicologo, data_registro, "
    "anotacoes_avaliacao, diagnostico_observado, criado_em"
)

# ---------------------------------------------------------------- Metadados
_META = {
    METODO_PAGAMENTO: (COLUNAS_METODO,      False, "id_metodo"),
    RESPONSAVEL:      (COLUNAS_RESPONSAVEL, False, "id_responsavel"),
    PACIENTE:         (COLUNAS_PACIENTE,    True,  "id_paciente"),
    PSICOLOGO:        (COLUNAS_PSICOLOGO,   True,  "id_psicologo"),
    ASSINATURA:       (COLUNAS_ASSINATURA,  False, "id_assinatura"),
    MENSAGEM_CHAT:    (COLUNAS_MENSAGEM,    False, "id_mensagem"),
    SESSAO_VIDEO:     (COLUNAS_SESSAO,      False, "id_sessao"),
    FICHA_CLINICA:    (COLUNAS_FICHA,       False, "id_ficha"),
}

def _meta(tabela: str) -> tuple[str, bool, str]:
    return _META.get(tabela, ("", False, "id"))

# ------------------------------------------------------------------ Erros
class ErroDeBanco(Exception):
    """Falha ao falar com o Supabase."""

class RegistroDuplicado(ErroDeBanco):
    """CPF, e-mail, CRP, etc. já cadastrado."""
    def __init__(self, campo: str | None = None):
        super().__init__("Registro duplicado.")
        self.campo = campo

def _executar(consulta):
    try:
        return consulta.execute()
    except APIError as erro:
        codigo = getattr(erro, "code", None)
        detalhes = getattr(erro, "details", None) or ""
        if codigo == "23505":
            achou = re.search(r"Key \((\w+)\)", detalhes)
            raise RegistroDuplicado(achou.group(1) if achou else None) from erro
        logger.error("Erro do Supabase (código %s): %s", codigo, getattr(erro, "message", erro))
        raise ErroDeBanco("Erro ao acessar o banco de dados.") from erro
    except httpx.HTTPError as erro:
        logger.error("Falha de conexão com o Supabase: %s", erro)
        raise ErroDeBanco("Não foi possível conectar ao banco de dados.") from erro


# ------------------------------------------------------------------- CRUD
def inserir(tabela: str, dados: dict) -> dict:
    """Insere no Supabase e espelha no CSV. Se o Supabase falhar, gera ID local."""
    colunas, tem_senha, campo_id = _meta(tabela)

    try:
        resposta = _executar(supabase.table(tabela).insert(dados))
        if not resposta.data:
            raise ErroDeBanco("Não foi possível salvar o registro.")
        registro = resposta.data[0]
    except ErroDeBanco:
        logger.warning("Supabase indisponível. Gerando ID local para %s.", tabela)
        registros_existentes = csv_store.ler(tabela)
        
        # Gera o próximo ID numérico local
        ids_existentes = [
            int(r[campo_id]) for r in registros_existentes 
            if r.get(campo_id) and r[campo_id].isdigit()
        ]
        proximo_id = max(ids_existentes, default=0) + 1

        registro = dict(dados)
        registro[campo_id] = proximo_id
        registro["criado_em"] = datetime.now(timezone.utc).isoformat()
        
        csv_store.anexar(tabela, colunas, tem_senha, registro)
        return registro

    # Espelha no CSV
    try:
        csv_store.anexar(tabela, colunas, tem_senha, registro)
    except Exception as erro:
        logger.error("Falha ao espelhar %s no CSV: %s", tabela, erro)

    return registro


def listar(tabela: str, colunas: str, limite: int, offset: int, ordem: str = "criado_em") -> list[dict]:
    try:
        consulta = (
            supabase.table(tabela)
            .select(colunas)
            .order(ordem, desc=True)
            .range(offset, offset + limite - 1)
        )
        return _executar(consulta).data
    except ErroDeBanco:
        logger.warning("Listando %s do CSV (Supabase indisponível).", tabela)
        return csv_store.listar_paginado(tabela, limite, offset, ordem)


def buscar_por_id(tabela: str, colunas: str, campo_id: str, valor_id) -> dict | None:
    try:
        consulta = supabase.table(tabela).select(colunas).eq(campo_id, valor_id).limit(1)
        dados = _executar(consulta).data
        return dados[0] if dados else None
    except ErroDeBanco:
        logger.warning("Buscando %s no CSV (Supabase indisponível).", tabela)
        return csv_store.buscar_um(tabela, campo_id, valor_id)


def atualizar(tabela: str, campo_id: str, valor_id, dados: dict) -> dict | None:
    colunas, tem_senha, _ = _meta(tabela)
    try:
        resposta = _executar(supabase.table(tabela).update(dados).eq(campo_id, valor_id))
        registro = resposta.data[0] if resposta.data else None
    except ErroDeBanco:
        logger.warning("Supabase falhou em atualizar %s; usando CSV.", tabela)
        registro = csv_store.atualizar_linha(tabela, campo_id, valor_id, dados, colunas, tem_senha)
        return registro

    if registro is not None:
        try:
            csv_store.atualizar_linha(tabela, campo_id, valor_id, dados, colunas, tem_senha)
        except Exception as erro:
            logger.error("Falha ao espelhar update de %s no CSV: %s", tabela, erro)
    return registro


def deletar(tabela: str, campo_id: str, valor_id) -> bool:
    try:
        resposta = _executar(supabase.table(tabela).delete().eq(campo_id, valor_id))
        removido = bool(resposta.data)
    except ErroDeBanco:
        logger.warning("Supabase falhou em deletar %s; usando CSV.", tabela)
        removido = csv_store.deletar_linha(tabela, campo_id, valor_id)
        return removido

    if removido:
        try:
            csv_store.deletar_linha(tabela, campo_id, valor_id)
        except Exception as erro:
            logger.error("Falha ao espelhar delete de %s no CSV: %s", tabela, erro)
    return removido