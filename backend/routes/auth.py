from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from models.schemas import LoginRequest, LoginResponse, Usuario
from models.database_models import Usuario as DBUsuario, TipoUsuario, StatusUsuario
from database import get_db
from datetime import datetime
import os
import shutil
from pathlib import Path
from microsoft_auth import validate_email, get_user_info

router = APIRouter()

def detectar_tipo_usuario(email: str) -> TipoUsuario:
    """
    Detecta o tipo de usuário baseado no domínio do email:
    - @alunos -> aluno
    - @orientador.ibmec.edu.br -> orientador
    - @professores -> orientador
    - @coordenador -> coordenador (fallback)
    """
    email_lower = email.lower()
    
    if "@alunos" in email_lower:
        return TipoUsuario.aluno
    elif "@orientador.ibmec.edu.br" in email_lower or "@orientador" in email_lower:
        return TipoUsuario.orientador
    elif "@professores" in email_lower:
        return TipoUsuario.orientador
    elif "@coordenador" in email_lower:
        return TipoUsuario.coordenador
    else:
        # Default para aluno se não identificar
        return TipoUsuario.aluno

@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de login/registro unificado com validação Microsoft.
    - Valida email institucional via Microsoft Graph API
    - Se o usuário existir no banco: retorna dados + is_new_user=false
    - Se não existir: cria registro básico + retorna is_new_user=true
    """
    
    # ETAPA 1: Validar email institucional com Microsoft Graph API
    print(f"🔍 Validando email institucional: {credentials.email}")
    validation_result = validate_email(credentials.email)
    
    if not validation_result['valid']:
        # Email não é válido ou não existe no Azure AD
        error_message = validation_result.get('error', 'Email institucional inválido')
        
        # Se o erro for por credenciais não configuradas, permitir login (modo desenvolvimento)
        if 'indisponível' in error_message or 'desenvolvimento' in error_message:
            print(f"⚠️ Modo desenvolvimento: Validação Microsoft ignorada")
        else:
            print(f"❌ Validação falhou: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_message
            )
    
    # Email validado com sucesso
    if validation_result.get('exists'):
        print(f"✅ Email validado via Microsoft Azure AD")
        microsoft_user_data = validation_result.get('user_data', {})
    else:
        microsoft_user_data = {}
    
    # ETAPA 2: Buscar usuário no banco de dados local
    user_data = db.query(DBUsuario).filter(DBUsuario.email == credentials.email).first()
    is_new_user = False
    
    if not user_data:
        # ETAPA 3: Novo usuário - criar registro básico
        is_new_user = True
        
        # Detectar tipo automaticamente baseado no email
        tipo = detectar_tipo_usuario(credentials.email)
        
        # Usar nome do Microsoft se disponível, senão extrair do email
        if microsoft_user_data and microsoft_user_data.get('display_name'):
            nome_usuario = microsoft_user_data['display_name']
        elif microsoft_user_data and microsoft_user_data.get('given_name'):
            nome_usuario = microsoft_user_data['given_name']
            if microsoft_user_data.get('surname'):
                nome_usuario += f" {microsoft_user_data['surname']}"
        else:
            nome_usuario = credentials.email.split('@')[0]
        
        user_data = DBUsuario(
            email=credentials.email,
            senha=credentials.senha,  # Em produção, usar hash
            nome=nome_usuario,
            tipo=tipo,
            status=StatusUsuario.ativo,  # Novo usuário começa ativo
            departamento=microsoft_user_data.get('department') if tipo != TipoUsuario.aluno else None
        )
        
        db.add(user_data)
        db.commit()
        db.refresh(user_data)
        
        print(f"✅ Novo usuário criado: ID={user_data.id}, Email={user_data.email}, Nome={nome_usuario}, Tipo={user_data.tipo.value}")
    else:
        # ETAPA 4: Usuário existente - verificar senha
        if user_data.senha != credentials.senha:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos"
            )
        print(f"✅ Usuário autenticado: ID={user_data.id}, Email={user_data.email}, Tipo={user_data.tipo.value}")
    
    # Converter para dict e remover senha
    user_response = {
        "id": user_data.id,
        "email": user_data.email,
        "nome": user_data.nome,
        "cpf": user_data.cpf,
        "telefone": user_data.telefone,
        "tipo": user_data.tipo.value,
        "status": user_data.status.value,
        "curso": user_data.curso,
        "unidade": user_data.unidade,
        "matricula": user_data.matricula,
        "cr": user_data.cr,
        "documento_cr": user_data.documento_cr,
        "departamento": user_data.departamento,
        "area_pesquisa": user_data.area_pesquisa,
        "titulacao": user_data.titulacao,
        "vagas_disponiveis": user_data.vagas_disponiveis
    }
    
    # Em produção, gerar token JWT real
    fake_token = f"fake_jwt_token_for_{user_data.tipo.value}_{user_data.id}"
    
    return {
        "access_token": fake_token,
        "token_type": "bearer",
        "user": user_response,
        "is_new_user": is_new_user
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

@router.post("/completar-cadastro")
async def completar_cadastro(dados: dict, db: Session = Depends(get_db)):
    """
    Endpoint para completar dados do cadastro após primeiro login.
    Atualiza informações complementares do novo usuário.
    """
    email = dados.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email é obrigatório"
        )
    
    # Buscar usuário no banco
    usuario = db.query(DBUsuario).filter(DBUsuario.email == email).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar dados básicos
    usuario.nome = dados.get("nome", "")
    usuario.cpf = dados.get("cpf", "")
    usuario.telefone = dados.get("telefone", "")
    usuario.status = StatusUsuario.ativo  # Ativar após completar cadastro
    
    # Campos específicos para alunos
    if usuario.tipo == TipoUsuario.aluno:
        usuario.curso = dados.get("curso", "")
        usuario.unidade = dados.get("unidade", "")
        usuario.matricula = dados.get("matricula", "")
        usuario.cr = dados.get("cr")
        usuario.documento_cr = dados.get("documento_cr", "")
    # Campos específicos para orientadores
    elif usuario.tipo == TipoUsuario.orientador:
        usuario.departamento = dados.get("departamento", "")
        usuario.area_pesquisa = dados.get("area_pesquisa", "")
        usuario.titulacao = dados.get("titulacao", "")
    
    db.commit()
    db.refresh(usuario)
    
    # Converter para dict e remover senha
    user_response = {
        "id": usuario.id,
        "email": usuario.email,
        "nome": usuario.nome,
        "cpf": usuario.cpf,
        "telefone": usuario.telefone,
        "tipo": usuario.tipo.value,
        "status": usuario.status.value,
        "curso": usuario.curso,
        "unidade": usuario.unidade,
        "matricula": usuario.matricula,
        "cr": usuario.cr,
        "documento_cr": usuario.documento_cr,
        "departamento": usuario.departamento,
        "area_pesquisa": usuario.area_pesquisa,
        "titulacao": usuario.titulacao
    }
    
    return {
        "message": "Cadastro completado com sucesso",
        "user": user_response
    }

@router.post("/upload-documento-cr")
async def upload_documento_cr(
    email: str = Form(...),
    arquivo: UploadFile = File(...)
):
    """
    Endpoint para upload do documento de CR (histórico acadêmico).
    Aceita apenas PDF, JPG ou PNG.
    """
    # Validar extensão do arquivo
    extensao = os.path.splitext(arquivo.filename)[1].lower()
    extensoes_permitidas = [".pdf", ".jpg", ".jpeg", ".png"]
    
    if extensao not in extensoes_permitidas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de arquivo não permitido. Use: {', '.join(extensoes_permitidas)}"
        )
    
    # Criar diretório de uploads se não existir
    upload_dir = Path("uploads/documentos_cr")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Gerar nome único para o arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_arquivo = f"cr_{email.replace('@', '_').replace('.', '_')}_{timestamp}{extensao}"
    caminho_arquivo = upload_dir / nome_arquivo
    
    # Salvar arquivo
    try:
        with caminho_arquivo.open("wb") as buffer:
            shutil.copyfileobj(arquivo.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar arquivo: {str(e)}"
        )
    finally:
        arquivo.file.close()
    
    # Retornar caminho do arquivo
    return {
        "message": "Documento enviado com sucesso",
        "filename": nome_arquivo,
        "path": str(caminho_arquivo)
    }
