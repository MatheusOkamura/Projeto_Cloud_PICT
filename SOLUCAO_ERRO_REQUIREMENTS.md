# Solução para o Erro "Could not open requirements file"

## 🐛 O Problema

```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

Este erro ocorria porque o Azure App Service não conseguia encontrar o arquivo `requirements.txt` durante o processo de build.

## 🔍 Causa Raiz

O problema tinha **duas causas principais**:

### 1. Estrutura do ZIP incorreta
Quando você fazia deploy manual via Azure CLI, o ZIP criado tinha uma estrutura como:
```
backend-deploy.zip
└── backend/
    ├── main.py
    ├── requirements.txt
    └── ...
```

Mas o Azure esperava:
```
backend-deploy.zip
├── main.py
├── requirements.txt
└── ...
```

### 2. Falta de autenticação no GitHub Actions
O workflow do GitHub Actions não tinha o step de login do Azure (`azure/login@v1`), causando o erro:
```
Error: No credentials found. Add an Azure login action before this action.
```

## ✅ A Solução

### Solução Implementada: GitHub Actions (RECOMENDADA)

Criamos um workflow automatizado que:

1. **Faz login no Azure** usando Service Principal
2. **Instala as dependências** Python
3. **Cria um ZIP com a estrutura correta** (arquivos na raiz)
4. **Faz o deploy automaticamente** a cada push na pasta `backend/`

**Arquivo**: `.github/workflows/deploy-backend.yml`

**Comando do ZIP**:
```bash
cd backend
zip -r ../backend-deploy.zip . \
  -x "__pycache__/*" \
  -x "*.pyc" \
  -x ".env" \
  -x "*.db" \
  -x ".venv/*" \
  -x "venv/*" \
  -x "uploads/*"
```

O ponto importante é o `.` após o `zip -r`, que cria o ZIP **do conteúdo da pasta**, não da pasta inteira.

### Configuração Necessária

1. **Service Principal** criado no Azure
2. **Secret `AZURE_CREDENTIALS`** configurado no GitHub
3. **Comando de startup** configurado no App Service:
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000 --timeout 600
   ```

## 📋 Scripts Criados

### `setup-github-actions.ps1`
- Cria o Service Principal automaticamente
- Copia as credenciais para a área de transferência
- Configura o comando de startup no Azure
- Exibe instruções passo a passo

### `CONFIGURAR_GITHUB_ACTIONS.md`
- Documentação completa do processo
- Guia passo a passo para configurar no GitHub
- Troubleshooting de erros comuns

## 🚀 Como Funciona Agora

1. Você faz alterações no código do backend
2. Faz commit e push para o GitHub
3. O GitHub Actions detecta automaticamente
4. Faz build, testa e deploy no Azure
5. A aplicação é reiniciada automaticamente
6. Logs disponíveis no GitHub Actions e Azure

## 🎯 Benefícios

- ✅ **Automático**: Deploy a cada push
- ✅ **Confiável**: Estrutura sempre correta
- ✅ **Rastreável**: Histórico de deploys no GitHub
- ✅ **Sem erros de estrutura**: ZIP criado corretamente
- ✅ **Rollback fácil**: Pode reverter commits

## 📊 Monitoramento

### Ver logs do GitHub Actions
https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions

### Ver logs do Azure
```powershell
az webapp log tail --name Pictback --resource-group PICTIBMEC
```

### Testar a API
- Health: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/health
- Docs: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/docs

## 🔄 Alternativa: Deploy Manual (não recomendado)

Se por algum motivo você precisar fazer deploy manual, a estrutura correta seria:

```powershell
cd backend
tar -czf ../backend.tar.gz --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='*.db' --exclude='.venv' --exclude='uploads' .
cd ..
az webapp deploy --resource-group PICTIBMEC --name Pictback --src-path backend.tar.gz --type tar
```

Mas **use o GitHub Actions** sempre que possível!
