from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, 
    Projeto,
    Entrega,
    TipoUsuario,
    EtapaProjeto
)
from typing import Optional
from datetime import datetime
import os
from pathlib import Path
from database import get_db

router = APIRouter()

# Diretórios para salvar arquivos
UPLOAD_DIR_RELATORIOS = Path("uploads/relatorios")
UPLOAD_DIR_ENTREGAS = Path("uploads/entregas")
UPLOAD_DIR_RELATORIOS.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR_ENTREGAS.mkdir(parents=True, exist_ok=True)

@router.get("/alunos/{aluno_id}/projeto")
async def obter_projeto_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Obter projeto do aluno.
    """
    # Buscar o projeto do aluno
    projeto = db.query(Projeto).filter(
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        return {
            "tem_projeto": False,
            "message": "Aluno não possui projeto aprovado"
        }
    
    # Buscar orientador
    orientador = db.query(Usuario).filter(Usuario.id == projeto.orientador_id).first()
    
    return {
        "tem_projeto": True,
        "projeto": {
            "id": projeto.id,
            "titulo": projeto.titulo,
            "area_conhecimento": projeto.area_conhecimento,
            "descricao": projeto.descricao,
            "objetivos": projeto.objetivos,
            "metodologia": projeto.metodologia,
            "etapa_atual": projeto.etapa_atual.value,
            "data_inicio": projeto.data_inicio.isoformat() if projeto.data_inicio else None,
            "orientador": {
                "id": orientador.id,
                "nome": orientador.nome,
                "email": orientador.email,
                "departamento": orientador.departamento
            } if orientador else None
        }
    }

@router.post("/alunos/{aluno_id}/entrega-etapa", status_code=status.HTTP_201_CREATED)
async def enviar_entrega_etapa(
    aluno_id: int,
    etapa: str = Form(...),
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Aluno envia entrega de uma etapa do projeto.
    
    Etapas possíveis:
    - relatorio_parcial: Relatório parcial do projeto
    - apresentacao: Apresentação de amostra
    - artigo_final: Artigo final do projeto
    - relatorio_mensal: Relatório mensal (pode ser enviado múltiplas vezes)
    """
    print(f"📤 Aluno {aluno_id} enviando {etapa}")
    
    # Verificar se o aluno existe
    aluno = db.query(Usuario).filter(
        Usuario.id == aluno_id,
        Usuario.tipo == TipoUsuario.aluno
    ).first()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Buscar projeto do aluno
    projeto = db.query(Projeto).filter(
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não possui projeto aprovado. Aguarde a aprovação da sua proposta."
        )
    
    # Validar etapa
    etapas_validas = ['relatorio_parcial', 'apresentacao', 'artigo_final', 'relatorio_mensal']
    if etapa not in etapas_validas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Etapa inválida. Use: {', '.join(etapas_validas)}"
        )
    
    # Verificar se já existe entrega desta etapa (exceto para relatorio_mensal que pode ser múltiplo)
    if etapa != 'relatorio_mensal':
        entrega_existente = db.query(Entrega).filter(
            Entrega.aluno_id == aluno_id,
            Entrega.tipo == etapa
        ).first()
        
        if entrega_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Você já enviou {titulos.get(etapa, etapa)}. Não é possível enviar novamente."
            )
    
    # Definir título baseado na etapa
    titulos = {
        'relatorio_parcial': 'Relatório Parcial',
        'apresentacao': 'Apresentação de Amostra',
        'artigo_final': 'Artigo Final',
        'relatorio_mensal': 'Relatório Mensal'
    }
    titulo = titulos.get(etapa, etapa)
    
    # Salvar arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    extensao = os.path.splitext(arquivo.filename)[1]
    arquivo_nome = f"{aluno_id}_{etapa}_{timestamp}{extensao}"
    arquivo_path = UPLOAD_DIR_ENTREGAS / arquivo_nome
    
    try:
        with open(arquivo_path, "wb") as buffer:
            content = await arquivo.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar arquivo: {str(e)}"
        )
    
    # Criar registro de entrega
    nova_entrega = Entrega(
        projeto_id=projeto.id,
        aluno_id=aluno_id,
        tipo=etapa,
        titulo=titulo,
        descricao=descricao or "",
        arquivo=arquivo_nome,
        data_entrega=datetime.now()
    )
    
    db.add(nova_entrega)
    
    # Atualizar etapa do projeto se necessário
    if etapa == 'relatorio_parcial' and projeto.etapa_atual == EtapaProjeto.relatorio_parcial:
        # Já está na etapa correta, apenas registra a entrega
        pass
    elif etapa == 'apresentacao' and projeto.etapa_atual == EtapaProjeto.apresentacao_amostra:
        # Já está na etapa correta
        pass
    elif etapa == 'artigo_final' and projeto.etapa_atual == EtapaProjeto.artigo_final:
        # Já está na etapa correta
        pass
    
    db.commit()
    db.refresh(nova_entrega)
    
    print(f"✅ Entrega criada com sucesso: ID {nova_entrega.id}")
    
    return {
        "message": f"{titulo} enviado com sucesso!",
        "entrega_id": nova_entrega.id,
        "tipo": etapa,
        "arquivo": arquivo_nome,
        "data_entrega": nova_entrega.data_entrega.isoformat(),
        "projeto_etapa_atual": projeto.etapa_atual.value
    }

@router.get("/alunos/{aluno_id}/entregas")
async def listar_entregas_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Listar todas as entregas de um aluno.
    """
    # Verificar se o aluno existe
    aluno = db.query(Usuario).filter(
        Usuario.id == aluno_id,
        Usuario.tipo == TipoUsuario.aluno
    ).first()
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )
    
    # Buscar todas as entregas do aluno
    entregas = db.query(Entrega).filter(
        Entrega.aluno_id == aluno_id
    ).order_by(Entrega.data_entrega.desc()).all()
    
    return {
        "aluno_id": aluno_id,
        "total_entregas": len(entregas),
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

@router.get("/alunos/{aluno_id}/verificar-entrega/{tipo}")
async def verificar_entrega_enviada(aluno_id: int, tipo: str, db: Session = Depends(get_db)):
    """
    Verificar se o aluno já enviou uma entrega específica.
    """
    entrega = db.query(Entrega).filter(
        Entrega.aluno_id == aluno_id,
        Entrega.tipo == tipo
    ).first()
    
    if entrega:
        return {
            "ja_enviou": True,
            "entrega": {
                "id": entrega.id,
                "titulo": entrega.titulo,
                "descricao": entrega.descricao,
                "arquivo": entrega.arquivo,
                "data_entrega": entrega.data_entrega.isoformat() if entrega.data_entrega else None,
                "status_aprovacao_orientador": entrega.status_aprovacao_orientador,
                "status_aprovacao_coordenador": entrega.status_aprovacao_coordenador,
                "feedback_orientador": entrega.feedback_orientador,
                "feedback_coordenador": entrega.feedback_coordenador,
                "data_avaliacao_orientador": entrega.data_avaliacao_orientador.isoformat() if entrega.data_avaliacao_orientador else None,
                "data_avaliacao_coordenador": entrega.data_avaliacao_coordenador.isoformat() if entrega.data_avaliacao_coordenador else None
            }
        }
    
    return {
        "ja_enviou": False,
        "entrega": None
    }

@router.get("/alunos/{aluno_id}/timeline")
async def obter_timeline_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Obter linha do tempo do projeto do aluno com todas as etapas e entregas.
    """
    # Buscar projeto
    projeto = db.query(Projeto).filter(
        Projeto.aluno_id == aluno_id
    ).first()
    
    if not projeto:
        return {
            "tem_projeto": False,
            "message": "Aluno não possui projeto aprovado"
        }
    
    # Buscar entregas
    entregas = db.query(Entrega).filter(
        Entrega.aluno_id == aluno_id
    ).order_by(Entrega.data_entrega.desc()).all()
    
    # Verificar quais etapas já foram cumpridas
    entregas_por_tipo = {}
    for entrega in entregas:
        if entrega.tipo not in entregas_por_tipo:
            entregas_por_tipo[entrega.tipo] = entrega
    
    return {
        "tem_projeto": True,
        "projeto": {
            "id": projeto.id,
            "titulo": projeto.titulo,
            "etapa_atual": projeto.etapa_atual.value,
            "data_inicio": projeto.data_inicio.isoformat() if projeto.data_inicio else None
        },
        "etapas": {
            "inscricao": {
                "concluida": True,
                "data": projeto.data_inicio.isoformat() if projeto.data_inicio else None
            },
            "desenvolvimento": {
                "concluida": projeto.etapa_atual.value not in ['inscricao', 'desenvolvimento'],
                "atual": projeto.etapa_atual.value == 'desenvolvimento'
            },
            "relatorio_parcial": {
                "concluida": 'relatorio_parcial' in entregas_por_tipo,
                "atual": projeto.etapa_atual.value == 'relatorio_parcial',
                "entrega": {
                    "id": entregas_por_tipo['relatorio_parcial'].id,
                    "data": entregas_por_tipo['relatorio_parcial'].data_entrega.isoformat()
                } if 'relatorio_parcial' in entregas_por_tipo else None
            },
            "apresentacao": {
                "concluida": 'apresentacao' in entregas_por_tipo,
                "atual": projeto.etapa_atual.value == 'apresentacao',
                "entrega": {
                    "id": entregas_por_tipo['apresentacao'].id,
                    "data": entregas_por_tipo['apresentacao'].data_entrega.isoformat()
                } if 'apresentacao' in entregas_por_tipo else None
            },
            "artigo_final": {
                "concluida": 'artigo_final' in entregas_por_tipo,
                "atual": projeto.etapa_atual.value == 'relatorio_final',
                "entrega": {
                    "id": entregas_por_tipo['artigo_final'].id,
                    "data": entregas_por_tipo['artigo_final'].data_entrega.isoformat()
                } if 'artigo_final' in entregas_por_tipo else None
            },
            "concluido": {
                "concluida": projeto.etapa_atual.value == 'concluido',
                "atual": False
            }
        },
        "total_entregas": len(entregas)
    }


@router.get("/alunos/{aluno_id}/certificado")
async def obter_certificado_aluno(aluno_id: int, db: Session = Depends(get_db)):
    """
    Verificar se o aluno tem certificado disponível.
    """
    projeto = db.query(Projeto).filter(Projeto.aluno_id == aluno_id).first()
    
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    return {
        "tem_certificado": projeto.certificado_arquivo is not None,
        "certificado_arquivo": projeto.certificado_arquivo,
        "data_emissao": projeto.certificado_data_emissao.isoformat() if projeto.certificado_data_emissao else None
    }


