# 🔐 Guia de Implementação OAuth 2.0 com Microsoft

## 📋 Resumo das Mudanças

O sistema agora suporta **autenticação OAuth 2.0** com Microsoft Azure AD, oferecendo dois modos de login:

1. **🔐 Login OAuth (Recomendado)**: Login interativo com Microsoft sem necessidade de senha
2. **📝 Login Legado**: Formulário tradicional com email/senha (para compatibilidade)

---

## 🎯 Fluxo de Autenticação OAuth

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│ Frontend│         │  Backend │         │Microsoft │         │  Graph  │
│  Login  │         │   API    │         │  OAuth   │         │   API   │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
     │                   │                     │                     │
     │ 1. Click "Entrar  │                     │                     │
     │    com Microsoft" │                     │                     │
     ├──────────────────>│                     │                     │
     │                   │                     │                     │
     │      2. GET       │                     │                     │
     │  /api/auth/login  │                     │                     │
     │                   │                     │                     │
     │                   │ 3. Gera Auth URL    │                     │
     │                   │    com state        │                     │
     │                   ├────────────────────>│                     │
     │                   │                     │                     │
     │ 4. RedirectResponse                     │                     │
     │    para Microsoft │                     │                     │
     │<──────────────────┤                     │                     │
     │                                         │                     │
     │ 5. Usuário faz login                    │                     │
     │    na Microsoft   │                     │                     │
     ├────────────────────────────────────────>│                     │
     │                                         │                     │
     │ 6. Microsoft retorna código autorização │                     │
     │<────────────────────────────────────────┤                     │
     │                                                               │
     │      7. GET                             │                     │
     │  /api/auth/callback                     │                     │
     │     ?code=xxx&state=yyy                 │                     │
     ├──────────────────>│                     │                     │
     │                   │                     │                     │
     │                   │ 8. Valida state     │                     │
     │                   │    (CSRF protection)│                     │
     │                   │                     │                     │
     │                   │ 9. Troca código     │                     │
     │                   │    por access_token │                     │
     │                   ├────────────────────>│                     │
     │                   │                     │                     │
     │                   │ 10. Retorna tokens  │                     │
     │                   │<────────────────────┤                     │
     │                   │                     │                     │
     │                   │ 11. GET /me com token                     │
     │                   ├──────────────────────────────────────────>│
     │                   │                                           │
     │                   │ 12. Retorna user_info                     │
     │                   │<──────────────────────────────────────────┤
     │                   │                                           │
     │                   │ 13. Busca/cria usuário no banco           │
     │                   │                                           │
     │                   │ 14. Cria JWT token                        │
     │                   │                                           │
     │ 15. Redirect para │                                           │
     │     frontend com  │                                           │
     │     token e user  │                                           │
     │<──────────────────┤                                           │
     │                                                               │
     │ 16. Salva token   │                                           │
     │     no localStorage                                           │
     │                                                               │
     │ 17. Navega para   │                                           │
     │     dashboard     │                                           │
     │                                                               │
```

---

## 🆕 Novos Endpoints

### Backend (`backend/routes/auth.py`)

#### `GET /api/auth/login`
- Inicia fluxo OAuth 2.0
- Gera URL de autorização com `state` (CSRF protection)
- Redireciona usuário para login Microsoft

#### `GET /api/auth/callback`
- Recebe código de autorização da Microsoft
- Valida `state` para proteção CSRF
- Troca código por `access_token`
- Obtém informações do usuário via Microsoft Graph API
- Cria ou busca usuário no banco de dados
- Gera JWT token
- Redireciona para frontend com token

#### `POST /api/auth/legacy-login`
- Login legado (formulário com email/senha)
- Mantido para compatibilidade
- Recomendado migrar para OAuth

---

## 📁 Arquivos Modificados

### Backend

1. **`backend/microsoft_auth.py`**
   - ✅ Adicionado: `get_authorization_url()` - Gera URL OAuth
   - ✅ Adicionado: `exchange_code_for_token()` - Troca código por token
   - ✅ Adicionado: `get_user_info_from_token()` - Obtém dados do usuário
   - ✅ Mantido: `validate_institutional_email()` - Validação de email

2. **`backend/routes/auth.py`**
   - ✅ Adicionado: `GET /auth/login` - Inicia OAuth
   - ✅ Adicionado: `GET /auth/callback` - Callback OAuth
   - ✅ Adicionado: `create_access_token()` - Cria JWT
   - ✅ Renomeado: `POST /login` → `POST /auth/legacy-login`

3. **`backend/.env.example`**
   - ✅ Adicionado: `MICROSOFT_REDIRECT_URI`
   - ✅ Adicionado: `FRONTEND_URL`
   - ✅ Adicionado: `JWT_SECRET_KEY`
   - ✅ Atualizado: Documentação de permissões OAuth

### Frontend

1. **`frontend/src/context/AuthContext.jsx`**
   - ✅ Adicionado: `loginWithOAuth()` - Redireciona para OAuth
   - ✅ Adicionado: `handleOAuthCallback()` - Processa retorno OAuth
   - ✅ Adicionado: `token` state - Armazena JWT
   - ✅ Adicionado: `updateUser()` - Atualiza dados do usuário

2. **`frontend/src/pages/Login.jsx`**
   - ✅ Adicionado: Botão "Entrar com Microsoft" (destaque)
   - ✅ Mantido: Formulário legado (abaixo de divisor)
   - ✅ Adicionado: Loading state durante redirect

3. **`frontend/src/pages/AuthCallback.jsx`** *(NOVO)*
   - ✅ Processa parâmetros da URL (`token`, `user`, `is_new_user`)
   - ✅ Decodifica dados do usuário (base64)
   - ✅ Salva token e usuário no contexto
   - ✅ Redireciona para dashboard ou cadastro

4. **`frontend/src/App.jsx`**
   - ✅ Adicionado: Rota `/auth/callback`
   - ✅ Alterado: `/completar-cadastro` → `/cadastro`
   - ✅ Alterado: `/dashboard/aluno` → `/dashboard-aluno`

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Backend (.env)
MICROSOFT_TENANT_ID=seu-tenant-id
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/auth/callback
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=sua-chave-secreta-jwt
```

### 2. Azure AD App Registration

1. Acesse [Azure Portal](https://portal.azure.com)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Configure:
   - **Name**: `Ibmec Iniciação Científica`
   - **Redirect URI**: `Web` → `http://localhost:8000/api/auth/callback`
4. Copie **Tenant ID** e **Client ID**
5. **Certificates & secrets** → **New client secret** → Copie o **Value**
6. **API permissions** → **Add a permission**:
   - **Microsoft Graph** → **Delegated permissions**:
     - ✅ `User.Read`
     - ✅ `openid`
     - ✅ `profile`
     - ✅ `email`
   - **Microsoft Graph** → **Application permissions**:
     - ✅ `User.Read.All` (para validação de email)
7. **Grant admin consent** para todas as permissões

---

## 🚀 Como Usar

### Usuário Final

1. Acesse a página de login
2. Clique em **"Entrar com Microsoft"** (botão azul com logo Microsoft)
3. Será redirecionado para login Microsoft
4. Faça login com email institucional `@ibmec.edu.br`
5. Autorize o aplicativo
6. Será redirecionado de volta com autenticação completa

### Desenvolvedor

#### Testar OAuth Flow

```bash
# Backend
cd backend
python -m uvicorn main:app --reload

# Frontend (novo terminal)
cd frontend
npm run dev
```

**Teste manual:**
1. Navegue para `http://localhost:5173/login`
2. Clique em "Entrar com Microsoft"
3. Acompanhe logs no terminal do backend:
   ```
   🔐 Redirecionando para login Microsoft (state: abc12345...)
   ✅ State validado: abc12345...
   🔄 Trocando código por token...
   ✅ Token obtido com sucesso
   👤 Obtendo informações do usuário...
   ✅ Usuário Microsoft: João Silva (joao.silva@alunos.ibmec.edu.br)
   ✅ Novo usuário criado: joao.silva@alunos.ibmec.edu.br (tipo: aluno)
   🎉 Autenticação concluída! Redirecionando para frontend...
   ```

#### Testar Login Legado

```bash
curl -X POST http://localhost:8000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email": "aluno@alunos.ibmec.edu.br", "senha": "senha123"}'
```

---

## 🔐 Segurança

### CSRF Protection
- Cada requisição OAuth gera um `state` UUID único
- Backend valida `state` no callback
- `state` usado uma vez é marcado como "usado"

### JWT Tokens
- Algoritmo: **HS256**
- Expiração: **60 minutos**
- Payload: `user_id`, `email`, `tipo`, `nome`
- Armazenado em: `localStorage` (frontend)

### OAuth Scopes
- **User.Read**: Leitura de perfil básico
- **openid**: Identificação OpenID Connect
- **profile**: Nome, foto do usuário
- **email**: Endereço de email verificado

---

## 🐛 Troubleshooting

### Erro: "State de autenticação inválido"
- **Causa**: `state` expirado ou já usado
- **Solução**: Faça login novamente

### Erro: "Email institucional não encontrado"
- **Causa**: Email não está no formato `@ibmec.edu.br`
- **Solução**: Verifique se usou email institucional correto

### Erro: "Falha ao obter token de acesso"
- **Causa**: Credenciais OAuth incorretas
- **Solução**: Verifique `MICROSOFT_CLIENT_SECRET` no `.env`

### Frontend não redireciona após login
- **Causa**: `FRONTEND_URL` incorreta no backend
- **Solução**: Confirme `FRONTEND_URL=http://localhost:5173` em `.env`

### Logs para Debug

Backend mostra cada etapa:
```
🔐 Redirecionando para login Microsoft...
✅ State validado
🔄 Trocando código por token...
✅ Token obtido
👤 Obtendo informações do usuário...
✅ Usuário: Nome (email)
🎉 Autenticação concluída!
```

---

## 📊 Comparação: OAuth vs Legado

| Característica | OAuth 2.0 | Login Legado |
|----------------|-----------|--------------|
| **Segurança** | ✅ Alta (sem senha no sistema) | ⚠️ Média (armazena senha) |
| **UX** | ✅ Single Sign-On | ⚠️ Precisa lembrar senha |
| **Validação** | ✅ Microsoft valida | ⚠️ Sistema valida |
| **Senha** | ✅ Não necessária | ❌ Obrigatória |
| **2FA** | ✅ Suportado nativamente | ❌ Não suportado |
| **Revogação** | ✅ Microsoft gerencia | ⚠️ Manual |

**Recomendação**: Migre todos os usuários para OAuth 2.0

---

## 🔄 Migração

### Para Usuários Existentes

Usuários com senha continuam funcionando no login legado, mas podem migrar para OAuth:

1. Faça logout
2. Na tela de login, clique "Entrar com Microsoft"
3. Sistema reconhece email existente
4. Conta é atualizada para usar OAuth

### Para Novos Usuários

- ✅ Devem usar **apenas** OAuth
- ❌ Não criar senha manualmente
- ✅ Sistema cria usuário automaticamente no primeiro login

---

## 📝 Próximos Passos

- [ ] Implementar refresh token
- [ ] Adicionar logout da Microsoft
- [ ] Migração automática de usuários legados
- [ ] Desabilitar login legado após migração completa
- [ ] Implementar MFA adicional (se necessário)

---

## 💡 Dicas

### Performance
- Tokens em cache reduzem chamadas à Microsoft
- JWT permite validação sem consultar banco

### UX
- Loading states durante redirects
- Mensagens claras de erro
- Botão OAuth em destaque (azul Microsoft)

### Desenvolvimento
- Modo fallback se credenciais não configuradas
- Logs detalhados para debugging
- Tratamento de erros com mensagens amigáveis

---

## 📚 Referências

- [Microsoft OAuth 2.0 Docs](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Authorization Code Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Status**: ✅ Implementado e funcional  
**Versão**: 1.0.0  
**Data**: Janeiro 2025
