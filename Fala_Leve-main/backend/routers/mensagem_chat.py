"""Router da tabela mensagem_chat."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints

import database as db
from routers._crud import criar_router_crud


class MensagemCreate(BaseModel):
    id_paciente: int
    id_psicologo: int
    enviado_por: Literal["paciente", "psicologo"]
    conteudo_texto: Annotated[str, StringConstraints(min_length=1)]


class MensagemOut(MensagemCreate):
    id_mensagem: int
    data_envio: datetime


router = criar_router_crud(
    prefixo="/mensagens",
    tag="Mensagens",
    tabela=db.MENSAGEM_CHAT,
    colunas=db.COLUNAS_MENSAGEM,
    campo_id="id_mensagem",
    modelo_create=MensagemCreate,
    modelo_out=MensagemOut,
)