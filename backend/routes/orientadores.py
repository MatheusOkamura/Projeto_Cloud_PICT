from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, Projeto, Entrega, TipoUsuario, EtapaProjeto, MensagemRelatorio
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
    entregas = db.query(Entrega).filter(Entrega.projeto_id == projeto.id).order_by(Entrega.data_entrega.desc()).all()
    
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
                "prazo": e.prazo.isoformat() if e.prazo else None,
                "status_aprovacao_orientador": e.status_aprovacao_orientador,
                "feedback_orientador": e.feedback_orientador,
                "data_avaliacao_orientador": e.data_avaliacao_orientador.isoformat() if e.data_avaliacao_orientador else None,
                "status_aprovacao_coordenador": e.status_aprovacao_coordenador,
                "feedback_coordenador": e.feedback_coordenador,
                "data_avaliacao_coordenador": e.data_avaliacao_coordenador.isoformat() if e.data_avaliacao_coordenador else None
            }
            for e in entregas
        ]
    }

@router.post("/orientadores/{orientador_id}/entregas/{entrega_id}/avaliar")
async def orientador_avaliar_entrega(
    orientador_id: int,
    entrega_id: int,
    aprovar: bool = Form(...),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Orientador avalia uma entrega do aluno (primeira etapa de aprovação).
    Similar ao fluxo de aprovação de propostas.
    
    - aprovar=true: Aprova e envia para coordenador
    - aprovar=false: Rejeita a entrega
    """
    print(f"🔍 Orientador {orientador_id} avaliando entrega {entrega_id}: aprovar={aprovar}")
    
    # Buscar entrega
    entrega = db.query(Entrega).filter(Entrega.id == entrega_id).first()
    
    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega não encontrada"
        )
    
    # Verificar se é do orientador
    projeto = db.query(Projeto).filter(
        Projeto.id == entrega.projeto_id,
        Projeto.orientador_id == orientador_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta entrega não pertence a um aluno seu"
        )
    
    # Verificar se já foi avaliada
    if entrega.status_aprovacao_orientador != "pendente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Entrega já foi avaliada. Status atual: {entrega.status_aprovacao_orientador}"
        )
    
    # Atualizar status
    if aprovar:
        entrega.status_aprovacao_orientador = "aprovado"
        # Se aprovar, fica pendente para coordenador avaliar
        entrega.status_aprovacao_coordenador = "pendente"
        mensagem = f"{entrega.titulo} aprovado pelo orientador. Aguardando avaliação do coordenador."
    else:
        entrega.status_aprovacao_orientador = "rejeitado"
        entrega.status_aprovacao_coordenador = "n/a"  # Não precisa ir para coordenador
        mensagem = f"{entrega.titulo} rejeitado pelo orientador."
    
    entrega.feedback_orientador = feedback
    entrega.data_avaliacao_orientador = datetime.now()
    
    db.commit()
    db.refresh(entrega)
    
    print(f"✅ Entrega avaliada: status_orientador = {entrega.status_aprovacao_orientador}")
    
    return {
        "message": mensagem,
        "entrega_id": entrega_id,
        "status_orientador": entrega.status_aprovacao_orientador,
        "status_coordenador": entrega.status_aprovacao_coordenador,
        "proxima_etapa": "coordenador" if aprovar else None
    }

@router.post("/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais", status_code=status.HTTP_201_CREATED)
async def enviar_relatorio_mensal(
    orientador_id: int,
    aluno_id: int,
    mes: str = Form(...),  # formato AAAA-MM
    descricao: Optional[str] = Form(None),
    arquivo: Optional[UploadFile] = File(None),  # Arquivo agora é opcional
    db: Session = Depends(get_db)
):
    """
    Orientador envia relatório mensal sobre o progresso do aluno.
    O arquivo é opcional - pode enviar apenas descrição textual.
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

    # Salvar arquivo se foi enviado
    safe_name = None
    if arquivo:
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
    
    # Para cada relatório, buscar as mensagens
    relatorios_com_mensagens = []
    for r in relatorios:
        mensagens = db.query(MensagemRelatorio).filter(
            MensagemRelatorio.entrega_id == r.id
        ).order_by(MensagemRelatorio.data_criacao.asc()).all()
        
        mensagens_list = [
            {
                "id": m.id,
                "mensagem": m.mensagem,
                "tipo_usuario": m.tipo_usuario,
                "usuario_id": m.usuario_id,
                "data_criacao": m.data_criacao.isoformat() if m.data_criacao else None
            }
            for m in mensagens
        ]
        
        relatorios_com_mensagens.append({
            "id": r.id,
            "titulo": r.titulo,
            "descricao": r.descricao,
            "arquivo": r.arquivo,
            "data_envio": r.data_entrega.isoformat() if r.data_entrega else None,
            "feedback_coordenador": r.feedback_coordenador,
            "data_feedback_coordenador": r.data_avaliacao_coordenador.isoformat() if r.data_avaliacao_coordenador else None,
            "resposta_orientador": r.feedback_orientador,
            "data_resposta_orientador": r.data_avaliacao_orientador.isoformat() if r.data_avaliacao_orientador else None,
            "mensagens": mensagens_list
        })
    
    return {
        "orientador_id": orientador_id,
        "aluno_id": aluno_id,
        "relatorios": relatorios_com_mensagens
    }

@router.post("/orientadores/relatorios-mensais/{relatorio_id}/responder")
async def orientador_responder_coordenador(
    relatorio_id: int,
    feedback_data: dict,
    db: Session = Depends(get_db)
):
    """
    Orientador responde ao feedback do coordenador sobre um relatório mensal.
    """
    # Buscar o relatório (entrega do tipo relatorio_mensal)
    relatorio = db.query(Entrega).filter(
        Entrega.id == relatorio_id,
        Entrega.tipo == "relatorio_mensal"
    ).first()
    
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório mensal não encontrado")
    
    resposta_orientador = feedback_data.get("resposta_orientador", "")
    orientador_id = feedback_data.get("orientador_id")
    
    if not resposta_orientador.strip():
        raise HTTPException(
            status_code=400,
            detail="A resposta não pode estar vazia"
        )
    
    # Criar mensagem no sistema de threading
    nova_mensagem = MensagemRelatorio(
        entrega_id=relatorio_id,
        usuario_id=orientador_id,
        mensagem=resposta_orientador,
        tipo_usuario="orientador",
        data_criacao=datetime.now()
    )
    db.add(nova_mensagem)
    
    # Ainda atualizar o campo feedback_orientador para compatibilidade
    relatorio.feedback_orientador = resposta_orientador
    relatorio.data_avaliacao_orientador = datetime.now()
    
    db.commit()
    db.refresh(relatorio)
    db.refresh(nova_mensagem)
    
    return {
        "message": "Resposta enviada com sucesso",
        "relatorio_id": relatorio.id,
        "resposta": resposta_orientador
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
