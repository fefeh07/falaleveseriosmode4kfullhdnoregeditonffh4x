"""Router da tabela paciente."""

from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator

import database as db
from routers._crud import criar_router_crud


Nome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]


class PacienteCreate(BaseModel):
    id_responsavel: int | None = None
    nome_paciente: Nome
    cpf_paciente: str
    data_nascimento_paciente: date | None = None
    data_inicio_tratamento: date | None = None
    pagamento_paciente: str | None = None
    telefone_paciente: str | None = None
    email_paciente: EmailStr
    estado_paciente: str | None = None
    cidade_paciente: str | None = None
    bairro_paciente: str | None = None
    rua_paciente: str | None = None
    endereco_paciente: str | None = None
    cep_paciente: str | None = None
    senha: str = Field(min_length=8, max_length=128)

    @field_validator("cpf_paciente")
    @classmethod
    def checar_cpf(cls, v):
        from main import validar_cpf
        return validar_cpf(v)

    @field_validator("email_paciente")
    @classmethod
    def minusculo(cls, v):
        return v.lower()


class PacienteOut(BaseModel):
    id_paciente: int
    id_responsavel: int | None
    nome_paciente: str
    cpf_paciente: str
    data_nascimento_paciente: date | None
    data_inicio_tratamento: date | None
    pagamento_paciente: str | None
    telefone_paciente: str | None
    email_paciente: str
    estado_paciente: str | None
    cidade_paciente: str | None
    bairro_paciente: str | None
    rua_paciente: str | None
    endereco_paciente: str | None
    cep_paciente: str | None
    criado_em: datetime


router = criar_router_crud(
    prefixo="/pacientes",
    tag="Pacientes",
    tabela=db.PACIENTE,
    colunas=db.COLUNAS_PACIENTE,
    campo_id="id_paciente",
    modelo_create=PacienteCreate,
    modelo_out=PacienteOut,
    tem_senha=True,
)