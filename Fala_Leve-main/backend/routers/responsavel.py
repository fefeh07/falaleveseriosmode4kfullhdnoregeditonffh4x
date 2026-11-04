"""Router da tabela responsavel."""

from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, StringConstraints, field_validator

import database as db
from routers._crud import criar_router_crud


Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]


class ResponsavelCreate(BaseModel):
    nome_responsavel: Nome
    cpf_responsavel: str
    rg_responsavel: str | None = None
    pagamento_responsavel: str | None = None
    telefone_responsavel: str | None = None
    email_responsavel: EmailStr
    estado_responsavel: str | None = None
    cidade_responsavel: str | None = None
    bairro_responsavel: str | None = None
    rua_responsavel: str | None = None
    numero_responsavel: str | None = None
    endereco_responsavel: str | None = None
    cep_responsavel: str | None = None
    data_nascimento_responsavel: date | None = None
    id_metodo_pagamento: int | None = None

    @field_validator("cpf_responsavel")
    @classmethod
    def checar_cpf(cls, v):
        from main import validar_cpf  # import tardio p/ evitar ciclo
        return validar_cpf(v)

    @field_validator("email_responsavel")
    @classmethod
    def minusculo(cls, v):
        return v.lower()


class ResponsavelOut(ResponsavelCreate):
    id_responsavel: int
    criado_em: datetime


router = criar_router_crud(
    prefixo="/responsaveis",
    tag="Responsaveis",
    tabela=db.RESPONSAVEL,
    colunas=db.COLUNAS_RESPONSAVEL,
    campo_id="id_responsavel",
    modelo_create=ResponsavelCreate,
    modelo_out=ResponsavelOut,
)