from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, Projeto, Entrega, TipoUsuario, EtapaProjeto
)
from database import get_db
from typing import List, Optional
from datetime import datetime
from pathlib import Path

router = APIRouter()

# Diretórios para uploads
UPLOAD_DIR = Path("uploads/relatorios")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ENTREGAS_DIR = Path("uploads/entregas")
ENTREGAS_DIR.mkdir(parents=True, exist_ok=True)

# Mapeamento das etapas válidas
ETAPAS_VALIDAS = [
    "inscricao",
    "desenvolvimento",
    "relatorio_parcial",
    "apresentacao",
    "relatorio_final",
    "concluido"
]

@router.get("/orientadores/{orientador_id}/alunos")
async def listar_alunos_orientador(orientador_id: int, db: Session = Depends(get_db)):
    """
    Listar todos os alunos orientados por um orientador específico.
    """
    # Verificar se o orientador existe
    orientador = db.query(Usuario).filter(
        Usuario.id == orientador_id,
        Usuario.tipo == TipoUsuario.orientador
    ).first()
    
    if not orientador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orientador não encontrado"
        )
    
    # Buscar projetos do orientador
    projetos = db.query(Projeto).filter(Projeto.orientador_id == orientador_id).all()
    
    alunos = []
    for projeto in projetos:
        aluno = projeto.aluno
        alunos.append({
            "aluno_id": aluno.id,
            "nome": aluno.nome,
            "curso": aluno.curso,
            "projeto_id": projeto.id,
            "projeto_titulo": projeto.titulo,
            "status": "ativo",
            "etapa": projeto.etapa_atual.value,
            "data_inicio": projeto.data_inicio.isoformat() if projeto.data_inicio else None
        })
    
    return {"orientador_id": orientador_id, "alunos": alunos}

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/entregas")
async def listar_entregas_aluno(orientador_id: int, aluno_id: int, db: Session = Depends(get_db)):
    """
    Listar entregas de um aluno específico.
    """
    # Buscar projeto do aluno com o orientador
    projeto = db.query(Projeto).filter(
        Projeto.orientador_id == orientador_id,
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado para este orientador"
        )
    
    # Buscar entregas do projeto
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

@router.post("/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais", status_code=status.HTTP_201_CREATED)
async def enviar_relatorio_mensal(
    orientador_id: int,
    aluno_id: int,
    mes: str = Form(...),  # formato AAAA-MM
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Orientador envia relatório mensal sobre o progresso do aluno.
    """
    # Validação básica do mês
    try:
        datetime.strptime(mes + "-01", "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de mês inválido. Use AAAA-MM"
        )

    # Verificar se existe projeto entre orientador e aluno
    projeto = db.query(Projeto).filter(
        Projeto.orientador_id == orientador_id,
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado para este orientador e aluno"
        )

    # Salvar arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"relatorio_mensal_orientador{orientador_id}_aluno{aluno_id}_{mes}_{timestamp}_{arquivo.filename}"
    path = UPLOAD_DIR / safe_name
    
    with open(path, "wb") as f:
        content = await arquivo.read()
        f.write(content)

    # Criar entrega no banco
    entrega = Entrega(
        projeto_id=projeto.id,
        aluno_id=aluno_id,
        tipo="relatorio_mensal",
        titulo=f"Relatório Mensal - {mes}",
        descricao=descricao or "",
        arquivo=safe_name,
        data_entrega=datetime.now()
    )
    
    db.add(entrega)
    db.commit()
    db.refresh(entrega)

    return {
        "message": "Relatório mensal enviado com sucesso",
        "arquivo": safe_name,
        "entrega_id": entrega.id
    }

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais")
async def listar_relatorios_mensais(orientador_id: int, aluno_id: int, db: Session = Depends(get_db)):
    """
    Listar relatórios mensais de um aluno.
    """
    # Buscar projeto
    projeto = db.query(Projeto).filter(
        Projeto.orientador_id == orientador_id,
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado"
        )
    
    # Buscar relatórios mensais
    relatorios = db.query(Entrega).filter(
        Entrega.projeto_id == projeto.id,
        Entrega.tipo == "relatorio_mensal"
    ).all()
    
    return {
        "orientador_id": orientador_id,
        "aluno_id": aluno_id,
        "relatorios": [
            {
                "id": r.id,
                "titulo": r.titulo,
                "descricao": r.descricao,
                "arquivo": r.arquivo,
                "data_envio": r.data_entrega.isoformat() if r.data_entrega else None
            }
            for r in relatorios
        ]
    }

@router.post("/orientadores/{orientador_id}/alunos/{aluno_id}/entrega-etapa", status_code=status.HTTP_201_CREATED)
async def enviar_entrega_etapa(
    orientador_id: int,
    aluno_id: int,
    tipo_entrega: str = Form(...),
    titulo: str = Form(...),
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Registrar entrega de etapa do projeto.
    """
    # Buscar projeto
    projeto = db.query(Projeto).filter(
        Projeto.orientador_id == orientador_id,
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado para este orientador"
        )

    # Salvar arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"entrega_{tipo_entrega}_orientador{orientador_id}_aluno{aluno_id}_{timestamp}_{arquivo.filename}"
    path = ENTREGAS_DIR / safe_name
    
    with open(path, "wb") as f:
        content = await arquivo.read()
        f.write(content)

    # Criar entrega no banco
    entrega = Entrega(
        projeto_id=projeto.id,
        aluno_id=aluno_id,
        tipo=tipo_entrega,
        titulo=titulo,
        descricao=descricao or "",
        arquivo=safe_name,
        data_entrega=datetime.now()
    )
    
    db.add(entrega)
    db.commit()
    db.refresh(entrega)

    return {
        "message": "Entrega registrada com sucesso",
        "projeto_id": projeto.id,
        "entrega_id": entrega.id
    }

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa(orientador_id: int, aluno_id: int, db: Session = Depends(get_db)):
    """
    Obter status/etapa atual do projeto do aluno.
    """
    projeto = db.query(Projeto).filter(
        Projeto.orientador_id == orientador_id,
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado para este orientador"
        )
    
    return {
        "aluno_id": aluno_id,
        "etapa": projeto.etapa_atual.value,
        "etapas_validas": ETAPAS_VALIDAS
    }

@router.get("/projetos/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa_por_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Obter status/etapa do projeto de um aluno (busca em qualquer orientador).
    """
    projeto = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado em nenhum projeto"
        )
    
    return {
        "aluno_id": aluno_id,
        "orientador_id": projeto.orientador_id,
        "etapa": projeto.etapa_atual.value,
        "etapas_validas": ETAPAS_VALIDAS
    }

@router.get("/alunos/{aluno_id}/projetos")
async def listar_projetos_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Listar todos os projetos de um aluno.
    """
    projetos = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).all()
    
    result = []
    for projeto in projetos:
        orientador = projeto.orientador
        result.append({
            "projeto_id": projeto.id,
            "titulo": projeto.titulo,
            "area_conhecimento": projeto.area_conhecimento,
            "descricao": projeto.descricao,
            "etapa_atual": projeto.etapa_atual.value,
            "data_inicio": projeto.data_inicio.isoformat() if projeto.data_inicio else None,
            "data_conclusao": projeto.data_conclusao.isoformat() if projeto.data_conclusao else None,
            "orientador_id": orientador.id if orientador else None,
            "orientador_nome": orientador.nome if orientador else None,
            "orientador_email": orientador.email if orientador else None
        })
    
    return {
        "aluno_id": aluno_id,
        "projetos": result,
        "total": len(result)
    }
