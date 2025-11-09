# 🔐 Configurar Token do Azure no GitHub

## Passo a Passo para Adicionar o Token

### 1️⃣ Acessar Settings do Repositório

1. Acesse: https://github.com/MatheusOkamura/Projeto_Cloud_PICT
2. Clique em **Settings** (no topo do repositório)
3. No menu lateral esquerdo, clique em **Secrets and variables** > **Actions**

### 2️⃣ Adicionar o Secret

1. Clique no botão **New repository secret**
2. Preencha:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F`
   - **Value**: `b931b568219fd20aa360c0c3075ee12ba9cc353328518746d386a9e1c3f88bbd03-d52cd8a5-3d65-4d5f-83f5-05a25c323aff00f05030c53d910f`
3. Clique em **Add secret**

### 3️⃣ Verificar Configuração

Após adicionar, você verá o secret listado como:
```
AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F
```

⚠️ **Importante**: O valor do token ficará oculto por segurança.

### 4️⃣ Fazer o Deploy

Depois de adicionar o secret, faça um novo commit:

```powershell
git add .
git commit -m "fix: corrigir workflow do Azure"
git push origin main
```

O GitHub Actions irá executar automaticamente e fazer o deploy!

## 🔍 Como Verificar se Funcionou

1. Acesse: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions
2. Você verá o workflow rodando
3. Clique no workflow para ver os logs
4. Se tudo estiver correto, verá ✅ em todas as etapas

## ⚠️ SEGURANÇA

**NUNCA** compartilhe este token publicamente ou faça commit dele no código!

- ✅ Usar GitHub Secrets (correto)
- ❌ Adicionar no código ou em arquivos de configuração
- ❌ Compartilhar em chats ou emails públicos

## 📸 Visual Guide

```
GitHub Repo
  └─ Settings
      └─ Secrets and variables
          └─ Actions
              └─ New repository secret
                  ├─ Name: AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F
                  └─ Value: [seu token aqui]
```

## 🆘 Se o Token Não Funcionar

1. **Verificar se o token está correto**
   - Acesse: https://portal.azure.com
   - Vá em Static Web Apps > PICTIBMEC
   - Clique em "Manage deployment token"
   - Copie o token novamente

2. **Regenerar Token**
   - No Portal Azure, clique em "Reset deployment token"
   - Atualize o secret no GitHub com o novo token

3. **Verificar nome do secret**
   - Deve ser exatamente: `AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F`
   - Diferenças de maiúsculas/minúsculas importam!

## ✅ Próximos Passos

Após configurar o secret:

1. ✅ Adicionar secret no GitHub
2. ✅ Fazer commit e push
3. ✅ Aguardar deploy automático
4. ✅ Verificar em https://icy-sea-0c53d910f.3.azurestaticapps.net

---

**Link Direto para Secrets:**
https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions
