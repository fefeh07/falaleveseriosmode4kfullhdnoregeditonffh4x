from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
 
from database import get_db
from models import MetodoPagamento
from schemas import MetodoPagamentoCreate, MetodoPagamentoResponse
 
router = APIRouter(prefix="/metodos-pagamento", tags=["MetodoPagamento"])
 
 
@router.get("/", response_model=list[MetodoPagamentoResponse])
def listar_metodos_pagamento(db: Session = Depends(get_db)):
    return db.query(MetodoPagamento).all()
 
 
@router.post(
    "/",
    response_model=MetodoPagamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_metodo_pagamento(dados: MetodoPagamentoCreate, db: Session = Depends(get_db)):
    metodo = MetodoPagamento(**dados.model_dump())
    db.add(metodo)
    db.commit()
    db.refresh(metodo)
    return metodo
 