from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

# Modelos de Usuário
class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=200)
    email: EmailStr
    cpf: str = Field(..., pattern=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
    tipo: Literal['aluno', 'orientador', 'coordenador']
    telefone: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6)
    curso: Optional[str] = None
    departamento: Optional[str] = None

class Usuario(UsuarioBase):
    id: int
    curso: Optional[str] = None
    departamento: Optional[str] = None
    status: str = "ativo"
    data_cadastro: datetime

    class Config:
        from_attributes = True

# Modelos de Login
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Usuario

# Modelos de Inscrição
class InscricaoBase(BaseModel):
    titulo_projeto: str = Field(..., min_length=10, max_length=200)
    descricao: str = Field(..., min_length=50)
    area_conhecimento: str

class InscricaoCreate(InscricaoBase):
    usuario_id: int

class Inscricao(InscricaoBase):
    id: int
    usuario_id: int
    status: Literal['pendente', 'em_analise', 'aprovado', 'rejeitado'] = 'pendente'
    data_submissao: datetime
    arquivo_projeto: Optional[str] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

# Modelos de Resposta
class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
