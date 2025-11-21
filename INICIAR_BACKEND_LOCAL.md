# 🚀 Guia Rápido - Rodar Backend Localmente

## ✅ Autenticação Corrigida para Desenvolvimento

A autenticação Microsoft foi configurada para funcionar localmente **sem necessidade de credenciais Azure**.

### 🔧 O que foi corrigido:

1. ✅ **Modo desenvolvimento automático** - Detecta quando não há credenciais configuradas
2. ✅ **Login tradicional funcional** - Use email/senha sem OAuth
3. ✅ **Validação simplificada** - Aceita qualquer email @ibmec.edu.br
4. ✅ **Criação automática de usuários** - Primeiro login cria a conta

## 📋 Pré-requisitos

- Python 3.8+
- Ambiente virtual ativado

## 🏃 Como Rodar

### 1. Ativar ambiente virtual

```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

### 2. Instalar dependências (se necessário)

```powershell
pip install -r requirements.txt
```

### 3. Iniciar o servidor

```powershell
uvicorn main:app --reload
```

**Saída esperada:**
```
INFO: Microsoft OAuth initialized:
INFO:   Environment: development
INFO:   Tenant ID: NOT SET (Dev mode enabled)
INFO:   Client ID: NOT SET (Dev mode enabled)
INFO: ✅ Running in DEVELOPMENT MODE - Microsoft OAuth disabled
INFO:    You can login with email/password without Microsoft credentials
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

### 4. Testar o backend

Abra outro terminal e execute:

```powershell
python test_auth_local.py
```

## 🔑 Como Fazer Login

### Via API (cURL, Postman, etc)

```bash
POST http://localhost:8000/api/auth/legacy-login
Content-Type: application/json

{
  "email": "seu.nome@alunos.ibmec.edu.br",
  "senha": "qualquer-senha"
}
```

### Tipos de Email Suportados

| Email | Tipo de Usuário |
|-------|----------------|
| `nome@alunos.ibmec.edu.br` | Aluno |
| `nome@orientador.ibmec.edu.br` | Orientador |
| `nome@professor.ibmec.edu.br` | Orientador |
| `nome@coordenador.ibmec.edu.br` | Coordenador |

### Exemplo de Resposta

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "joao.silva@alunos.ibmec.edu.br",
    "nome": "Joao Silva",
    "tipo": "aluno",
    "status": "ativo"
  },
  "is_new_user": true
}
```

## 📚 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/legacy-login` - Login com email/senha ✅ **USE ESTE**
- `GET /api/auth/login` - OAuth Microsoft (requer config) ❌ **Não funciona sem config**
- `GET /api/auth/callback` - Callback OAuth
- `POST /api/auth/logout` - Logout

### Health Check
- `GET /` - Info da API
- `GET /api/health` - Status do sistema

### Dados
- `GET /api/cursos` - Lista de cursos
- `GET /api/unidades` - Lista de unidades
- `GET /api/orientadores` - Lista de orientadores

### Documentação Interativa
- `http://localhost:8000/docs` - Swagger UI
- `http://localhost:8000/redoc` - ReDoc

## 🧪 Testar Login Rapidamente

### Opção 1: Script Python

```powershell
python test_auth_local.py
```

### Opção 2: PowerShell direto

```powershell
$body = @{
    email = "teste@alunos.ibmec.edu.br"
    senha = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/legacy-login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Opção 3: cURL

```bash
curl -X POST http://localhost:8000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@alunos.ibmec.edu.br","senha":"123456"}'
```

## ⚙️ Configuração (.env)

O arquivo `.env` está configurado para desenvolvimento:

```env
ENVIRONMENT=development         # ← Importante!
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
DATABASE_URL=sqlite:///./iniciacao_cientifica.db

# Deixe vazios para modo dev
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError"
```powershell
pip install -r requirements.txt
```

### Erro: "Address already in use"
```powershell
# Matar processo na porta 8000
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# Ou usar outra porta
uvicorn main:app --reload --port 8001
```

### Backend não inicia
```powershell
# Verificar Python
python --version

# Recriar venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "Email institucional inválido"
- Certifique-se que o email termina com `@ibmec.edu.br`
- Exemplos válidos:
  - ✅ `joao@alunos.ibmec.edu.br`
  - ✅ `maria@orientador.ibmec.edu.br`
  - ❌ `joao@gmail.com`
  - ❌ `maria@ibmec.com.br`

## 📖 Documentação Completa

Para mais detalhes sobre a autenticação, veja:
- [AUTENTICACAO_LOCAL.md](../AUTENTICACAO_LOCAL.md)

## 🔥 Atalhos PowerShell

Crie aliases no seu perfil do PowerShell:

```powershell
# Ver/editar perfil
notepad $PROFILE

# Adicionar aliases
function Start-Backend {
    cd C:\...\backend
    .\venv\Scripts\Activate.ps1
    uvicorn main:app --reload
}

function Test-Backend {
    python C:\...\backend\test_auth_local.py
}
```

Depois use:
```powershell
Start-Backend
Test-Backend
```

## ✨ Próximos Passos

1. ✅ Backend rodando localmente
2. 🔄 Iniciar frontend (`npm run dev` no diretório frontend)
3. 🎨 Acessar http://localhost:5173
4. 🔐 Fazer login com qualquer email @ibmec.edu.br
