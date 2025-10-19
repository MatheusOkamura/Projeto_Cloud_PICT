from fastapi import APIRouter, HTTPException
from typing import List
from .orientadores import orientadores_alunos_db, ETAPAS_VALIDAS, entregas_db

router = APIRouter()

@router.get("/coordenadores/alunos")
async def listar_todos_alunos():
    alunos = []
    for orientador_id, lista in orientadores_alunos_db.items():
        alunos.extend([{**a, "orientador_id": orientador_id} for a in lista])
    return {"alunos": alunos}

@router.get("/coordenadores/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa(aluno_id: int):
    for orientador_id, alunos in orientadores_alunos_db.items():
        projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
        if projeto:
            return {"aluno_id": aluno_id, "orientador_id": orientador_id, "etapa": projeto.get("etapa", "proposta"), "etapas_validas": ETAPAS_VALIDAS}
    raise HTTPException(status_code=404, detail="Aluno não encontrado")

@router.get("/coordenadores/alunos/{aluno_id}/entregas")
async def listar_entregas_do_aluno(aluno_id: int):
    # localizar projeto_id
    for orientador_id, alunos in orientadores_alunos_db.items():
        projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
        if projeto:
            projeto_id = projeto["projeto_id"]
            return {"aluno_id": aluno_id, "projeto_id": projeto_id, "entregas": entregas_db.get(projeto_id, [])}
    raise HTTPException(status_code=404, detail="Aluno não encontrado")

@router.patch("/coordenadores/entregas/{projeto_id}/{entrega_id}/status")
async def validar_entrega(projeto_id: int, entrega_id: int, novo_status: str):
    # novo_status: 'aprovado' | 'rejeitado' | 'em revisão' | 'pendente'
    lista = entregas_db.get(projeto_id)
    if not lista:
        raise HTTPException(status_code=404, detail="Projeto sem entregas")
    for e in lista:
        if e.get("id") == entrega_id:
            e["status"] = novo_status
            return {"message": "Status da entrega atualizado", "entrega": e}
    raise HTTPException(status_code=404, detail="Entrega não encontrada")

@router.patch("/coordenadores/alunos/{aluno_id}/status-etapa")
async def atualizar_status_etapa(aluno_id: int, novo_status: str):
    if novo_status not in ETAPAS_VALIDAS:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use: {', '.join(ETAPAS_VALIDAS)}")
    for orientador_id, alunos in orientadores_alunos_db.items():
        for a in alunos:
            if a["aluno_id"] == aluno_id:
                a["etapa"] = novo_status
                return {"message": "Status da etapa atualizado com sucesso", "aluno_id": aluno_id, "etapa": novo_status}
    raise HTTPException(status_code=404, detail="Aluno não encontrado")
