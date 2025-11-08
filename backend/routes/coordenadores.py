from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, Projeto, Entrega, TipoUsuario, EtapaProjeto, MensagemRelatorio
)
from database import get_db
from typing import List
from datetime import datetime
import re

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

@router.get("/coordenadores/orientadores/{orientador_id}/relatorios-mensais")
async def listar_relatorios_mensais_orientador(orientador_id: int, db: Session = Depends(get_db)):
    """
    Listar todos os relatórios mensais enviados por um orientador e seus alunos.
    Retorna os relatórios agrupados por aluno.
    """
    # Verificar se o orientador existe
    orientador = db.query(Usuario).filter(
        Usuario.id == orientador_id,
        Usuario.tipo == TipoUsuario.orientador
    ).first()
    
    if not orientador:
        raise HTTPException(status_code=404, detail="Orientador não encontrado")
    
    # Buscar todos os projetos do orientador
    projetos = db.query(Projeto).filter(Projeto.orientador_id == orientador_id).all()
    
    relatorios_list = []
    
    for projeto in projetos:
        # Buscar relatórios mensais de cada projeto (armazenados como Entregas do tipo "relatorio_mensal")
        relatorios = db.query(Entrega).filter(
            Entrega.projeto_id == projeto.id,
            Entrega.tipo == "relatorio_mensal"
        ).all()
        
        for relatorio in relatorios:
            # Extrair mês do título (formato: "Relatório Mensal - YYYY-MM")
            # Melhorar a lógica para garantir que o mês seja extraído corretamente
            mes = "N/A"
            if relatorio.titulo:
                # Tentar extrair o formato YYYY-MM do título
                match = re.search(r'(\d{4}-\d{2})', relatorio.titulo)
                if match:
                    mes = match.group(1)
                elif "Relatório Mensal - " in relatorio.titulo:
                    mes = relatorio.titulo.replace("Relatório Mensal - ", "").strip()
            
            # Buscar mensagens relacionadas a este relatório
            mensagens = db.query(MensagemRelatorio).filter(
                MensagemRelatorio.entrega_id == relatorio.id
            ).order_by(MensagemRelatorio.data_criacao.asc()).all()
            
            mensagens_list = [
                {
                    "id": msg.id,
                    "mensagem": msg.mensagem,
                    "tipo_usuario": msg.tipo_usuario,
                    "usuario_id": msg.usuario_id,
                    "data_criacao": msg.data_criacao.isoformat() if msg.data_criacao else None
                }
                for msg in mensagens
            ]
            
            relatorios_list.append({
                "id": relatorio.id,
                "mes": mes,
                "descricao": relatorio.descricao,
                "arquivo_url": relatorio.arquivo,
                "data_envio": relatorio.data_entrega.isoformat() if relatorio.data_entrega else None,
                "feedback_coordenador": relatorio.feedback_coordenador,
                "data_feedback_coordenador": relatorio.data_avaliacao_coordenador.isoformat() if relatorio.data_avaliacao_coordenador else None,
                "resposta_orientador": relatorio.feedback_orientador,
                "data_resposta_orientador": relatorio.data_avaliacao_orientador.isoformat() if relatorio.data_avaliacao_orientador else None,
                "mensagens": mensagens_list,
                "aluno_id": projeto.aluno_id,
                "aluno_nome": projeto.aluno.nome if projeto.aluno else None,
                "projeto_id": projeto.id,
                "projeto_titulo": projeto.titulo
            })
    
    return {
        "orientador_id": orientador_id,
        "orientador_nome": orientador.nome,
        "total_relatorios": len(relatorios_list),
        "relatorios": relatorios_list
    }

@router.post("/coordenadores/relatorios-mensais/{relatorio_id}/responder")
async def responder_relatorio_mensal(
    relatorio_id: int, 
    feedback_data: dict,
    db: Session = Depends(get_db)
):
    """
    Coordenador adiciona uma nova mensagem ao relatório mensal.
    Suporta múltiplas mensagens em sequência.
    """
    # Buscar o relatório (entrega do tipo relatorio_mensal)
    relatorio = db.query(Entrega).filter(
        Entrega.id == relatorio_id,
        Entrega.tipo == "relatorio_mensal"
    ).first()
    
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório mensal não encontrado")
    
    feedback_coordenador = feedback_data.get("feedback_coordenador", "")
    coordenador_id = feedback_data.get("coordenador_id")  # ID do coordenador que está enviando
    
    if not feedback_coordenador.strip():
        raise HTTPException(
            status_code=400,
            detail="A mensagem não pode estar vazia"
        )
    
    # Criar nova mensagem
    nova_mensagem = MensagemRelatorio(
        entrega_id=relatorio_id,
        usuario_id=coordenador_id,
        mensagem=feedback_coordenador,
        tipo_usuario="coordenador",
        data_criacao=datetime.now()
    )
    
    db.add(nova_mensagem)
    
    # Manter compatibilidade com campos antigos (última mensagem do coordenador)
    relatorio.feedback_coordenador = feedback_coordenador
    relatorio.data_avaliacao_coordenador = datetime.now()
    relatorio.status_aprovacao_coordenador = "respondido"
    
    db.commit()
    db.refresh(nova_mensagem)
    
    return {
        "message": "Mensagem enviada com sucesso",
        "relatorio_id": relatorio.id,
        "mensagem_id": nova_mensagem.id,
        "feedback": feedback_coordenador
    }

