
from datetime import date
 
from sqlalchemy import Date, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
 
from database import Base
 
 
class Psicologo(Base):
    __tablename__ = "psicologo"
    __table_args__ = (
        # CRP é regional no Brasil: só é único combinado com a região.
        UniqueConstraint("crp_psicologo", "regiao_psicologo", name="uq_crp_regiao"),
    )
 
    id_psicologo: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome_psicologo: Mapped[str] = mapped_column(String)
    cpf_psicologo: Mapped[str] = mapped_column(String, unique=True)
    rg_psicologo: Mapped[str] = mapped_column(String)
    crp_psicologo: Mapped[str] = mapped_column(String)
    regiao_psicologo: Mapped[str] = mapped_column(String)
    # Cadastro começa como "Aguardando Aprovação" até liberação manual.
    status_psicologo: Mapped[str] = mapped_column(String, default="Aguardando Aprovação")
    data_formacao_psicologo: Mapped[date] = mapped_column(Date)
    email_psicologo: Mapped[str] = mapped_column(String, unique=True)
    telefone_psicologo: Mapped[str] = mapped_column(String)
    area_especialidade: Mapped[str] = mapped_column(Text)
    data_nascimento_psicologo: Mapped[date] = mapped_column(Date)
 
 
class MetodoPagamento(Base):
    __tablename__ = "metodo_pagamento"
 
    id_metodo: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[str] = mapped_column(String)
 