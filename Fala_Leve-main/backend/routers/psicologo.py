"""Router da tabela psicologo."""

from datetime import date, datetime
from typing import Annotated

from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator

import database as db
from routers._crud import criar_router_crud
import _csv_store as csv_store  # Import necessário para o fallback do login

Nome = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)
]


# ============================================================ Modelos
class PsicologoCreate(BaseModel):
    nome_psicologo: Nome
    cpf_psicologo: str
    rg_psicologo: str | None = None
    crp_psicologo: str
    regiao_psicologo: str | None = None
    status_psicologo: str | None = None
    data_formatura_psicologo: date | None = None
    email_psicologo: EmailStr
    telefone_psicologo: str | None = None
    area_especialidade: str | None = None
    data_nascimento_psicologo: date | None = None
    senha: str = Field(min_length=8, max_length=128)

    @field_validator("cpf_psicologo")
    @classmethod
    def checar_cpf(cls, v):
        from main import validar_cpf
        return validar_cpf(v)

    @field_validator("crp_psicologo")
    @classmethod
    def checar_crp(cls, v):
        from main import validar_crp
        return validar_crp(v)

    @field_validator("email_psicologo")
    @classmethod
    def minusculo(cls, v):
        return v.lower()


class PsicologoOut(BaseModel):
    id_psicologo: int
    nome_psicologo: str
    cpf_psicologo: str
    rg_psicologo: str | None
    crp_psicologo: str
    regiao_psicologo: str | None
    status_psicologo: str | None
    data_formatura_psicologo: date | None
    email_psicologo: str
    telefone_psicologo: str | None
    area_especialidade: str | None
    data_nascimento_psicologo: date | None
    criado_em: datetime


class PsicologoLogin(BaseModel):
    email_psicologo: EmailStr
    senha: str


# ============================================================ CRUD padrão
router = criar_router_crud(
    prefixo="/psicologos",
    tag="Psicologos",
    tabela=db.PSICOLOGO,
    colunas=db.COLUNAS_PSICOLOGO,
    campo_id="id_psicologo",
    modelo_create=PsicologoCreate,
    modelo_out=PsicologoOut,
    tem_senha=True,
)


# ============================================================ Login
@router.post("/login", summary="Login do psicólogo")
def login_psicologo(dados: PsicologoLogin):
    """Confere e-mail + senha contra o hash salvo. Não devolve o hash."""
    from main import hasher
    from argon2.exceptions import VerifyMismatchError

    email = dados.email_psicologo.lower()
    candidatos = []

    # 1. Tenta buscar no Supabase
    try:
        resposta = (
            db.supabase.table(db.PSICOLOGO)
            .select("id_psicologo, nome_psicologo, email_psicologo, senha_hash")
            .eq("email_psicologo", email)
            .limit(1)
            .execute()
        )
        candidatos = resposta.data
    except Exception as erro:
        print("AVISO LOGIN PSICOLOGO (banco fora do ar):", repr(erro))
        # 2. Fallback: tenta buscar no CSV local
        reg = csv_store.buscar_um(db.PSICOLOGO, "email_psicologo", email)
        if reg:
            candidatos = [reg]

    # Se não achou em nenhum dos dois
    if not candidatos:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha incorretos."
        )

    psicologo = candidatos[0]

    # --- Confere a senha contra o hash Argon2 ---
    try:
        # O CSV retorna tudo como string, mas o hash também é string, então tá ok.
        hasher.verify(psicologo["senha_hash"], dados.senha)
    except VerifyMismatchError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha incorretos."
        )
    except Exception as erro:
        print("ERRO VERIFY ARGON2:", repr(erro))
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha incorretos."
        ) from erro

    # --- Sucesso ---
    return {
        "id_psicologo":    psicologo["id_psicologo"],
        "nome_psicologo":  psicologo["nome_psicologo"],
        "email_psicologo": psicologo["email_psicologo"],
    }