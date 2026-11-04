"""Fábrica de router CRUD genérico — usada pelos 8 routers de tabela."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

import database as db


def preparar_registro(dados: BaseModel, tem_senha: bool) -> dict:
    """Serializa o modelo. Se tem senha, troca por hash Argon2."""
    if tem_senha:
        from main import hasher  # import tardio p/ evitar ciclo main ↔ routers
        registro = dados.model_dump(
            exclude={"senha"},
            mode="json",          # 👈 CONVERTE date/time/Decimal para texto
        )
        registro["senha_hash"] = hasher.hash(dados.senha)
        return registro
    return dados.model_dump(exclude_none=True, mode="json")


def criar_router_crud(
    *,
    prefixo: str,
    tag: str,
    tabela: str,
    colunas: str,
    campo_id: str,
    modelo_create: type[BaseModel],
    modelo_out: type[BaseModel],
    tem_senha: bool = False,
) -> APIRouter:
    router = APIRouter(prefix=prefixo, tags=[tag])

    @router.post("", response_model=modelo_out, status_code=status.HTTP_201_CREATED,
                 summary=f"Cadastrar {tag.lower()}")
    def criar(dados: modelo_create):  # type: ignore
        return db.inserir(tabela, preparar_registro(dados, tem_senha))

    @router.get("", response_model=list[modelo_out], summary=f"Listar {tag.lower()}")
    def listar(
        limite: Annotated[int, Query(ge=1, le=200)] = 50,
        offset: Annotated[int, Query(ge=0)] = 0,
    ):
        return db.listar(tabela, colunas, limite, offset)

    @router.get("/{registro_id}", response_model=modelo_out,
                summary=f"Buscar {tag.lower()} por ID")
    def buscar(registro_id: int):
        r = db.buscar_por_id(tabela, colunas, campo_id, registro_id)
        if r is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado.")
        return r

    @router.delete("/{registro_id}", status_code=status.HTTP_204_NO_CONTENT,
                   summary=f"Excluir {tag.lower()}")
    def excluir(registro_id: int):
        if not db.deletar(tabela, campo_id, registro_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado.")

    return router