# 🔧 Configuração Backend para Azure

## Importante: Onde está seu backend?

Baseado no print que você forneceu, seu Azure Static Web App já está configurado em:
**https://icy-sea-0c53d910f.3.azurestaticapps.net**

Porém, o **backend (FastAPI)** precisa estar rodando em algum lugar para que a API funcione.

## Opções para Hospedar o Backend

### Opção 1: Azure Functions (Recomendado para Static Web Apps)

O Azure Static Web Apps pode ter APIs integradas via Azure Functions.

#### Estrutura:
```
projeto/
├── frontend/
└── api/          ← Pasta para Azure Functions
    ├── requirements.txt
    ├── host.json
    └── function_app.py
```

#### Passos:
1. Criar pasta `api` na raiz
2. Migrar código FastAPI para Azure Functions
3. Configurar GitHub Actions para deploy automático

### Opção 2: Azure App Service (Mais Simples)

Hospedar o backend FastAPI como um App Service separado.

#### Passos:

1. **Criar App Service no Azure:**
```bash
az webapp create \
  --resource-group PICTIBMEC \
  --plan <seu-plan> \
  --name pictibmec-api \
  --runtime "PYTHON:3.11"
```

2. **Configurar Deploy:**
```bash
az webapp deployment source config \
  --name pictibmec-api \
  --resource-group PICTIBMEC \
  --repo-url <seu-github-repo> \
  --branch main \
  --manual-integration
```

3. **Atualizar URL da API:**

No `frontend/.env.production`:
```
VITE_API_URL=https://pictibmec-api.azurewebsites.net/api
```

### Opção 3: Azure Container Instances

Usar Docker para hospedar o backend.

#### Dockerfile:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Configuração Atual (O que você tem agora)

Baseado no seu projeto, parece que o backend está rodando localmente. Você tem duas opções:

### A. Backend Local (Desenvolvimento)
```
Frontend (Azure): https://icy-sea-0c53d910f.3.azurestaticapps.net
Backend (Local):  http://localhost:8000

⚠️ Não vai funcionar em produção!
```

### B. Backend no Azure (Produção)
```
Frontend (Azure): https://icy-sea-0c53d910f.3.azurestaticapps.net
Backend (Azure):  https://pictibmec-api.azurewebsites.net

✅ Funcionará em produção!
```

## 🚀 Solução Rápida: Deploy do Backend

### Passo 1: Criar App Service para o Backend

No Portal do Azure:

1. Criar novo recurso
2. Escolher "Web App"
3. Configurar:
   - **Name**: `pictibmec-api`
   - **Runtime**: Python 3.11
   - **Region**: Mesma do frontend
   - **Plan**: Free F1 (para testes)

### Passo 2: Configurar GitHub Actions para Backend

Criar `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: pictibmec-api
          publish-profile: ${{ secrets.AZURE_BACKEND_PUBLISH_PROFILE }}
          package: ./backend
```

### Passo 3: Atualizar URL no Frontend

Atualizar `frontend/.env.production`:
```
VITE_API_URL=https://pictibmec-api.azurewebsites.net/api
```

### Passo 4: Atualizar CORS no Backend

Em `backend/main.py`, adicionar URL do App Service:
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://icy-sea-0c53d910f.3.azurestaticapps.net",
    "https://pictibmec-api.azurewebsites.net",  # ← Adicionar
]
```

## 🔍 Como Verificar Onde Seu Backend Está

Execute:
```powershell
# Ver se backend está rodando localmente
netstat -ano | findstr :8000

# Se retornar algo, backend está local
# Se não retornar nada, backend não está rodando
```

## ⚙️ Configuração do Banco de Dados

Se você está usando SQLite (arquivo local), precisa migrar para um banco na nuvem:

### Opções:
1. **Azure SQL Database** (Compatível com PostgreSQL/MySQL)
2. **Azure Cosmos DB** (NoSQL)
3. **Azure Database for PostgreSQL**

### Atualizar connection string:
```python
# backend/config.py
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:pass@pictibmec-db.postgres.database.azure.com/pictibmec"
)
```

## 📋 Checklist Backend

```
[ ] 🔧 Backend hospedado no Azure
[ ] 🔧 URL do backend configurada no frontend
[ ] 🔧 CORS configurado com URL correta
[ ] 🔧 Banco de dados na nuvem (se aplicável)
[ ] 🔧 Variáveis de ambiente configuradas
[ ] 🔧 GitHub Actions configurado
[ ] ✅ Testado em produção
```

## 🆘 Problema Comum

**Erro:** Frontend no Azure não consegue conectar à API

**Causa:** Backend está rodando apenas localmente

**Solução:** 
1. Hospedar backend no Azure (App Service ou Functions)
2. Atualizar `VITE_API_URL` com URL do backend no Azure
3. Verificar CORS no backend

## 💡 Recomendação

Para um projeto de produção completo:

1. **Frontend**: Azure Static Web Apps ✅ (Já configurado)
2. **Backend**: Azure App Service (Precisa ser configurado)
3. **Banco**: Azure Database (Precisa migrar do SQLite)
4. **Armazenamento**: Azure Blob Storage (Para uploads)

## 📞 Próximo Passo Importante

Você precisa decidir:

**A. Apenas testar o frontend?**
- Mantenha backend local
- Ignore avisos de CORS em produção

**B. Colocar em produção completa?**
- Siga os passos acima para hospedar backend
- Configure banco de dados na nuvem
- Configure armazenamento para uploads

---

> 💡 **Dica**: Se você quer apenas validar o frontend no Azure, pode continuar com backend local para testes. Para produção real, siga este guia para hospedar o backend.
