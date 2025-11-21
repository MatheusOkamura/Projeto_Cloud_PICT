from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from models.schemas import LoginRequest, LoginResponse, Usuario
from models.database_models import Usuario as DBUsuario, TipoUsuario, StatusUsuario
from database import get_db
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
import shutil
from pathlib import Path
from microsoft_auth import microsoft_oauth, validate_email, get_user_info

router = APIRouter()

# Configurações JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sua-chave-secreta-super-segura-aqui-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Cache temporário para estados OAuth (em produção, usar Redis ou banco)
oauth_states = {}

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Cria um token JWT com os dados do usuário.
    
    Args:
        data: Dados a serem codificados no token
        expires_delta: Tempo de expiração do token
        
    Returns:
        Token JWT assinado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def detectar_tipo_usuario(email: str) -> TipoUsuario:
    """
    Detecta o tipo de usuário baseado no domínio do email:
    - @alunos -> aluno
    - @orientador -> orientador
    - @professores -> orientador
    - @coordenador -> coordenador
    """
    email_lower = email.lower()
    
    if "@alunos" in email_lower:
        return TipoUsuario.aluno
    elif "@orientador" in email_lower or "@professor" in email_lower:
        return TipoUsuario.orientador
    elif "@coordenador" in email_lower:
        return TipoUsuario.coordenador
    else:
        # Default para aluno se não identificar
        return TipoUsuario.aluno

@router.get("/login")
async def oauth_login():
    """
    Endpoint que inicia o fluxo OAuth 2.0 com Microsoft.
    Redireciona o usuário para a página de login da Microsoft.
    """
    try:
        # Verificar se OAuth está configurado
        if not microsoft_oauth.is_configured:
            error_msg = "Microsoft OAuth não configurado. Configure MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET."
            print(f"❌ {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        
        # Gerar URL de autorização
        auth_data = microsoft_oauth.get_authorization_url()
        
        authorization_url = auth_data["authorization_url"]
        state = auth_data["state"]
        
        # Armazenar state para validação posterior (em produção, usar Redis/DB)
        oauth_states[state] = {
            "created_at": datetime.utcnow(),
            "used": False
        }
        
        print(f"🔐 Redirecionando para login Microsoft (state: {state[:8]}...)")
        
        # Redirecionar para Microsoft
        return RedirectResponse(url=authorization_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao gerar URL de autorização: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao iniciar autenticação Microsoft: {str(e)}"
        )

@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint de callback OAuth 2.0.
    Recebe o código de autorização da Microsoft e troca por token de acesso.
    """
    try:
        # Validar state (proteção CSRF)
        if state not in oauth_states or oauth_states[state]["used"]:
            print(f"❌ State inválido ou já usado: {state}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State de autenticação inválido"
            )
        
        # Marcar state como usado
        oauth_states[state]["used"] = True
        
        print(f"✅ State validado: {state[:8]}...")
        
        # Trocar código por token de acesso
        print(f"🔄 Trocando código por token...")
        token_response = await microsoft_oauth.exchange_code_for_token(code)
        
        access_token = token_response.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Falha ao obter token de acesso"
            )
        
        # Obter informações do usuário
        print(f"👤 Obtendo informações do usuário...")
        user_info = await microsoft_oauth.get_user_info_from_token(access_token)
        
        email = user_info.get("mail") or user_info.get("userPrincipalName")
        display_name = user_info.get("displayName", "")
        given_name = user_info.get("givenName", "")
        surname = user_info.get("surname", "")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email não encontrado no perfil Microsoft"
            )
        
        print(f"✅ Usuário Microsoft: {display_name} ({email})")
        
        # Verificar se é email institucional
        if "ibmec.edu.br" not in email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso permitido apenas para emails institucionais (@ibmec.edu.br)"
            )
        
        # Buscar ou criar usuário no banco de dados
        user_data = db.query(DBUsuario).filter(DBUsuario.email == email).first()
        is_new_user = False
        
        if not user_data:
            # Novo usuário - criar registro
            is_new_user = True
            tipo = detectar_tipo_usuario(email)
            
            user_data = DBUsuario(
                email=email,
                senha="",  # Sem senha - apenas OAuth
                nome=display_name or f"{given_name} {surname}".strip() or email.split('@')[0],
                tipo=tipo,
                status=StatusUsuario.ativo
            )
            
            db.add(user_data)
            db.commit()
            db.refresh(user_data)
            
            print(f"✅ Novo usuário criado: {user_data.email} (tipo: {tipo.value})")
        else:
            print(f"✅ Usuário existente: {user_data.email}")
        
        # Verificar se o usuário precisa completar o cadastro
        # Para usuários de teste em modo desenvolvimento, pular verificação
        precisa_completar_cadastro = False
        
        if not (microsoft_oauth.is_development and microsoft_oauth.is_test_user(user_data.email)):
            # Verificar se dados obrigatórios estão preenchidos
            if user_data.tipo == TipoUsuario.aluno:
                # Aluno precisa de: CPF, telefone, curso, matricula
                if not all([user_data.cpf, user_data.telefone, user_data.curso, user_data.matricula]):
                    precisa_completar_cadastro = True
                    print(f"⚠️ Aluno precisa completar cadastro: faltam dados obrigatórios")
            
            elif user_data.tipo == TipoUsuario.orientador:
                # Orientador precisa de: telefone, departamento
                if not all([user_data.telefone, user_data.departamento]):
                    precisa_completar_cadastro = True
                    print(f"⚠️ Orientador precisa completar cadastro: faltam dados obrigatórios")
            
            elif user_data.tipo == TipoUsuario.coordenador:
                # Coordenador precisa de: telefone, departamento
                if not all([user_data.telefone, user_data.departamento]):
                    precisa_completar_cadastro = True
                    print(f"⚠️ Coordenador precisa completar cadastro: faltam dados obrigatórios")
        else:
            print(f"✅ Usuário de teste: bypass de verificação de cadastro completo")
        
        # Se precisa completar cadastro, marcar como novo usuário para frontend redirecionar
        if precisa_completar_cadastro:
            is_new_user = True
            print(f"📝 Usuário será redirecionado para completar cadastro")
        
        # Criar JWT token
        token_data = {
            "sub": user_data.email,
            "user_id": user_data.id,
            "tipo": user_data.tipo.value,
            "nome": user_data.nome
        }
        
        jwt_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Preparar dados do usuário
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
            "departamento": user_data.departamento,
            "area_pesquisa": user_data.area_pesquisa,
            "titulacao": user_data.titulacao,
            "vagas_disponiveis": user_data.vagas_disponiveis
        }
        
        # Redirecionar para frontend com token e dados
        frontend_url = microsoft_oauth.frontend_url
        
        # Codificar dados do usuário em URL-safe base64
        import json
        import base64
        user_json = json.dumps(user_response)
        user_encoded = base64.urlsafe_b64encode(user_json.encode()).decode()
        
        redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}&user={user_encoded}&is_new_user={str(is_new_user).lower()}"
        
        print(f"🎉 Autenticação concluída! Redirecionando para frontend...")
        
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro no callback OAuth: {e}")
        import traceback
        traceback.print_exc()
        
        # Redirecionar para página de erro no frontend
        frontend_url = microsoft_oauth.frontend_url
        error_url = f"{frontend_url}/login?error={str(e)}"
        return RedirectResponse(url=error_url)

@router.post("/legacy-login")
async def legacy_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de login tradicional com email e senha.
    Em modo desenvolvimento: aceita APENAS usuários de teste (aluno.teste, professor.teste, coordenador.teste).
    Em produção: valida email via Microsoft e compara senha armazenada.
    
    Para outros usuários em desenvolvimento, use o fluxo OAuth normal.
    """
    print(f"🔑 Login tradicional para: {credentials.email}")
    
    # Verificar se é usuário de teste em desenvolvimento
    is_test_user = microsoft_oauth.is_test_user(credentials.email)
    is_dev_mode = microsoft_oauth.is_development
    
    # Em desenvolvimento, permitir APENAS usuários de teste
    if is_dev_mode and not is_test_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Login direto disponível apenas para usuários de teste em desenvolvimento. Use o fluxo OAuth para outros usuários."
        )
    
    # Validar email institucional
    validation_result = validate_email(credentials.email)
    
    if not validation_result['valid']:
        error_message = validation_result.get('error', 'Email institucional inválido')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message
        )
    
    microsoft_user_data = validation_result.get('user_data', {})
    
    # Buscar usuário no banco
    user_data = db.query(DBUsuario).filter(DBUsuario.email == credentials.email).first()
    is_new_user = False
    
    if not user_data:
        # Criar novo usuário
        is_new_user = True
        tipo = detectar_tipo_usuario(credentials.email)
        
        if microsoft_user_data and microsoft_user_data.get('display_name'):
            nome_usuario = microsoft_user_data['display_name']
        else:
            # Gerar nome a partir do email
            username = credentials.email.split('@')[0]
            name_parts = username.replace('.', ' ').split()
            nome_usuario = ' '.join(word.capitalize() for word in name_parts)
        
        # Pegar departamento do Microsoft se disponível
        departamento_usuario = None
        if microsoft_user_data and tipo != TipoUsuario.aluno:
            departamento_usuario = microsoft_user_data.get('department')
        
        user_data = DBUsuario(
            email=credentials.email,
            senha=credentials.senha,
            nome=nome_usuario,
            tipo=tipo,
            status=StatusUsuario.ativo,
            departamento=departamento_usuario
        )
        
        db.add(user_data)
        db.commit()
        db.refresh(user_data)
        
        print(f"✅ Novo usuário criado: {nome_usuario} ({tipo.value})")
    else:
        # Verificar senha - para usuários de teste, aceitar qualquer senha
        if is_test_user and is_dev_mode:
            print(f"✅ Usuário de teste: bypass de validação de senha")
        else:
            if user_data.senha != credentials.senha:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email ou senha inválidos"
                )
    
    # Verificar se o usuário precisa completar o cadastro
    # Para usuários de teste em modo desenvolvimento, pular verificação
    precisa_completar_cadastro = False
    
    if not (is_dev_mode and is_test_user):
        # Verificar se dados obrigatórios estão preenchidos
        if user_data.tipo == TipoUsuario.aluno:
            # Aluno precisa de: CPF, telefone, curso, matricula
            if not all([user_data.cpf, user_data.telefone, user_data.curso, user_data.matricula]):
                precisa_completar_cadastro = True
                print(f"⚠️ Aluno precisa completar cadastro: faltam dados obrigatórios")
        
        elif user_data.tipo == TipoUsuario.orientador:
            # Orientador precisa de: telefone, departamento
            if not all([user_data.telefone, user_data.departamento]):
                precisa_completar_cadastro = True
                print(f"⚠️ Orientador precisa completar cadastro: faltam dados obrigatórios")
        
        elif user_data.tipo == TipoUsuario.coordenador:
            # Coordenador precisa de: telefone, departamento
            if not all([user_data.telefone, user_data.departamento]):
                precisa_completar_cadastro = True
                print(f"⚠️ Coordenador precisa completar cadastro: faltam dados obrigatórios")
    else:
        print(f"✅ Usuário de teste: bypass de verificação de cadastro completo")
    
    # Se precisa completar cadastro, marcar como novo usuário para frontend redirecionar
    if precisa_completar_cadastro:
        is_new_user = True
        print(f"📝 Usuário será redirecionado para completar cadastro")
    
    # Criar JWT token
    token_data = {
        "sub": user_data.email,
        "user_id": user_data.id,
        "tipo": user_data.tipo.value,
        "nome": user_data.nome
    }
    
    jwt_token = create_access_token(data=token_data)
    
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
    
    return {
        "access_token": jwt_token,
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
