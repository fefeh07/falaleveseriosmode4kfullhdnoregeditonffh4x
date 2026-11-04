"""Router da tabela assinatura."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

import database as db
from routers._crud import criar_router_crud


class AssinaturaCreate(BaseModel):
    id_paciente: int
    status_assinatura: str | None = None
    data_inicio: date | None = None
    data_renovacao: date | None = None
    valor_mensalidade: Decimal | None = None


class AssinaturaOut(AssinaturaCreate):
    id_assinatura: int
    criado_em: datetime


router = criar_router_crud(
    prefixo="/assinaturas",
    tag="Assinaturas",
    tabela=db.ASSINATURA,
    colunas=db.COLUNAS_ASSINATURA,
    campo_id="id_assinatura",
    modelo_create=AssinaturaCreate,
    modelo_out=AssinaturaOut,
)