"""
main.py — API FastAPI da clínica.

Continua sendo o ponto de entrada. Cada tabela tem seu próprio router em
routers/. Este arquivo monta o app, expõe as validações de CPF/CRP,
trata os erros do banco e serve o frontend em /static (via "/").
"""

import re
from pathlib import Path

from argon2 import PasswordHasher
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import database as db
from routers import (
    assinatura,
    ficha_clinica,
    mensagem_chat,
    metodo_pagamento,
    paciente,
    psicologo,
    responsavel,
    sessao_video,
)

app = FastAPI(
    title="Clínica — API",
    description="Cadastros e operações da clínica (FastAPI + Supabase).",
    version="2.0.0",
)

hasher = PasswordHasher()

# ================================================================ CORS
# Libera para o frontend funcionar também via Live Server (5500).
# Em produção troque allow_origins pelo domínio real.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================================ Validações
def validar_cpf(cpf: str) -> str:
    """Aceita '529.982.247-25' ou '52998224725'. Confere os dígitos e devolve só os números."""
    numeros = re.sub(r"[^0-9]", "", cpf)
    if len(numeros) != 11 or numeros == numeros[0] * 11:
        raise ValueError("CPF inválido")
    for posicao in (9, 10):
        soma = sum(int(numeros[i]) * (posicao + 1 - i) for i in range(posicao))
        if (soma * 10 % 11) % 10 != int(numeros[posicao]):
            raise ValueError("CPF inválido")
    return numeros


def validar_crp(crp: str) -> str:
    """Aceita 'CRP 08/12345', 'crp-08/12345' ou '08/12345'. Devolve '08/12345'."""
    limpo = re.sub(r"[\s\-]", "", crp.upper()).removeprefix("CRP")
    if not re.fullmatch(r"[0-9]{2}/[0-9]{3,6}", limpo):
        raise ValueError("CRP inválido — use o formato 08/12345 (região/número)")
    return limpo


# ============================================================== Rotas (API)
for modulo in (
    metodo_pagamento,
    responsavel,
    paciente,
    psicologo,
    assinatura,
    mensagem_chat,
    sessao_video,
    ficha_clinica,
):
    app.include_router(modulo.router)


# ============================================================== Erros
ROTULOS_CAMPOS = {
    "cpf_paciente": "CPF", "cpf_psicologo": "CPF", "cpf_responsavel": "CPF",
    "email_paciente": "e-mail", "email_psicologo": "e-mail",
    "email_responsavel": "e-mail",
    "crp_psicologo": "CRP",
}


@app.exception_handler(db.RegistroDuplicado)
async def tratar_registro_duplicado(request: Request, erro: db.RegistroDuplicado):
    rotulo = ROTULOS_CAMPOS.get(erro.campo)
    detalhe = (f"Já existe um cadastro com este {rotulo}."
               if rotulo else "Já existe um cadastro com estes dados.")
    return JSONResponse(status_code=status.HTTP_409_CONFLICT,
                        content={"detail": detalhe})


@app.exception_handler(db.ErroDeBanco)
async def tratar_erro_de_banco(request: Request, erro: db.ErroDeBanco):
    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        content={"detail": str(erro)})


ZeroDivisionError

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True)