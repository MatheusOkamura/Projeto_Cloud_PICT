from fastapi import APIRouter, HTTPException, status
from models.schemas import LoginRequest, LoginResponse, Usuario
from datetime import datetime

router = APIRouter()

# Dados simulados de usuários (em produção, consultar banco de dados)
usuarios_db = {
    "aluno@ibmec.edu.br": {
        "id": 1,
        "nome": "João Silva",
        "email": "aluno@ibmec.edu.br",
        "cpf": "123.456.789-00",
        "tipo": "aluno",
        "curso": "Administração",
        "senha": "senha123",  # Em produção, usar hash
        "status": "ativo",
        "data_cadastro": datetime.now()
    },
    "orientador@ibmec.edu.br": {
        "id": 2,
        "nome": "Prof. Maria Santos",
        "email": "orientador@ibmec.edu.br",
        "cpf": "234.567.890-11",
        "tipo": "orientador",
        "departamento": "Gestão",
        "senha": "senha123",
        "status": "ativo",
        "data_cadastro": datetime.now()
    },
    "coordenador@ibmec.edu.br": {
        "id": 3,
        "nome": "Prof. Dr. Carlos Oliveira",
        "email": "coordenador@ibmec.edu.br",
        "cpf": "345.678.901-22",
        "tipo": "coordenador",
        "departamento": "Coordenação de Pesquisa",
        "senha": "senha123",
        "status": "ativo",
        "data_cadastro": datetime.now()
    }
}

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Endpoint de login simulado.
    Em produção, verificar senha com hash e gerar JWT token real.
    """
    user_data = usuarios_db.get(credentials.email)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )
    
    # Em produção, verificar hash da senha
    if user_data.get("senha") != credentials.senha:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )
    
    # Remover senha antes de retornar
    user_response = {k: v for k, v in user_data.items() if k != "senha"}
    
    # Em produção, gerar token JWT real
    fake_token = f"fake_jwt_token_for_{user_data['tipo']}"
    
    return {
        "access_token": fake_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/logout")
async def logout():
    """
    Endpoint de logout (cliente deve remover o token).
    """
    return {"message": "Logout realizado com sucesso"}

@router.get("/me")
async def get_current_user():
    """
    Retorna informações do usuário autenticado.
    Em produção, validar JWT token.
    """
    return {
        "message": "Endpoint para obter usuário autenticado",
        "detail": "Implementar validação de JWT em produção"
    }
