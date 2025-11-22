from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from models.database_models import (
    Usuario, Projeto, Entrega, TipoUsuario, EtapaProjeto, MensagemRelatorio, ConfiguracaoSistema
)
from database import get_db
from typing import List
from datetime import datetime
import re
import os
import shutil

router = APIRouter()

# Mapeamento das etapas válidas
ETAPAS_VALIDAS = [
    "envio_proposta",
    "apresentacao_proposta",
    "validacao",
    "relatorio_mensal_1",
    "relatorio_mensal_2",
    "relatorio_mensal_3",
    "relatorio_mensal_4",
    "relatorio_parcial",
    "relatorio_mensal_5",
    "apresentacao_amostra",
    "artigo_final",
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
                "prazo": e.prazo.isoformat() if e.prazo else None,
                "projeto_id": e.projeto_id,
                "status_aprovacao_orientador": e.status_aprovacao_orientador,
                "status_aprovacao_coordenador": e.status_aprovacao_coordenador,
                "feedback_orientador": e.feedback_orientador,
                "feedback_coordenador": e.feedback_coordenador,
                "data_avaliacao_orientador": e.data_avaliacao_orientador.isoformat() if e.data_avaliacao_orientador else None,
                "data_avaliacao_coordenador": e.data_avaliacao_coordenador.isoformat() if e.data_avaliacao_coordenador else None
            }
            for e in entregas
        ]
    }

@router.patch("/coordenadores/entregas/{projeto_id}/{entrega_id}/status")
async def validar_entrega(projeto_id: int, entrega_id: int, novo_status: str, db: Session = Depends(get_db)):
    """
    Atualizar status de aprovação de uma entrega pelo coordenador.
    Filtra por projeto_id e entrega_id para maior segurança.
    Status válidos: 'aprovado', 'rejeitado', 'em_revisao', 'pendente'
    """
    # Buscar entrega com filtro duplo (projeto + entrega)
    entrega = db.query(Entrega).filter(
        Entrega.projeto_id == projeto_id,
        Entrega.id == entrega_id
    ).first()
    
    if not entrega:
        raise HTTPException(status_code=404, detail="Entrega não encontrada")
    
    # Validar status
    status_validos = ['aprovado', 'rejeitado', 'em_revisao', 'pendente']
    if novo_status not in status_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Use: {', '.join(status_validos)}"
        )
    
    # Atualizar status de aprovação do coordenador (CORRIGIDO)
    entrega.status_aprovacao_coordenador = novo_status
    entrega.data_avaliacao_coordenador = datetime.now()
    
    db.commit()
    db.refresh(entrega)
    
    return {
        "message": "Status da entrega atualizado com sucesso",
        "entrega": {
            "id": entrega.id,
            "projeto_id": entrega.projeto_id,
            "tipo": entrega.tipo,
            "titulo": entrega.titulo,
            "status_aprovacao_coordenador": novo_status,
            "data_avaliacao": entrega.data_avaliacao_coordenador.isoformat() if entrega.data_avaliacao_coordenador else None
        }
    }

@router.post("/coordenadores/relatorio-parcial/{entrega_id}/avaliar")
async def avaliar_relatorio_parcial(
    entrega_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Coordenador avalia o relatório parcial após aprovação do orientador.
    """
    aprovar = dados.get('aprovar', False)
    feedback = dados.get('feedback', '')
    
    entrega = db.query(Entrega).filter(
        Entrega.id == entrega_id,
        Entrega.tipo == "relatorio_parcial"
    ).first()
    
    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relatório parcial não encontrado"
        )
    
    # Verificar se o orientador já aprovou
    if entrega.status_aprovacao_orientador != "aprovado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O relatório parcial precisa ser aprovado pelo orientador primeiro"
        )
    
    # Atualizar status de aprovação do coordenador
    if aprovar:
        entrega.status_aprovacao_coordenador = "aprovado"
    else:
        entrega.status_aprovacao_coordenador = "rejeitado"
    
    entrega.feedback_coordenador = feedback
    entrega.data_avaliacao_coordenador = datetime.now()
    
    db.commit()
    db.refresh(entrega)
    
    return {
        "message": "Relatório parcial avaliado com sucesso",
        "entrega_id": entrega.id,
        "status_aprovacao_coordenador": entrega.status_aprovacao_coordenador,
        "feedback": feedback
    }

@router.post("/coordenadores/apresentacao-amostra/{entrega_id}/avaliar")
async def avaliar_apresentacao_amostra(
    entrega_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Coordenador avalia a apresentação na amostra após aprovação do orientador.
    """
    aprovar = dados.get('aprovar', False)
    feedback = dados.get('feedback', '')
    
    entrega = db.query(Entrega).filter(
        Entrega.id == entrega_id,
        Entrega.tipo == "apresentacao"
    ).first()
    
    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação na amostra não encontrada"
        )
    
    # Verificar se o orientador já aprovou
    if entrega.status_aprovacao_orientador != "aprovado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A apresentação precisa ser aprovada pelo orientador primeiro"
        )
    
    # Atualizar status de aprovação do coordenador
    if aprovar:
        entrega.status_aprovacao_coordenador = "aprovado"
    else:
        entrega.status_aprovacao_coordenador = "rejeitado"
    
    entrega.feedback_coordenador = feedback
    entrega.data_avaliacao_coordenador = datetime.now()
    
    db.commit()
    db.refresh(entrega)
    
    return {
        "message": "Apresentação na amostra avaliada com sucesso",
        "entrega_id": entrega.id,
        "status_aprovacao_coordenador": entrega.status_aprovacao_coordenador,
        "feedback": feedback
    }

@router.post("/coordenadores/artigo-final/{entrega_id}/avaliar")
async def avaliar_artigo_final(
    entrega_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Coordenador avalia o artigo final após aprovação do orientador.
    """
    aprovar = dados.get('aprovar', False)
    feedback = dados.get('feedback', '')
    
    entrega = db.query(Entrega).filter(
        Entrega.id == entrega_id,
        Entrega.tipo == "artigo_final"
    ).first()
    
    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artigo final não encontrado"
        )
    
    # Verificar se o orientador já aprovou
    if entrega.status_aprovacao_orientador != "aprovado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O artigo final precisa ser aprovado pelo orientador primeiro"
        )
    
    # Atualizar status de aprovação do coordenador
    if aprovar:
        entrega.status_aprovacao_coordenador = "aprovado"
    else:
        entrega.status_aprovacao_coordenador = "rejeitado"
    
    entrega.feedback_coordenador = feedback
    entrega.data_avaliacao_coordenador = datetime.now()
    
    db.commit()
    db.refresh(entrega)
    
    return {
        "message": "Artigo final avaliado com sucesso",
        "entrega_id": entrega.id,
        "status_aprovacao_coordenador": entrega.status_aprovacao_coordenador,
        "feedback": feedback
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

@router.get("/coordenadores/configuracoes/inscricoes")
async def obter_status_inscricoes(db: Session = Depends(get_db)):
    """
    Retorna o status atual das inscrições (abertas ou fechadas) e o ano ativo.
    """
    # Buscar configuração do ano ativo
    config_ano = db.query(ConfiguracaoSistema).filter(
        ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
    ).first()
    
    ano_ativo = int(config_ano.valor) if config_ano else datetime.now().year
    
    # Buscar configuração de inscrições abertas
    config = db.query(ConfiguracaoSistema).filter(
        ConfiguracaoSistema.chave == 'inscricoes_abertas'
    ).first()
    
    if not config:
        # Se não existir, criar com valor padrão (abertas)
        config = ConfiguracaoSistema(
            chave='inscricoes_abertas',
            valor='true',
            descricao='Define se as inscrições para iniciação científica estão abertas',
            ano=datetime.now().year,
            data_atualizacao=datetime.now()
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    
    inscricoes_abertas = config.valor.lower() == 'true'
    
    return {
        "inscricoes_abertas": inscricoes_abertas,
        "ano_ativo": ano_ativo,
        "data_atualizacao": config.data_atualizacao.isoformat() if config.data_atualizacao else None,
        "atualizado_por": config.atualizado_por
    }

@router.post("/coordenadores/configuracoes/inscricoes/toggle")
async def alternar_status_inscricoes(
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Alterna o status das inscrições (abre ou fecha) para um ano específico.
    Requer: coordenador_id, abrir (true/false), e ano (opcional) no corpo da requisição.
    """
    coordenador_id = dados.get('coordenador_id')
    novo_status = dados.get('abrir')  # True para abrir, False para fechar
    ano = dados.get('ano', datetime.now().year)  # Ano das inscrições
    
    if coordenador_id is None:
        raise HTTPException(status_code=400, detail="ID do coordenador é obrigatório")
    
    if novo_status is None:
        raise HTTPException(status_code=400, detail="Campo 'abrir' é obrigatório (true/false)")
    
    # Verificar se o usuário é coordenador
    coordenador = db.query(Usuario).filter(
        Usuario.id == coordenador_id,
        Usuario.tipo == TipoUsuario.coordenador
    ).first()
    
    if not coordenador:
        raise HTTPException(status_code=403, detail="Apenas coordenadores podem alterar este status")
    
    # Atualizar o ano ativo se estiver abrindo inscrições
    if novo_status:
        config_ano = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
        ).first()
        
        if not config_ano:
            config_ano = ConfiguracaoSistema(
                chave='ano_ativo_inscricoes',
                valor=str(ano),
                descricao='Ano ativo para as inscrições de iniciação científica',
                data_atualizacao=datetime.now(),
                atualizado_por=coordenador_id
            )
            db.add(config_ano)
        else:
            config_ano.valor = str(ano)
            config_ano.data_atualizacao = datetime.now()
            config_ano.atualizado_por = coordenador_id
    
    # Buscar ou criar configuração de inscrições abertas
    config = db.query(ConfiguracaoSistema).filter(
        ConfiguracaoSistema.chave == 'inscricoes_abertas'
    ).first()
    
    if not config:
        config = ConfiguracaoSistema(
            chave='inscricoes_abertas',
            valor='true' if novo_status else 'false',
            descricao='Define se as inscrições para iniciação científica estão abertas',
            ano=ano,
            data_atualizacao=datetime.now(),
            atualizado_por=coordenador_id
        )
        db.add(config)
    else:
        config.valor = 'true' if novo_status else 'false'
        config.ano = ano
        config.data_atualizacao = datetime.now()
        config.atualizado_por = coordenador_id
    
    db.commit()
    db.refresh(config)
    
    status_texto = "abertas" if novo_status else "fechadas"
    
    return {
        "message": f"Inscrições {status_texto} para o ano {ano} com sucesso!",
        "inscricoes_abertas": novo_status,
        "ano": ano,
        "data_atualizacao": config.data_atualizacao.isoformat(),
        "atualizado_por": coordenador.nome
    }


@router.get("/coordenadores/apresentacoes/alunos")
async def listar_alunos_para_apresentacao(
    db: Session = Depends(get_db)
):
    """
    Lista todos os alunos que estão na etapa de apresentação (apresentacao_proposta)
    """
    try:
        # Buscar todos os projetos na etapa de apresentação
        projetos = db.query(Projeto).filter(
            Projeto.etapa_atual == EtapaProjeto.apresentacao_proposta
        ).all()
        
        alunos_apresentacao = []
        for projeto in projetos:
            aluno = db.query(Usuario).filter(Usuario.id == projeto.aluno_id).first()
            orientador = db.query(Usuario).filter(Usuario.id == projeto.orientador_id).first()
            
            if aluno:
                alunos_apresentacao.append({
                    "projeto_id": projeto.id,
                    "aluno_id": aluno.id,
                    "nome": aluno.nome,
                    "email": aluno.email,
                    "curso": aluno.curso,
                    "matricula": aluno.matricula,
                    "projeto_titulo": projeto.titulo,
                    "area_conhecimento": projeto.area_conhecimento,
                    "orientador_nome": orientador.nome if orientador else "Não atribuído",
                    "apresentacao_data": projeto.apresentacao_data,
                    "apresentacao_hora": projeto.apresentacao_hora,
                    "apresentacao_campus": projeto.apresentacao_campus,
                    "apresentacao_sala": projeto.apresentacao_sala,
                    "status_apresentacao": projeto.status_apresentacao,
                    "feedback_apresentacao": projeto.feedback_apresentacao,
                })
        
        return {
            "alunos": alunos_apresentacao,
            "total": len(alunos_apresentacao)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar alunos: {str(e)}")


@router.patch("/coordenadores/apresentacoes/agendar")
async def agendar_apresentacoes(
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Agenda data, hora e campus para as apresentações de todos os alunos na etapa apresentacao_proposta
    """
    try:
        data = dados.get('data')
        hora = dados.get('hora')
        campus = dados.get('campus')
        
        if not data or not hora or not campus:
            raise HTTPException(
                status_code=400, 
                detail="Data, hora e campus são obrigatórios"
            )
        
        # Buscar todos os projetos na etapa de apresentação
        projetos = db.query(Projeto).filter(
            Projeto.etapa_atual == EtapaProjeto.apresentacao_proposta
        ).all()
        
        if not projetos:
            raise HTTPException(
                status_code=404,
                detail="Nenhum aluno encontrado na etapa de apresentação"
            )
        
        # Atualizar todos os projetos
        projetos_atualizados = 0
        for projeto in projetos:
            projeto.apresentacao_data = data
            projeto.apresentacao_hora = hora
            projeto.apresentacao_campus = campus
            projetos_atualizados += 1
        
        db.commit()
        
        return {
            "message": f"Apresentações agendadas com sucesso para {projetos_atualizados} aluno(s)",
            "total_agendado": projetos_atualizados,
            "data": data,
            "hora": hora,
            "campus": campus
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao agendar apresentações: {str(e)}")


@router.patch("/coordenadores/apresentacoes/{projeto_id}")
async def atualizar_apresentacao_individual(
    projeto_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Atualiza data, hora e campus de apresentação para um projeto específico
    """
    try:
        projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
        
        if not projeto:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        
        # Atualizar campos se fornecidos
        if 'data' in dados:
            projeto.apresentacao_data = dados['data']
        if 'hora' in dados:
            projeto.apresentacao_hora = dados['hora']
        if 'campus' in dados:
            projeto.apresentacao_campus = dados['campus']
        if 'sala' in dados:
            projeto.apresentacao_sala = dados['sala']
        
        db.commit()
        
        return {
            "message": "Apresentação atualizada com sucesso",
            "projeto_id": projeto.id,
            "apresentacao_data": projeto.apresentacao_data,
            "apresentacao_hora": projeto.apresentacao_hora,
            "apresentacao_campus": projeto.apresentacao_campus,
            "apresentacao_sala": projeto.apresentacao_sala
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar apresentação: {str(e)}")


@router.patch("/coordenadores/apresentacoes/{projeto_id}/avaliar")
async def avaliar_apresentacao(
    projeto_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Aprovar ou recusar a proposta após a apresentação.
    Espera: { "decisao": "aprovado" | "rejeitado", "feedback": "texto..." }
    """
    try:
        from models.database_models import Inscricao, StatusInscricao
        
        projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
        
        if not projeto:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        
        decisao = dados.get('decisao')
        feedback = dados.get('feedback', '')
        
        if decisao not in ['aprovado', 'rejeitado']:
            raise HTTPException(status_code=400, detail="Decisão inválida. Use 'aprovado' ou 'rejeitado'")
        
        # Atualizar status da apresentação no projeto
        projeto.status_apresentacao = decisao
        projeto.feedback_apresentacao = feedback
        projeto.data_avaliacao_apresentacao = datetime.now()
        
        # Atualizar inscrição correspondente
        if projeto.inscricao_id:
            inscricao = db.query(Inscricao).filter(Inscricao.id == projeto.inscricao_id).first()
            if inscricao:
                if decisao == 'aprovado':
                    inscricao.status = StatusInscricao.aprovada
                    inscricao.feedback_coordenador = feedback
                    inscricao.data_avaliacao_coordenador = datetime.now()
                    
                    # Mantém na etapa de apresentação - coordenador mudará manualmente quando necessário
                    # projeto.etapa_atual permanece como apresentacao_proposta
                else:
                    inscricao.status = StatusInscricao.rejeitada_apresentacao
                    inscricao.feedback_coordenador = feedback
                    inscricao.data_avaliacao_coordenador = datetime.now()
        
        db.commit()
        
        return {
            "message": f"Apresentação {decisao} com sucesso",
            "projeto_id": projeto.id,
            "status_apresentacao": projeto.status_apresentacao,
            "etapa_atual": projeto.etapa_atual.value
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao avaliar apresentação: {str(e)}")


@router.get("/coordenadores/apresentacoes-amostra/alunos")
async def listar_alunos_apresentacao_amostra(
    db: Session = Depends(get_db)
):
    """
    Lista todos os alunos que têm apresentação na amostra aprovada (tipo='apresentacao' e coordenador aprovou)
    """
    try:
        # Buscar entregas do tipo apresentacao que foram aprovadas
        entregas_aprovadas = db.query(Entrega).filter(
            Entrega.tipo == "apresentacao",
            Entrega.status_aprovacao_orientador == "aprovado",
            Entrega.status_aprovacao_coordenador == "aprovado"
        ).all()
        
        alunos_amostra = []
        for entrega in entregas_aprovadas:
            projeto = db.query(Projeto).filter(Projeto.id == entrega.projeto_id).first()
            if not projeto:
                continue
                
            aluno = db.query(Usuario).filter(Usuario.id == projeto.aluno_id).first()
            orientador = db.query(Usuario).filter(Usuario.id == projeto.orientador_id).first()
            
            if aluno:
                alunos_amostra.append({
                    "projeto_id": projeto.id,
                    "entrega_id": entrega.id,  # ID da entrega para aprovação
                    "aluno_id": aluno.id,
                    "nome": aluno.nome,
                    "email": aluno.email,
                    "curso": aluno.curso,
                    "matricula": aluno.matricula,
                    "projeto_titulo": projeto.titulo,
                    "area_conhecimento": projeto.area_conhecimento,
                    "orientador_nome": orientador.nome if orientador else "Não atribuído",
                    "amostra_data": getattr(projeto, 'amostra_data', None),
                    "amostra_hora": getattr(projeto, 'amostra_hora', None),
                    "amostra_campus": getattr(projeto, 'amostra_campus', None),
                    "amostra_sala": getattr(projeto, 'amostra_sala', None),
                    "status_amostra": getattr(projeto, 'status_amostra', 'pendente'),
                    "status_aprovacao_coordenador": entrega.status_aprovacao_coordenador,
                    "feedback_coordenador": entrega.feedback_coordenador,
                    "data_avaliacao_coordenador": entrega.data_avaliacao_coordenador.isoformat() if entrega.data_avaliacao_coordenador else None,
                })
        
        return {
            "alunos": alunos_amostra,
            "total": len(alunos_amostra)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar alunos: {str(e)}")


@router.patch("/coordenadores/apresentacoes-amostra/{projeto_id}")
async def agendar_apresentacao_amostra(
    projeto_id: int,
    dados: dict,
    db: Session = Depends(get_db)
):
    """
    Agenda data, hora, campus e sala para a apresentação na amostra de um aluno específico
    """
    try:
        projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
        
        if not projeto:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        
        data = dados.get('data')
        hora = dados.get('hora')
        campus = dados.get('campus')
        sala = dados.get('sala')
        
        if not all([data, hora, campus, sala]):
            raise HTTPException(
                status_code=400,
                detail="Data, hora, campus e sala são obrigatórios"
            )
        
        # Atualizar dados da apresentação na amostra (verificar se atributos existem)
        if hasattr(projeto, 'amostra_data'):
            projeto.amostra_data = data
            projeto.amostra_hora = hora
            projeto.amostra_campus = campus
            projeto.amostra_sala = sala
            projeto.status_amostra = "agendado"
        else:
            raise HTTPException(
                status_code=500,
                detail="Campos de apresentação na amostra não existem no banco. Execute a migração primeiro."
            )
        
        db.commit()
        db.refresh(projeto)
        
        return {
            "message": "Apresentação na amostra agendada com sucesso",
            "projeto_id": projeto.id,
            "amostra_data": projeto.amostra_data,
            "amostra_hora": projeto.amostra_hora,
            "amostra_campus": projeto.amostra_campus,
            "amostra_sala": projeto.amostra_sala
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao agendar apresentação na amostra: {str(e)}")


@router.post("/coordenadores/projetos/{projeto_id}/certificado")
async def enviar_certificado(
    projeto_id: int,
    certificado: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Fazer upload do certificado de conclusão para um aluno.
    Apenas coordenadores podem enviar certificados.
    """
    # Buscar projeto
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Verificar se o projeto está concluído
    if projeto.etapa_atual != EtapaProjeto.concluido:
        raise HTTPException(
            status_code=400,
            detail="O projeto precisa estar concluído para receber o certificado"
        )
    
    # Validar tipo de arquivo (apenas PDF)
    if not certificado.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Apenas arquivos PDF são permitidos para certificados"
        )
    
    # Criar diretório se não existir
    upload_dir = "uploads/certificados"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Gerar nome único para o arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    aluno_nome = projeto.aluno.nome.replace(" ", "_")
    filename = f"certificado_{aluno_nome}_{timestamp}.pdf"
    file_path = os.path.join(upload_dir, filename)
    
    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(certificado.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar certificado: {str(e)}"
        )
    
    # Atualizar projeto com informações do certificado
    projeto.certificado_arquivo = filename
    projeto.certificado_data_emissao = datetime.now()
    
    db.commit()
    db.refresh(projeto)
    
    return {
        "message": "Certificado enviado com sucesso",
        "projeto_id": projeto.id,
        "aluno_nome": projeto.aluno.nome,
        "certificado_arquivo": filename,
        "data_emissao": projeto.certificado_data_emissao.isoformat()
    }


@router.get("/coordenadores/projetos/{projeto_id}/certificado")
async def verificar_certificado(projeto_id: int, db: Session = Depends(get_db)):
    """
    Verificar se um projeto tem certificado emitido.
    """
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    return {
        "projeto_id": projeto.id,
        "tem_certificado": projeto.certificado_arquivo is not None,
        "certificado_arquivo": projeto.certificado_arquivo,
        "data_emissao": projeto.certificado_data_emissao.isoformat() if projeto.certificado_data_emissao else None
    }


