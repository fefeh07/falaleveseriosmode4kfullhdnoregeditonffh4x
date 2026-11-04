"""Router da tabela metodo_pagamento."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

import database as db
from routers._crud import criar_router_crud


class MetodoPagamentoCreate(BaseModel):
    descricao: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class MetodoPagamentoOut(MetodoPagamentoCreate):
    id_metodo: int


router = criar_router_crud(
    prefixo="/metodos-pagamento",
    tag="Metodos de Pagamento",
    tabela=db.METODO_PAGAMENTO,
    colunas=db.COLUNAS_METODO,
    campo_id="id_metodo",
    modelo_create=MetodoPagamentoCreate,
    modelo_out=MetodoPagamentoOut,
)