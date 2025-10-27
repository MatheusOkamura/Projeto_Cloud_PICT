from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, Projeto, Entrega, TipoUsuario, EtapaProjeto
)
from database import get_db
from typing import List

router = APIRouter()

# Mapeamento das etapas válidas
ETAPAS_VALIDAS = [
    "inscricao",
    "desenvolvimento",
    "relatorio_parcial",
    "apresentacao",
    "relatorio_final",
    "concluido"
]

@router.get("/coordenadores/alunos")
async def listar_todos_alunos(db: Session = Depends(get_db)):
    """
    Listar todos os alunos com seus projetos.
    """
    projetos = db.query(Projeto).all()
    
    alunos = []
    for projeto in projetos:
        aluno = projeto.aluno
        orientador = projeto.orientador
        
        alunos.append({
            "aluno_id": aluno.id,
            "nome": aluno.nome,
            "curso": aluno.curso,
            "projeto_id": projeto.id,
            "projeto_titulo": projeto.titulo,
            "orientador_id": orientador.id if orientador else None,
            "orientador_nome": orientador.nome if orientador else None,
            "etapa": projeto.etapa_atual.value,
            "data_inicio": projeto.data_inicio.isoformat() if projeto.data_inicio else None
        })
    
    return {"alunos": alunos}

@router.get("/coordenadores/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa(aluno_id: int, db: Session = Depends(get_db)):
    """
    Obter status/etapa de um aluno específico.
    """
    projeto = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).first()
    
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    return {
        "aluno_id": aluno_id,
        "orientador_id": projeto.orientador_id,
        "etapa": projeto.etapa_atual.value,
        "etapas_validas": ETAPAS_VALIDAS
    }

@router.get("/coordenadores/alunos/{aluno_id}/entregas")
async def listar_entregas_do_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Listar entregas de um aluno específico.
    """
    projeto = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).first()
    
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    entregas = db.query(Entrega).filter(Entrega.projeto_id == projeto.id).all()
    
    return {
        "aluno_id": aluno_id,
        "projeto_id": projeto.id,
        "entregas": [
            {
                "id": e.id,
                "tipo": e.tipo,
                "titulo": e.titulo,
                "descricao": e.descricao,
                "arquivo": e.arquivo,
                "data_entrega": e.data_entrega.isoformat() if e.data_entrega else None,
                "prazo": e.prazo.isoformat() if e.prazo else None
            }
            for e in entregas
        ]
    }

@router.patch("/coordenadores/entregas/{entrega_id}/status")
async def validar_entrega(entrega_id: int, novo_status: str, db: Session = Depends(get_db)):
    """
    Atualizar status de uma entrega.
    Status válidos: 'aprovado', 'rejeitado', 'em_revisao', 'pendente'
    """
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega não encontrada")
    
    # Validar status (você pode criar um Enum para isso se preferir)
    status_validos = ['aprovado', 'rejeitado', 'em_revisao', 'pendente']
    if novo_status not in status_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Use: {', '.join(status_validos)}"
        )
    
    # Atualizar descrição com status (ou criar campo separado)
    entrega.descricao = f"{entrega.descricao}\nStatus: {novo_status}"
    
    db.commit()
    db.refresh(entrega)
    
    return {
        "message": "Status da entrega atualizado",
        "entrega": {
            "id": entrega.id,
            "tipo": entrega.tipo,
            "titulo": entrega.titulo,
            "status": novo_status
        }
    }

@router.patch("/coordenadores/alunos/{aluno_id}/status-etapa")
async def atualizar_status_etapa(aluno_id: int, novo_status: str, db: Session = Depends(get_db)):
    """
    Atualizar etapa/status de um projeto.
    Apenas coordenadores podem alterar a etapa.
    """
    if novo_status not in ETAPAS_VALIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Use: {', '.join(ETAPAS_VALIDAS)}"
        )
    
    projeto = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).first()
    
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Converter string para enum
    try:
        etapa_enum = EtapaProjeto(novo_status)
        projeto.etapa_atual = etapa_enum
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Etapa inválida. Use: {', '.join(ETAPAS_VALIDAS)}"
        )
    
    db.commit()
    db.refresh(projeto)
    
    return {
        "message": "Status da etapa atualizado com sucesso",
        "aluno_id": aluno_id,
        "etapa": projeto.etapa_atual.value
    }
