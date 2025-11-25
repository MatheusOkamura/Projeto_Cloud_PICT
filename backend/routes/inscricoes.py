from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from models.database_models import (
    Inscricao as InscricaoModel, 
    Usuario, 
    StatusInscricao,
    Projeto,
    EtapaProjeto,
    ConfiguracaoSistema,
    Entrega,
    RelatorioMensal
)
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path
from database import get_db

router = APIRouter()

# Diretório para salvar arquivos (em produção, usar S3 ou similar)
UPLOAD_DIR = Path("uploads/propostas")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/inscricoes/status")
def verificar_status_inscricoes(db: Session = Depends(get_db)):
    """
    Endpoint público para verificar se as inscrições estão abertas e qual o ano ativo.
    Usado pelo frontend para mostrar mensagens apropriadas aos alunos.
    """
    try:
        # Buscar configuração de inscrições abertas
        config = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'inscricoes_abertas'
        ).first()
        
        # Buscar ano ativo
        config_ano = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
        ).first()
        
        inscricoes_abertas = True  # Padrão
        data_atualizacao = None
        ano_ativo = datetime.now().year  # Padrão
        
        if config:
            inscricoes_abertas = config.valor.lower() == 'true'
            data_atualizacao = config.data_atualizacao.isoformat() if config.data_atualizacao else None
        
        if config_ano:
            ano_ativo = int(config_ano.valor)
        
        return {
            "inscricoes_abertas": inscricoes_abertas,
            "ano_ativo": ano_ativo,
            "mensagem": f"As inscrições estão abertas para o ano {ano_ativo}!" if inscricoes_abertas else "As inscrições estão fechadas no momento.",
            "data_atualizacao": data_atualizacao
        }
    except Exception as e:
        # Retornar True como padrão em caso de erro
        return {
            "inscricoes_abertas": True,
            "ano_ativo": datetime.now().year,
            "mensagem": "As inscrições estão abertas!",
            "data_atualizacao": None
        }

@router.post("/inscricoes/proposta", status_code=status.HTTP_201_CREATED)
async def submeter_proposta(
    usuario_id: int = Form(...),
    titulo_projeto: str = Form(...),
    area_conhecimento: str = Form(...),
    orientador_id: int = Form(...),
    descricao: str = Form(...),
    objetivos: Optional[str] = Form(None),
    metodologia: Optional[str] = Form(None),
    resultados_esperados: Optional[str] = Form(None),
    projeto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Submeter nova proposta de iniciação científica.
    Verifica se as inscrições estão abertas e usa o ano ativo definido pelo coordenador.
    """
    # Verificar se as inscrições estão abertas
    config = db.query(ConfiguracaoSistema).filter(
        ConfiguracaoSistema.chave == 'inscricoes_abertas'
    ).first()
    
    inscricoes_abertas = True  # Padrão se não houver configuração
    if config:
        inscricoes_abertas = config.valor.lower() == 'true'
    
    if not inscricoes_abertas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="As inscrições estão fechadas no momento. Entre em contato com a coordenação para mais informações."
        )
    
    # Buscar ano ativo das inscrições
    config_ano = db.query(ConfiguracaoSistema).filter(
        ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
    ).first()
    
    ano_ativo = int(config_ano.valor) if config_ano else datetime.now().year
    
    # Buscar dados do usuário no banco de dados
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Buscar dados do orientador
    orientador = db.query(Usuario).filter(Usuario.id == orientador_id).first()
    orientador_nome = orientador.nome if orientador else "Orientador não encontrado"
    
    # Salvar arquivo se fornecido
    arquivo_nome = None
    if projeto:
        # Gerar nome único para o arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        arquivo_nome = f"{usuario_id}_{timestamp}_{projeto.filename}"
        arquivo_path = UPLOAD_DIR / arquivo_nome
        
        # Salvar arquivo
        with open(arquivo_path, "wb") as buffer:
            content = await projeto.read()
            buffer.write(content)
    
    # Criar proposta no banco de dados
    nova_inscricao = InscricaoModel(
        usuario_id=usuario_id,
        ano=ano_ativo,  # Usar o ano ativo definido pelo coordenador
        nome=usuario.nome,
        email=usuario.email,
        cpf=usuario.cpf,
        telefone=usuario.telefone,
        curso=usuario.curso,
        matricula=usuario.matricula,
        unidade=usuario.unidade,
        cr=usuario.cr,
        titulo_projeto=titulo_projeto,
        area_conhecimento=area_conhecimento,
        descricao=descricao,
        objetivos=objetivos,
        metodologia=metodologia,
        resultados_esperados=resultados_esperados,
        arquivo_projeto=arquivo_nome,
        status=StatusInscricao.pendente_orientador,  # Começa aguardando orientador
        data_submissao=datetime.now(),
        orientador_id=orientador_id,
        orientador_nome=orientador_nome
    )
    
    db.add(nova_inscricao)
    db.commit()
    db.refresh(nova_inscricao)
    
    return {
        "message": "Proposta submetida com sucesso",
        "proposta_id": nova_inscricao.id,
        "status": nova_inscricao.status.value,
        "data_submissao": nova_inscricao.data_submissao.isoformat()
    }

@router.post("/inscricoes", status_code=status.HTTP_201_CREATED)
async def criar_inscricao(
    nome: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    curso: str = Form(...),
    tipo: str = Form(...),
    telefone: str = Form(...),
    projeto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Criar nova inscrição.
    """
    # Salvar arquivo se fornecido
    arquivo_nome = None
    if projeto:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        arquivo_nome = f"{cpf}_{timestamp}_{projeto.filename}"
        arquivo_path = UPLOAD_DIR / arquivo_nome
        
        with open(arquivo_path, "wb") as buffer:
            content = await projeto.read()
            buffer.write(content)
    
    # Criar inscrição no banco
    nova_inscricao = InscricaoModel(
        usuario_id=0,  # Será atualizado quando o usuário for criado
        nome=nome,
        email=email,
        cpf=cpf,
        telefone=telefone,
        curso=curso,
        titulo_projeto="",
        area_conhecimento="",
        descricao="",
        arquivo_projeto=arquivo_nome,
        status=StatusInscricao.pendente,
        data_submissao=datetime.now()
    )
    
    db.add(nova_inscricao)
    db.commit()
    db.refresh(nova_inscricao)
    
    return {
        "message": "Inscrição criada com sucesso",
        "inscricao_id": nova_inscricao.id,
        "status": nova_inscricao.status.value
    }

@router.get("/inscricoes/usuario/{usuario_id}")
async def obter_inscricao_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Obter inscrição/proposta de um usuário específico.
    Retorna a inscrição mais recente (última submetida).
    """
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.usuario_id == usuario_id
    ).order_by(InscricaoModel.data_submissao.desc()).first()  # Ordenar por data de submissão, mais recente primeiro
    
    if not inscricao:
        return {
            "tem_proposta": False,
            "message": "Usuário não possui proposta submetida"
        }
    
    return {
        "tem_proposta": True,
        "inscricao": {
            "id": inscricao.id,
            "usuario_id": inscricao.usuario_id,
            "nome": inscricao.nome,
            "email": inscricao.email,
            "cpf": inscricao.cpf,
            "telefone": inscricao.telefone,
            "curso": inscricao.curso,
            "matricula": inscricao.matricula,
            "unidade": inscricao.unidade,
            "cr": inscricao.cr,
            "titulo_projeto": inscricao.titulo_projeto,
            "area_conhecimento": inscricao.area_conhecimento,
            "descricao": inscricao.descricao,
            "objetivos": inscricao.objetivos,
            "metodologia": inscricao.metodologia,
            "resultados_esperados": inscricao.resultados_esperados,
            "arquivo_projeto": inscricao.arquivo_projeto,
            "status": inscricao.status.value,
            "feedback": inscricao.feedback,
            "feedback_orientador": inscricao.feedback_orientador,
            "feedback_coordenador": inscricao.feedback_coordenador,
            "status_aprovacao_orientador": inscricao.status_aprovacao_orientador,
            "status_aprovacao_coordenador": inscricao.status_aprovacao_coordenador,
            "data_submissao": inscricao.data_submissao.isoformat() if inscricao.data_submissao else None,
            "data_avaliacao_orientador": inscricao.data_avaliacao_orientador.isoformat() if inscricao.data_avaliacao_orientador else None,
            "data_avaliacao_coordenador": inscricao.data_avaliacao_coordenador.isoformat() if inscricao.data_avaliacao_coordenador else None,
            "data_avaliacao": inscricao.data_avaliacao.isoformat() if inscricao.data_avaliacao else None,
            "orientador_nome": inscricao.orientador_nome,
            "orientador_id": inscricao.orientador_id
        }
    }

@router.get("/inscricoes", response_model=List[dict])
async def listar_inscricoes(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Listar todas as inscrições com filtros opcionais.
    """
    query = db.query(InscricaoModel)
    
    if status:
        try:
            status_enum = StatusInscricao(status)
            query = query.filter(InscricaoModel.status == status_enum)
        except ValueError:
            pass
    
    inscricoes = query.all()
    
    resultado = []
    for i in inscricoes:
        # Buscar projeto associado para obter a etapa
        projeto = db.query(Projeto).filter(Projeto.inscricao_id == i.id).first()
        
        # Se tem projeto, usar a etapa do projeto
        # Se não tem projeto (ainda pendente), considerar como "envio_proposta"
        if projeto:
            etapa = projeto.etapa_atual.value
        else:
            # Inscrições pendentes ou em análise são consideradas na etapa de envio_proposta
            etapa = "envio_proposta"
        
        resultado.append({
            "id": i.id,
            "usuario_id": i.usuario_id,
            "nome": i.nome,
            "email": i.email,
            "cpf": i.cpf,
            "telefone": i.telefone,
            "curso": i.curso,
            "matricula": i.matricula,
            "unidade": i.unidade,
            "cr": i.cr,
            "titulo_projeto": i.titulo_projeto,
            "area_conhecimento": i.area_conhecimento,
            "descricao": i.descricao,
            "objetivos": i.objetivos,
            "metodologia": i.metodologia,
            "resultados_esperados": i.resultados_esperados,
            "arquivo_projeto": i.arquivo_projeto,
            "status": i.status.value,
            "data_submissao": i.data_submissao.isoformat() if i.data_submissao else None,
            "orientador_nome": i.orientador_nome,
            "orientador_id": i.orientador_id,
            "feedback_orientador": i.feedback_orientador,
            "status_aprovacao_orientador": i.status_aprovacao_orientador,
            "data_avaliacao_orientador": i.data_avaliacao_orientador.isoformat() if i.data_avaliacao_orientador else None,
            "feedback_coordenador": i.feedback_coordenador,
            "status_aprovacao_coordenador": i.status_aprovacao_coordenador,
            "data_avaliacao_coordenador": i.data_avaliacao_coordenador.isoformat() if i.data_avaliacao_coordenador else None,
            "etapa": etapa,  # Adicionar etapa do projeto ou envio_proposta se pendente
            "ano": i.ano  # Adicionar ano da inscrição
        })
    
    return resultado

@router.get("/inscricoes/orientador/{orientador_id}/pendentes")
async def listar_propostas_pendentes_orientador(
    orientador_id: int,
    db: Session = Depends(get_db)
):
    """
    Listar propostas que aguardam avaliação de um orientador específico.
    """
    inscricoes = db.query(InscricaoModel).filter(
        InscricaoModel.orientador_id == orientador_id,
        InscricaoModel.status == StatusInscricao.pendente_orientador
    ).all()
    
    return {
        "total": len(inscricoes),
        "propostas": [
            {
                "id": i.id,
                "usuario_id": i.usuario_id,
                "nome": i.nome,
                "email": i.email,
                "curso": i.curso,
                "titulo_projeto": i.titulo_projeto,
                "area_conhecimento": i.area_conhecimento,
                "descricao": i.descricao,
                "objetivos": i.objetivos,
                "metodologia": i.metodologia,
                "resultados_esperados": i.resultados_esperados,
                "arquivo_projeto": i.arquivo_projeto,
                "status": i.status.value,
                "data_submissao": i.data_submissao.isoformat() if i.data_submissao else None
            }
            for i in inscricoes
        ]
    }

@router.get("/inscricoes/coordenador/pendentes")
async def listar_propostas_pendentes_coordenador(db: Session = Depends(get_db)):
    """
    Listar propostas que aguardam avaliação do coordenador.
    """
    inscricoes = db.query(InscricaoModel).filter(
        InscricaoModel.status == StatusInscricao.pendente_coordenador
    ).all()
    
    return {
        "total": len(inscricoes),
        "propostas": [
            {
                "id": i.id,
                "usuario_id": i.usuario_id,
                "nome": i.nome,
                "email": i.email,
                "curso": i.curso,
                "titulo_projeto": i.titulo_projeto,
                "area_conhecimento": i.area_conhecimento,
                "descricao": i.descricao,
                "objetivos": i.objetivos,
                "metodologia": i.metodologia,
                "resultados_esperados": i.resultados_esperados,
                "arquivo_projeto": i.arquivo_projeto,
                "status": i.status.value,
                "orientador_id": i.orientador_id,
                "orientador_nome": i.orientador_nome,
                "data_submissao": i.data_submissao.isoformat() if i.data_submissao else None,
                "data_avaliacao_orientador": i.data_avaliacao_orientador.isoformat() if i.data_avaliacao_orientador else None,
                "feedback_orientador": i.feedback_orientador
            }
            for i in inscricoes
        ]
    }

@router.get("/inscricoes/{inscricao_id}")
async def obter_inscricao(inscricao_id: int, db: Session = Depends(get_db)):
    """
    Obter detalhes de uma inscrição específica.
    """
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.id == inscricao_id
    ).first()
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    return {
        "id": inscricao.id,
        "usuario_id": inscricao.usuario_id,
        "nome": inscricao.nome,
        "email": inscricao.email,
        "cpf": inscricao.cpf,
        "telefone": inscricao.telefone,
        "curso": inscricao.curso,
        "matricula": inscricao.matricula,
        "unidade": inscricao.unidade,
        "cr": inscricao.cr,
        "titulo_projeto": inscricao.titulo_projeto,
        "area_conhecimento": inscricao.area_conhecimento,
        "descricao": inscricao.descricao,
        "objetivos": inscricao.objetivos,
        "metodologia": inscricao.metodologia,
        "resultados_esperados": inscricao.resultados_esperados,
        "arquivo_projeto": inscricao.arquivo_projeto,
        "status": inscricao.status.value,
        "feedback": inscricao.feedback,
        "feedback_orientador": inscricao.feedback_orientador,
        "feedback_coordenador": inscricao.feedback_coordenador,
        "data_submissao": inscricao.data_submissao.isoformat() if inscricao.data_submissao else None,
        "data_avaliacao_orientador": inscricao.data_avaliacao_orientador.isoformat() if inscricao.data_avaliacao_orientador else None,
        "data_avaliacao_coordenador": inscricao.data_avaliacao_coordenador.isoformat() if inscricao.data_avaliacao_coordenador else None,
        "data_avaliacao": inscricao.data_avaliacao.isoformat() if inscricao.data_avaliacao else None,
        "orientador_id": inscricao.orientador_id,
        "orientador_nome": inscricao.orientador_nome
    }

@router.patch("/inscricoes/{inscricao_id}/status")
async def atualizar_status(
    inscricao_id: int,
    novo_status: str,
    feedback: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Atualizar status de uma inscrição (rota legada).
    DEPRECATED: Use as rotas específicas /orientador/avaliar ou /coordenador/avaliar
    """
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.id == inscricao_id
    ).first()
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    # Validar status
    try:
        status_enum = StatusInscricao(novo_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status inválido. Use: pendente_orientador, pendente_coordenador, aprovada, rejeitada_orientador, rejeitada_coordenador"
        )
    
    # Atualizar status da inscrição
    inscricao.status = status_enum
    if feedback:
        inscricao.feedback = feedback
    inscricao.data_avaliacao = datetime.now()
    
    # Se a proposta foi aprovada, criar o projeto
    if status_enum == StatusInscricao.aprovada:
        # Verificar se já existe um projeto para esta inscrição
        projeto_existente = db.query(Projeto).filter(
            Projeto.inscricao_id == inscricao_id
        ).first()
        
        if not projeto_existente:
            # Criar novo projeto
            novo_projeto = Projeto(
                aluno_id=inscricao.usuario_id,
                orientador_id=inscricao.orientador_id,
                inscricao_id=inscricao_id,
                titulo=inscricao.titulo_projeto,
                area_conhecimento=inscricao.area_conhecimento,
                descricao=inscricao.descricao,
                objetivos=inscricao.objetivos,
                metodologia=inscricao.metodologia,
                etapa_atual=EtapaProjeto.envio_proposta,
                data_inicio=datetime.now()
            )
            
            db.add(novo_projeto)
    
    db.commit()
    
    return {
        "message": "Status atualizado com sucesso",
        "inscricao_id": inscricao_id,
        "novo_status": status_enum.value
    }

@router.post("/inscricoes/{inscricao_id}/orientador/avaliar")
async def orientador_avaliar(
    inscricao_id: int,
    aprovar: bool = Form(...),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Orientador avalia a proposta (primeira etapa de aprovação).
    
    - aprovar=true: Aprova e envia para coordenador
    - aprovar=false: Rejeita a proposta
    """
    print(f"🔍 Avaliando proposta {inscricao_id}: aprovar={aprovar}, feedback={feedback}")
    
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.id == inscricao_id
    ).first()
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    # Verificar se está no status correto
    if inscricao.status != StatusInscricao.pendente_orientador:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proposta não está aguardando avaliação do orientador. Status atual: {inscricao.status.value}"
        )
    
    # Atualizar status conforme decisão
    if aprovar:
        inscricao.status = StatusInscricao.pendente_coordenador
        inscricao.status_aprovacao_orientador = "aprovado"
        mensagem = "Proposta aprovada pelo orientador. Aguardando avaliação do coordenador."
    else:
        inscricao.status = StatusInscricao.rejeitada_orientador
        inscricao.status_aprovacao_orientador = "rejeitado"
        mensagem = "Proposta rejeitada pelo orientador."
    
    inscricao.feedback_orientador = feedback
    inscricao.data_avaliacao_orientador = datetime.now()
    
    db.commit()
    db.refresh(inscricao)
    
    print(f"✅ Proposta avaliada: novo status = {inscricao.status.value}")
    
    return {
        "message": mensagem,
        "inscricao_id": inscricao_id,
        "status": inscricao.status.value,
        "proxima_etapa": "coordenador" if aprovar else None
    }

@router.post("/inscricoes/{inscricao_id}/coordenador/avaliar")
async def coordenador_avaliar(
    inscricao_id: int,
    aprovar: bool = Form(...),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Coordenador avalia a proposta (segunda etapa de aprovação).
    
    - aprovar=true: Aprova definitivamente e cria o projeto
    - aprovar=false: Rejeita a proposta
    """
    print(f"🔍 Coordenador avaliando proposta {inscricao_id}: aprovar={aprovar}, feedback={feedback}")
    
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.id == inscricao_id
    ).first()
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    # Verificar se está no status correto
    if inscricao.status != StatusInscricao.pendente_coordenador:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proposta não está aguardando avaliação do coordenador. Status atual: {inscricao.status.value}"
        )
    
    # Atualizar status conforme decisão
    if aprovar:
        inscricao.status = StatusInscricao.pendente_apresentacao  # Mudança aqui
        inscricao.status_aprovacao_coordenador = "aprovado"
        mensagem = "Proposta aprovada pelo coordenador. Aguardando apresentação e validação final!"
        
        # Obter o ano ativo das inscrições
        config_ano = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
        ).first()
        ano_projeto = int(config_ano.valor) if config_ano else datetime.now().year
        
        # Criar o projeto
        projeto_existente = db.query(Projeto).filter(
            Projeto.inscricao_id == inscricao_id
        ).first()
        
        if not projeto_existente:
            novo_projeto = Projeto(
                aluno_id=inscricao.usuario_id,
                orientador_id=inscricao.orientador_id,
                inscricao_id=inscricao_id,
                titulo=inscricao.titulo_projeto,
                area_conhecimento=inscricao.area_conhecimento,
                descricao=inscricao.descricao,
                objetivos=inscricao.objetivos,
                metodologia=inscricao.metodologia,
                etapa_atual=EtapaProjeto.apresentacao_proposta,  # Aguardando apresentação
                data_inicio=datetime.now(),
                status_apresentacao="pendente",  # Status inicial da apresentação
                ano=ano_projeto  # Usar o ano definido pelo coordenador
            )
            db.add(novo_projeto)
    else:
        inscricao.status = StatusInscricao.rejeitada_coordenador
        inscricao.status_aprovacao_coordenador = "rejeitado"
        mensagem = "Proposta rejeitada pelo coordenador."
    
    inscricao.feedback_coordenador = feedback
    inscricao.data_avaliacao_coordenador = datetime.now()
    inscricao.data_avaliacao = datetime.now()  # Data final de avaliação
    
    db.commit()
    db.refresh(inscricao)
    
    return {
        "message": mensagem,
        "inscricao_id": inscricao_id,
        "status": inscricao.status.value,
        "projeto_criado": aprovar
    }

@router.delete("/inscricoes/{inscricao_id}")
async def deletar_inscricao(inscricao_id: int, db: Session = Depends(get_db)):
    """
    Deletar uma inscrição e o projeto associado.
    """
    inscricao = db.query(InscricaoModel).filter(
        InscricaoModel.id == inscricao_id
    ).first()
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    # Buscar e deletar o projeto associado (se existir)
    projeto = db.query(Projeto).filter(Projeto.inscricao_id == inscricao_id).first()
    if projeto:
        # Deletar entregas relacionadas ao projeto
        db.query(Entrega).filter(Entrega.projeto_id == projeto.id).delete()
        # Deletar relatórios mensais relacionados ao projeto
        db.query(RelatorioMensal).filter(RelatorioMensal.projeto_id == projeto.id).delete()
        # Deletar o projeto
        db.delete(projeto)
    
    # Deletar a inscrição
    db.delete(inscricao)
    db.commit()
    
    return {"message": "Inscrição e dados associados deletados com sucesso"}

