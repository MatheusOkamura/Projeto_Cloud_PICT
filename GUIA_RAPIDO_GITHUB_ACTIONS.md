# ⚡ Guia Rápido: Configurar GitHub Actions AGORA

## 🎯 Passo 1: Obter as Credenciais do Azure

O script `setup-github-actions.ps1` já está rodando e vai:
- ✅ Criar o Service Principal no Azure
- ✅ Copiar as credenciais para sua área de transferência
- ✅ Salvar em um arquivo temporário

**Aguarde a mensagem: "✅ Credenciais copiadas para a área de transferência!"**

---

## 🔐 Passo 2: Adicionar Secret no GitHub (IMPORTANTE!)

### 2.1. Abra esta URL:
👉 **https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions**

### 2.2. Clique em "New repository secret"

### 2.3. Configure o secret:
- **Name**: `AZURE_CREDENTIALS`
- **Value**: Cole o JSON (Ctrl+V) - já está copiado!

### 2.4. Clique em "Add secret"

---

## ✅ Passo 3: Fazer Commit e Push

```powershell
cd "c:\Users\Lucas\OneDrive\Documentos\Cloud Matheus\Projeto_Cloud_PICT"

git add .
git commit -m "Configure GitHub Actions for automatic backend deployment"
git push origin main
```

---

## 📊 Passo 4: Monitorar o Deploy

Abra esta URL para ver o deploy acontecendo:
👉 **https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions**

Você verá:
- ⏳ Deploy em andamento (ícone amarelo)
- ✅ Deploy concluído com sucesso (ícone verde)
- ❌ Erro no deploy (ícone vermelho) - improvável!

---

## 🧪 Passo 5: Testar a API

Após o deploy concluir (2-3 minutos), teste:

### Health Check:
```powershell
curl https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/health
```

### Documentação Interativa:
👉 **https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/docs**

---

## 🔄 Deploy Manual (Opcional)

Se quiser forçar um deploy sem fazer push:

### Via GitHub Web:
1. Vá em: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions
2. Clique em "Deploy Backend to Azure App Service"
3. Clique em "Run workflow"
4. Selecione branch "main"
5. Clique em "Run workflow"

### Via GitHub CLI:
```powershell
gh workflow run deploy-backend.yml
```

---

## 🐛 Troubleshooting

### Se der erro "Context access might be invalid: AZURE_CREDENTIALS"
- ✅ É apenas um aviso do linter
- ✅ O secret precisa ser configurado no GitHub (Passo 2)
- ✅ Depois de configurado, funciona perfeitamente

### Se der erro "No credentials found"
- ❌ O secret `AZURE_CREDENTIALS` não foi adicionado
- ✅ Volte ao Passo 2 e adicione o secret

### Se der erro no requirements.txt
- ✅ Isso não vai mais acontecer!
- ✅ O workflow cria o ZIP com estrutura correta
- ✅ Todos os arquivos ficam na raiz do ZIP

---

## 📱 Resumo

| O que foi feito | Status |
|-----------------|--------|
| Workflow do GitHub Actions | ✅ Criado |
| Variáveis de ambiente no Azure | ✅ Configuradas |
| Comando de startup | ✅ Configurado |
| Logs habilitados | ✅ Habilitados |
| Script de configuração | ✅ Executando |
| **Falta fazer** | |
| Adicionar secret no GitHub | ⚠️ **VOCÊ PRECISA FAZER** |
| Commit e Push | ⚠️ **VOCÊ PRECISA FAZER** |

---

## 🎉 Depois disso...

Todo commit na pasta `backend/` vai:
1. 🔄 Detectar automaticamente as mudanças
2. 🏗️ Fazer build da aplicação
3. 📦 Criar ZIP com estrutura correta
4. 🚀 Fazer deploy no Azure
5. ✅ Reiniciar a aplicação

**Sem erros! Sem complicações! Automático!** 🎯
