# 📚 Próximos Passos e Melhorias

## ✅ O que foi implementado

### Frontend (React)
- ✅ Estrutura completa com React 18 + Vite
- ✅ Sistema de roteamento com React Router
- ✅ Autenticação simulada com Context API
- ✅ 6 páginas principais (Home, Login, Cadastro, Sobre, 3 Dashboards)
- ✅ Componentes reutilizáveis (Header, Footer, Card, Layout)
- ✅ Design responsivo com TailwindCSS
- ✅ Identidade visual do Ibmec (cores e estilo)
- ✅ Sistema de rotas protegidas por tipo de usuário

### Backend (FastAPI)
- ✅ Estrutura base com FastAPI
- ✅ Rotas de autenticação (login/logout)
- ✅ CRUD de inscrições
- ✅ Gerenciamento de usuários
- ✅ Documentação automática (Swagger)
- ✅ CORS configurado
- ✅ Modelos Pydantic para validação
- ✅ Estrutura preparada para PostgreSQL

## 🔜 Próximas Implementações Recomendadas

### 1. Banco de Dados (Prioridade Alta)

#### PostgreSQL Setup
```bash
# Instalar PostgreSQL
# Download: https://www.postgresql.org/download/

# Criar banco de dados
createdb ibmec_ic

# Configurar .env
DATABASE_URL=postgresql://user:password@localhost/ibmec_ic
```

#### Models SQLAlchemy
```python
# backend/models/database.py
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    cpf = Column(String(14), unique=True)
    tipo = Column(String(20))  # aluno, orientador, coordenador
    curso = Column(String(100))
    departamento = Column(String(100))
    status = Column(String(20), default="ativo")
    data_cadastro = Column(DateTime, default=datetime.now)
    
    inscricoes = relationship("Inscricao", back_populates="usuario")

class Inscricao(Base):
    __tablename__ = "inscricoes"
    
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    titulo_projeto = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=False)
    area_conhecimento = Column(String(100))
    status = Column(String(20), default="pendente")
    arquivo_projeto = Column(String(255))
    feedback = Column(Text)
    data_submissao = Column(DateTime, default=datetime.now)
    
    usuario = relationship("Usuario", back_populates="inscricoes")
```

### 2. Autenticação JWT Real

```python
# backend/auth/jwt.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### 3. Upload de Arquivos

#### AWS S3
```python
# backend/services/storage.py
import boto3
from config import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

async def upload_file(file: UploadFile, folder: str):
    filename = f"{folder}/{uuid.uuid4()}_{file.filename}"
    
    s3_client.upload_fileobj(
        file.file,
        settings.AWS_BUCKET_NAME,
        filename,
        ExtraArgs={'ContentType': file.content_type}
    )
    
    url = f"https://{settings.AWS_BUCKET_NAME}.s3.amazonaws.com/{filename}"
    return url
```

#### Local Storage (alternativa)
```python
# backend/services/storage.py
import shutil
from pathlib import Path

async def save_upload_file(upload_file: UploadFile, destination: Path):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return str(destination)
```

### 4. Sistema de Notificações por Email

```python
# backend/services/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_USER,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_TLS=True,
    MAIL_SSL=False
)

async def send_email(email: str, subject: str, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

# Templates de email
async def send_inscricao_confirmacao(email: str, nome: str):
    await send_email(
        email,
        "Inscrição Recebida - Iniciação Científica Ibmec",
        f"""
        <h2>Olá, {nome}!</h2>
        <p>Sua inscrição foi recebida com sucesso e está sendo analisada.</p>
        <p>Você receberá um email com o resultado em breve.</p>
        """
    )
```

### 5. Middleware de Autenticação

```python
# backend/middleware/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Buscar usuário no banco
    user = get_user(user_id)
    if user is None:
        raise credentials_exception
    
    return user

# Uso nas rotas
@router.get("/me")
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return current_user
```

### 6. Testes Automatizados

```python
# backend/tests/test_auth.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_success():
    response = client.post(
        "/api/login",
        json={"email": "aluno@ibmec.edu.br", "senha": "senha123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid():
    response = client.post(
        "/api/login",
        json={"email": "invalid@email.com", "senha": "wrong"}
    )
    assert response.status_code == 401
```

### 7. Exportação de Relatórios

```python
# backend/services/reports.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
import pandas as pd

def generate_pdf_report(inscricoes: list):
    # Gerar PDF com ReportLab
    pdf = canvas.Canvas("relatorio.pdf", pagesize=A4)
    pdf.drawString(100, 750, "Relatório de Inscrições")
    # ... adicionar dados
    pdf.save()
    return "relatorio.pdf"

def generate_excel_report(inscricoes: list):
    # Gerar Excel com Pandas
    df = pd.DataFrame(inscricoes)
    df.to_excel("relatorio.xlsx", index=False)
    return "relatorio.xlsx"
```

### 8. WebSockets para Notificações em Tempo Real

```python
# backend/routes/websocket.py
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Nova notificação: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

## 🎨 Melhorias de UI/UX

### 1. Loading States
```jsx
// Adicionar em todos os componentes com requisições
const [loading, setLoading] = useState(false);

{loading && <LoadingSpinner />}
```

### 2. Toasts/Notificações
```bash
npm install react-hot-toast
```

```jsx
import toast from 'react-hot-toast';

toast.success('Inscrição enviada com sucesso!');
toast.error('Erro ao enviar inscrição');
```

### 3. Animações
```bash
npm install framer-motion
```

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  {content}
</motion.div>
```

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy automático conectando repositório GitHub à Vercel
```

### Backend (Railway/Heroku)
```bash
# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Database (Supabase/Railway)
- Criar instância PostgreSQL
- Atualizar DATABASE_URL no .env

## 📊 Monitoramento

### Sentry (Error Tracking)
```bash
npm install @sentry/react
pip install sentry-sdk
```

### Google Analytics
```html
<!-- Adicionar em index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🔒 Segurança

### Principais Melhorias
- [ ] Rate limiting nas rotas de login
- [ ] HTTPS em produção
- [ ] Sanitização de inputs
- [ ] CSP Headers
- [ ] Validação de arquivos upload
- [ ] Logs de auditoria

---

**Priorize as implementações baseado nas necessidades do projeto!**
