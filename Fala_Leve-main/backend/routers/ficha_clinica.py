"""Router da tabela ficha_clinica."""

from datetime import date, datetime

from pydantic import BaseModel

import database as db
from routers._crud import criar_router_crud


class FichaCreate(BaseModel):
    id_paciente: int
    id_psicologo: int
    data_registro: date | None = None
    anotacoes_avaliacao: str | None = None
    diagnostico_observado: str | None = None


class FichaOut(FichaCreate):
    id_ficha: int
    criado_em: datetime


router = criar_router_crud(
    prefixo="/fichas-clinicas",
    tag="Fichas Clinicas",
    tabela=db.FICHA_CLINICA,
    colunas=db.COLUNAS_FICHA,
    campo_id="id_ficha",
    modelo_create=FichaCreate,
    modelo_out=FichaOut,
)