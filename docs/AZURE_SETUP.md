# 🔧 Configuração Azure AD - Passo a Passo

## 📋 Pré-requisitos

- Conta Microsoft com permissões de administrador no Azure AD
- Acesso ao [Azure Portal](https://portal.azure.com)
- Domínio institucional configurado (`@ibmec.edu.br`)

---

## 🚀 Configuração Rápida

### Etapa 1: Acessar Azure Portal

1. Acesse [https://portal.azure.com](https://portal.azure.com)
2. Faça login com conta institucional de administrador
3. No menu lateral, procure por **"Azure Active Directory"**

---

### Etapa 2: Registrar Aplicação

1. No painel do Azure AD, clique em **"App registrations"** (Registros de aplicativo)
2. Clique em **"+ New registration"** (Novo registro)

#### Configurações do Registro:
```
Nome: Ibmec Iniciação Científica - PICT
Tipos de conta suportados: 
  ○ Contas neste diretório organizacional apenas (Ibmec - Locatário único)
  
Redirect URI:
  Platform: Web
  URI: http://localhost:8000/api/auth/callback
```

3. Clique em **"Register"** (Registrar)

---

### Etapa 3: Copiar Credenciais

Após o registro, você verá a página "Overview" da aplicação:

#### 📝 Copiar IDs necessários:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

**Copie esses valores e guarde:**
- `MICROSOFT_CLIENT_ID` = Application (client) ID
- `MICROSOFT_TENANT_ID` = Directory (tenant) ID

---

### Etapa 4: Criar Client Secret

1. No menu lateral da aplicação, clique em **"Certificates & secrets"** (Certificados e segredos)
2. Clique na aba **"Client secrets"** (Segredos do cliente)
3. Clique em **"+ New client secret"** (Novo segredo do cliente)

#### Configurações do Secret:
```
Description: PICT Development Secret
Expires: 24 months (recomendado para desenvolvimento)
```

4. Clique em **"Add"** (Adicionar)

⚠️ **IMPORTANTE**: Copie o **Value** (Valor) do secret **IMEDIATAMENTE**!  
Ele será exibido apenas uma vez. Se perder, precisa criar novo.

```
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copie esse valor:**
- `MICROSOFT_CLIENT_SECRET` = Value (do secret)

---

### Etapa 5: Configurar Permissões da API

1. No menu lateral, clique em **"API permissions"** (Permissões da API)
2. Você verá uma permissão padrão: `User.Read` (Delegated)

#### Adicionar Permissões Delegated (para OAuth):

3. Clique em **"+ Add a permission"** (Adicionar uma permissão)
4. Selecione **"Microsoft Graph"**
5. Selecione **"Delegated permissions"**
6. Na barra de busca, procure e marque:
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
   - ✅ `User.Read` (já deve estar marcado)

7. Clique em **"Add permissions"** (Adicionar permissões)

#### Adicionar Permissões Application (para validação de email):

8. Clique novamente em **"+ Add a permission"**
9. Selecione **"Microsoft Graph"**
10. Selecione **"Application permissions"**
11. Na barra de busca, procure e marque:
    - ✅ `User.Read.All`

12. Clique em **"Add permissions"**

#### Grant Admin Consent:

13. Clique no botão **"Grant admin consent for [Ibmec]"**
14. Confirme clicando em **"Yes"**

✅ Todas as permissões devem mostrar status **"Granted for [Ibmec]"** (verde)

---

### Etapa 6: Configurar Redirect URIs (Produção)

Para produção, adicione URLs adicionais:

1. No menu lateral, clique em **"Authentication"** (Autenticação)
2. Em **"Platform configurations"**, clique em **"Web"**
3. Adicione Redirect URIs adicionais:

```
http://localhost:8000/api/auth/callback     (Desenvolvimento)
https://seu-dominio.com/api/auth/callback   (Produção)
```

4. Em **"Implicit grant and hybrid flows"**, deixe tudo **desmarcado**
5. Clique em **"Save"** (Salvar)

---

## 🔐 Configurar Variáveis de Ambiente

Agora que você tem todas as credenciais, configure o arquivo `.env`:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e adicione:

```bash
# =============================================================================
# Microsoft Azure AD OAuth 2.0
# =============================================================================
MICROSOFT_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/auth/callback
FRONTEND_URL=http://localhost:5173

# =============================================================================
# JWT Configuration
# =============================================================================
JWT_SECRET_KEY=gere-uma-chave-aleatoria-super-segura-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

### Gerar JWT Secret Key:

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Minimum 0 -Maximum 255}))

# Online
# https://randomkeygen.com/
```

---

## ✅ Verificar Configuração

### 1. Verificar no Azure Portal

Acesse a página "Overview" da aplicação e confirme:

- ✅ **Application (client) ID** está correto
- ✅ **Directory (tenant) ID** está correto
- ✅ **Redirect URI** está configurada
- ✅ **Client secret** foi criado (não expira em breve)
- ✅ **Permissões** estão concedidas (status verde)

### 2. Testar Credenciais

Execute o script de teste:

```bash
cd backend

# Criar arquivo test_microsoft_auth.py
python test_microsoft_auth.py
```

```python
# test_microsoft_auth.py
import os
from microsoft_auth import microsoft_oauth

def test_credentials():
    print("🔍 Testando credenciais Microsoft...")
    
    # Verificar variáveis de ambiente
    tenant_id = os.getenv("MICROSOFT_TENANT_ID")
    client_id = os.getenv("MICROSOFT_CLIENT_ID")
    client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    
    if not all([tenant_id, client_id, client_secret]):
        print("❌ Variáveis de ambiente não configuradas!")
        return False
    
    print(f"✅ Tenant ID: {tenant_id[:8]}...")
    print(f"✅ Client ID: {client_id[:8]}...")
    print(f"✅ Secret configurado: Sim")
    
    # Testar geração de URL OAuth
    try:
        auth_data = microsoft_oauth.get_authorization_url()
        auth_url = auth_data["authorization_url"]
        print(f"✅ URL OAuth gerada com sucesso")
        print(f"   URL: {auth_url[:50]}...")
        return True
    except Exception as e:
        print(f"❌ Erro ao gerar URL OAuth: {e}")
        return False

if __name__ == "__main__":
    success = test_credentials()
    if success:
        print("\n🎉 Configuração OK! Pronto para usar OAuth.")
    else:
        print("\n❌ Configuração incorreta. Revise as credenciais.")
```

Execute:
```bash
python test_microsoft_auth.py
```

**Saída esperada:**
```
🔍 Testando credenciais Microsoft...
✅ Tenant ID: 12345678...
✅ Client ID: abcdefgh...
✅ Secret configurado: Sim
✅ URL OAuth gerada com sucesso
   URL: https://login.microsoftonline.com/12345678...

🎉 Configuração OK! Pronto para usar OAuth.
```

---

## 🐛 Troubleshooting

### Erro: "Application not found"
```
Causa: CLIENT_ID incorreto
Solução: Verifique Application (client) ID no Azure Portal
```

### Erro: "Invalid client secret"
```
Causa: CLIENT_SECRET incorreto ou expirado
Solução: Crie novo secret em "Certificates & secrets"
```

### Erro: "Redirect URI mismatch"
```
Causa: URL de callback não está registrada
Solução: Adicione http://localhost:8000/api/auth/callback em "Authentication"
```

### Erro: "Admin consent required"
```
Causa: Permissões não foram concedidas
Solução: Clique "Grant admin consent" em "API permissions"
```

### Erro: "Insufficient privileges"
```
Causa: Conta não tem permissões de administrador
Solução: Use conta de administrador do Azure AD
```

---

## 📊 Resumo das Permissões

| Permissão | Tipo | Propósito | Admin Consent |
|-----------|------|-----------|---------------|
| `User.Read` | Delegated | Ler perfil do usuário logado | Não |
| `openid` | Delegated | Autenticação OpenID Connect | Não |
| `profile` | Delegated | Nome e foto do usuário | Não |
| `email` | Delegated | Email do usuário | Não |
| `User.Read.All` | Application | Validar emails institucionais | **Sim** |

⚠️ **Admin consent** é necessário para permissões do tipo **Application**

---

## 🔒 Segurança

### Proteger Client Secret

❌ **NUNCA** commite o arquivo `.env` no Git:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep .env

# Se não estiver, adicione:
echo ".env" >> .gitignore
```

### Rotacionar Secrets

1. Crie novo secret no Azure Portal
2. Atualize `.env` com novo valor
3. Teste a aplicação
4. Delete secret antigo após 24-48h

### Produção

- Use **Azure Key Vault** para armazenar secrets
- Configure **Managed Identity** para acesso sem credenciais
- Habilite **Application Insights** para monitoramento

---

## 📝 Checklist Final

Antes de testar o sistema, confirme:

- [ ] Aplicação registrada no Azure AD
- [ ] Redirect URI configurada: `http://localhost:8000/api/auth/callback`
- [ ] Client secret criado e copiado
- [ ] Tenant ID copiado
- [ ] Client ID copiado
- [ ] Permissões delegated adicionadas: User.Read, openid, profile, email
- [ ] Permissão application adicionada: User.Read.All
- [ ] Admin consent concedido (status verde)
- [ ] Arquivo `.env` criado com todas as credenciais
- [ ] JWT_SECRET_KEY gerada
- [ ] Script de teste executado com sucesso

---

## 🎯 Próximos Passos

Após configuração:

1. **Teste o fluxo OAuth**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   
   # Novo terminal
   cd frontend
   npm run dev
   ```

2. **Acesse**: http://localhost:5173/login

3. **Clique**: "Entrar com Microsoft"

4. **Verifique logs** no terminal do backend

5. **Confirme**: Redirecionamento funciona corretamente

---

## 📚 Referências

- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Azure AD Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)

---

**Status**: ✅ Guia completo  
**Última atualização**: Janeiro 2025
