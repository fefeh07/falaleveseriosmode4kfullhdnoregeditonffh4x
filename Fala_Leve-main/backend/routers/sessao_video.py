"""Router da tabela sessao_video."""

from datetime import date, datetime, time

from pydantic import BaseModel

import database as db
from routers._crud import criar_router_crud


class SessaoCreate(BaseModel):
    id_paciente: int
    id_psicologo: int
    data_sessao: date
    hora_inicio: time
    hora_fim: time
    status_sessao: str = "agendada"


class SessaoOut(SessaoCreate):
    id_sessao: int
    criado_em: datetime


router = criar_router_crud(
    prefixo="/sessoes",
    tag="Sessoes",
    tabela=db.SESSAO_VIDEO,
    colunas=db.COLUNAS_SESSAO,
    campo_id="id_sessao",
    modelo_create=SessaoCreate,
    modelo_out=SessaoOut,
)