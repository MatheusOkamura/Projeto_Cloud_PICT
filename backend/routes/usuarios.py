from fastapi import APIRouter, HTTPException, status
from models.schemas import Usuario, UsuarioCreate, MessageResponse
from typing import List, Optional

router = APIRouter()

# Dados simulados
usuarios_db = []

@router.get("/usuarios", response_model=List[dict])
async def listar_usuarios(tipo: Optional[str] = None):
    """
    Listar todos os usuários.
    Filtrar por tipo se especificado.
    """
    result = usuarios_db
    
    if tipo:
        result = [u for u in result if u.get("tipo") == tipo]
    
    return result

@router.get("/usuarios/{usuario_id}")
async def obter_usuario(usuario_id: int):
    """
    Obter informações de um usuário específico.
    """
    usuario = next((u for u in usuarios_db if u.get("id") == usuario_id), None)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Remover senha antes de retornar
    usuario_safe = {k: v for k, v in usuario.items() if k != "senha"}
    return usuario_safe

@router.put("/usuarios/{usuario_id}")
async def atualizar_usuario(usuario_id: int, usuario_data: dict):
    """
    Atualizar informações de um usuário.
    """
    usuario = next((u for u in usuarios_db if u.get("id") == usuario_id), None)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar campos permitidos
    campos_permitidos = ["nome", "telefone", "curso", "departamento"]
    for campo in campos_permitidos:
        if campo in usuario_data:
            usuario[campo] = usuario_data[campo]
    
    return {
        "message": "Usuário atualizado com sucesso",
        "usuario_id": usuario_id
    }

@router.get("/usuarios/{usuario_id}/inscricoes")
async def listar_inscricoes_usuario(usuario_id: int):
    """
    Listar todas as inscrições de um usuário.
    """
    # Em produção, consultar banco de dados
    return {
        "usuario_id": usuario_id,
        "inscricoes": [],
        "message": "Endpoint para listar inscrições do usuário"
    }

@router.get("/estatisticas")
async def obter_estatisticas():
    """
    Obter estatísticas gerais do sistema.
    Apenas para coordenadores (implementar verificação em produção).
    """
    return {
        "total_usuarios": len(usuarios_db),
        "total_alunos": len([u for u in usuarios_db if u.get("tipo") == "aluno"]),
        "total_orientadores": len([u for u in usuarios_db if u.get("tipo") == "orientador"]),
        "message": "Estatísticas simuladas"
    }
