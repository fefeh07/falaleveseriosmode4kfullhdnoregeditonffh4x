from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
 
from database import get_db
from models import Psicologo
from schemas import PsicologoCreate, PsicologoResponse
 
router = APIRouter(prefix="/psicologos", tags=["Psicologo"])
 
 
@router.get("/", response_model=list[PsicologoResponse])
def listar_psicologos(db: Session = Depends(get_db)):
    return db.query(Psicologo).all()
 
 
@router.post(
    "/",
    response_model=PsicologoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_psicologo(dados: PsicologoCreate, db: Session = Depends(get_db)):
    psicologo = Psicologo(**dados.model_dump())
    db.add(psicologo)
    db.commit()
    db.refresh(psicologo)
    return psicologo
 