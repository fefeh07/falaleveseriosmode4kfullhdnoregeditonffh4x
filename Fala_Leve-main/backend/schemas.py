
from datetime import date
 
from pydantic import BaseModel, ConfigDict
 
 
class PsicologoCreate(BaseModel):
    """O que a API espera receber no POST (sem o id, que o banco gera)."""
 
    nome_psicologo: str
    cpf_psicologo: str
    rg_psicologo: str
    crp_psicologo: str
    regiao_psicologo: str
    status_psicologo: str = "Aguardando Aprovação"
    data_formacao_psicologo: date
    email_psicologo: str
    telefone_psicologo: str
    area_especialidade: str
    data_nascimento_psicologo: date
 
 
class PsicologoResponse(PsicologoCreate):
    """O que a API devolve (já com o id gerado pelo banco)."""
 
    id_psicologo: int
 
    model_config = ConfigDict(from_attributes=True)
 
 
class MetodoPagamentoCreate(BaseModel):
    descricao: str
 
 
class MetodoPagamentoResponse(MetodoPagamentoCreate):
    id_metodo: int
 
    model_config = ConfigDict(from_attributes=True)
 