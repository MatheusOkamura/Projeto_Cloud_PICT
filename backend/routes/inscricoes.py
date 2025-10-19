from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from models.schemas import Inscricao, InscricaoCreate, MessageResponse
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path

router = APIRouter()

# Dados simulados de inscrições
# Banco de dados vazio - alunos podem submeter propostas
inscricoes_db = []

# Diretório para salvar arquivos (em produção, usar S3 ou similar)
UPLOAD_DIR = Path("uploads/propostas")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/inscricoes/proposta", status_code=status.HTTP_201_CREATED)
async def submeter_proposta(
    usuario_id: int = Form(...),
    titulo_projeto: str = Form(...),
    area_conhecimento: str = Form(...),
    descricao: str = Form(...),
    objetivos: Optional[str] = Form(None),
    metodologia: Optional[str] = Form(None),
    resultados_esperados: Optional[str] = Form(None),
    projeto: Optional[UploadFile] = File(None)
):
    """
    Submeter nova proposta de iniciação científica.
    """
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
    
    # Criar proposta
    nova_proposta = {
        "id": len(inscricoes_db) + 1,
        "usuario_id": usuario_id,
        "titulo_projeto": titulo_projeto,
        "area_conhecimento": area_conhecimento,
        "descricao": descricao,
        "objetivos": objetivos,
        "metodologia": metodologia,
        "resultados_esperados": resultados_esperados,
        "status": "em_analise",
        "data_submissao": datetime.now(),
        "arquivo_projeto": arquivo_nome,
        "feedback": None,
        "orientador_id": None
    }
    
    inscricoes_db.append(nova_proposta)
    
    return {
        "message": "Proposta submetida com sucesso",
        "proposta_id": nova_proposta["id"],
        "status": "em_analise",
        "data_submissao": nova_proposta["data_submissao"].isoformat()
    }

@router.post("/inscricoes", status_code=status.HTTP_201_CREATED)
async def criar_inscricao(
    nome: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    curso: str = Form(...),
    tipo: str = Form(...),
    telefone: str = Form(...),
    projeto: Optional[UploadFile] = File(None)
):
    """
    Criar nova inscrição.
    Em produção, salvar arquivo no servidor/cloud e dados no banco.
    """
    # Simular salvamento
    nova_inscricao = {
        "id": len(inscricoes_db) + 1,
        "nome": nome,
        "email": email,
        "cpf": cpf,
        "curso": curso,
        "tipo": tipo,
        "telefone": telefone,
        "status": "pendente",
        "data_submissao": datetime.now(),
        "arquivo_projeto": projeto.filename if projeto else None
    }
    
    inscricoes_db.append(nova_inscricao)
    
    return {
        "message": "Inscrição criada com sucesso",
        "inscricao_id": nova_inscricao["id"],
        "status": "pendente"
    }

@router.get("/inscricoes/usuario/{usuario_id}")
async def obter_inscricao_usuario(usuario_id: int):
    """
    Obter inscrição/proposta de um usuário específico.
    """
    inscricao = next((i for i in inscricoes_db if i.get("usuario_id") == usuario_id), None)
    
    if not inscricao:
        return {
            "tem_proposta": False,
            "message": "Usuário não possui proposta submetida"
        }
    
    return {
        "tem_proposta": True,
        "inscricao": inscricao
    }

@router.get("/inscricoes", response_model=List[dict])
async def listar_inscricoes(
    status: Optional[str] = None,
    tipo: Optional[str] = None
):
    """
    Listar todas as inscrições com filtros opcionais.
    """
    result = inscricoes_db
    
    if status:
        result = [i for i in result if i.get("status") == status]
    
    if tipo:
        result = [i for i in result if i.get("tipo") == tipo]
    
    return result

@router.get("/inscricoes/{inscricao_id}")
async def obter_inscricao(inscricao_id: int):
    """
    Obter detalhes de uma inscrição específica.
    """
    inscricao = next((i for i in inscricoes_db if i.get("id") == inscricao_id), None)
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    return inscricao

@router.patch("/inscricoes/{inscricao_id}/status")
async def atualizar_status(
    inscricao_id: int,
    novo_status: str,
    feedback: Optional[str] = None
):
    """
    Atualizar status de uma inscrição.
    Apenas coordenadores devem ter acesso (implementar verificação em produção).
    """
    inscricao = next((i for i in inscricoes_db if i.get("id") == inscricao_id), None)
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    # Validar status
    status_validos = ["pendente", "em_analise", "aprovado", "rejeitado"]
    if novo_status not in status_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status inválido. Use: {', '.join(status_validos)}"
        )
    
    inscricao["status"] = novo_status
    if feedback:
        inscricao["feedback"] = feedback
    
    return {
        "message": "Status atualizado com sucesso",
        "inscricao_id": inscricao_id,
        "novo_status": novo_status
    }

@router.delete("/inscricoes/{inscricao_id}")
async def deletar_inscricao(inscricao_id: int):
    """
    Deletar uma inscrição.
    """
    global inscricoes_db
    inscricao = next((i for i in inscricoes_db if i.get("id") == inscricao_id), None)
    
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscrição não encontrada"
        )
    
    inscricoes_db = [i for i in inscricoes_db if i.get("id") != inscricao_id]
    
    return {"message": "Inscrição deletada com sucesso"}
