# 🚀 Guia para Rodar o Projeto Localmente

## ✅ Pré-requisitos

- Python 3.9 ou superior
- Node.js 18 ou superior
- PowerShell

## 📦 Instalação

### 1. Configurar Backend

```powershell
# Entrar no diretório do backend
cd backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r requirements.txt

# Inicializar banco de dados SQLite
python init_db.py
```

### 2. Configurar Frontend

```powershell
# Em outro terminal, entrar no diretório do frontend
cd frontend

# Instalar dependências
npm install
```

## ▶️ Executar o Projeto

### Opção 1: Usar Script Automático (Recomendado)

Na raiz do projeto, execute:

```powershell
.\rodar-local.ps1
```

Este script irá:
- Iniciar o backend na porta 8000
- Iniciar o frontend na porta 3000
- Abrir ambos em terminais separados

### Opção 2: Manual

#### Terminal 1 - Backend:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev -- --port 3000 --host
```

## 🌐 Acessar o Projeto

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## 🔑 Login Inicial

Como o projeto usa autenticação Microsoft OAuth que não está configurada localmente, você tem duas opções:

### Opção A: Criar usuário diretamente no banco
```powershell
cd backend
python criar_usuario_teste.py
```

### Opção B: Usar o script de teste
O script criará um usuário coordenador para você acessar o sistema:
- Email: coordenador@ibmec.edu.br
- Senha: senha123

## 🛠️ Troubleshooting

### Erro: "ModuleNotFoundError"
Certifique-se que o ambiente virtual está ativado:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

### Erro: "Port already in use"
Verifique se já existe algo rodando nas portas 8000 ou 3000:
```powershell
# Verificar porta 8000
netstat -ano | findstr :8000

# Verificar porta 3000
netstat -ano | findstr :3000
```

### Frontend não conecta ao Backend
Verifique se o arquivo `frontend/.env.development` tem:
```
VITE_API_URL=http://localhost:8000
```

## 📝 Estrutura do Banco Local

O projeto usa SQLite localmente, com o arquivo:
```
backend/iniciacao_cientifica.db
```

Para reiniciar o banco de dados:
```powershell
cd backend
Remove-Item iniciacao_cientifica.db
python init_db.py
```

## 🔄 Voltar para Produção

Quando precisar voltar a conectar no Azure:
1. Configure as variáveis de ambiente no arquivo `.env` do backend
2. Atualize o `DATABASE_URL` para o PostgreSQL do Azure
3. Configure as credenciais do Microsoft OAuth

---

**Nota**: Este modo local é apenas para desenvolvimento. Não use em produção!
