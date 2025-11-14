# Configuração do GitHub Actions para Deploy Automático do Backend

## 🔧 Passo 1: Criar Service Principal no Azure

Execute este comando no PowerShell para criar as credenciais:

```powershell
az ad sp create-for-rbac --name "github-actions-pictback" `
  --role contributor `
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/PICTIBMEC `
  --sdk-auth
```

Esse comando vai retornar um JSON parecido com:

```json
{
  "clientId": "xxxx-xxxx-xxxx-xxxx",
  "clientSecret": "xxxx",
  "subscriptionId": "xxxx-xxxx-xxxx-xxxx",
  "tenantId": "xxxx-xxxx-xxxx-xxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**COPIE TODO ESSE JSON!**

## 🔐 Passo 2: Adicionar Secret no GitHub

1. Vá até o repositório no GitHub: https://github.com/MatheusOkamura/Projeto_Cloud_PICT
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** > **Actions**
4. Clique em **New repository secret**
5. Nome do secret: `AZURE_CREDENTIALS`
6. Cole o JSON completo que você copiou no passo 1
7. Clique em **Add secret**

## 🚀 Passo 3: Configurar Startup Command no Azure

Execute este comando para garantir que o App Service use o comando correto:

```powershell
az webapp config set `
  --resource-group PICTIBMEC `
  --name Pictback `
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000 --timeout 600"
```

## ✅ Passo 4: Testar o Deploy

Depois de configurar o secret, faça um commit qualquer no backend:

```powershell
cd "c:\Users\Lucas\OneDrive\Documentos\Cloud Matheus\Projeto_Cloud_PICT"
git add .
git commit -m "Configure GitHub Actions for backend deployment"
git push origin main
```

O GitHub Actions vai:
1. Detectar mudanças na pasta `backend/`
2. Fazer login no Azure automaticamente
3. Instalar as dependências
4. Criar um ZIP com a estrutura correta
5. Fazer o deploy no App Service

## 📊 Monitorar o Deploy

Você pode acompanhar o deploy em:
- GitHub: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions
- Azure Logs: Execute `az webapp log tail --name Pictback --resource-group PICTIBMEC`

## 🔄 Deploy Manual (se necessário)

Se você quiser fazer deploy manual sem esperar o GitHub Actions, execute:

```powershell
cd "c:\Users\Lucas\OneDrive\Documentos\Cloud Matheus\Projeto_Cloud_PICT"
gh workflow run deploy-backend.yml
```

Ou use a interface do GitHub > Actions > Deploy Backend to Azure App Service > Run workflow

---

## 🐛 Troubleshooting

### Erro: "Context access might be invalid: AZURE_CREDENTIALS"
- Isso é apenas um aviso do linter
- O secret precisa ser configurado no GitHub (Passo 2)
- Depois de configurado, o erro desaparecerá

### Erro: "Could not open requirements file"
- O novo workflow cria um ZIP com a estrutura correta
- Todos os arquivos ficam na raiz do ZIP
- O Azure vai encontrar o `requirements.txt` corretamente

### Erro: "No credentials found"
- Verifique se o secret `AZURE_CREDENTIALS` foi adicionado corretamente
- O JSON deve estar completo e válido
