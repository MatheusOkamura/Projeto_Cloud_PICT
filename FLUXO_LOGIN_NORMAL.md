# 🔐 Fluxo Normal de Login - Documentação Completa

## 📋 Resumo

O sistema agora implementa um fluxo de login que verifica se o usuário existe no banco de dados e se possui todos os dados obrigatórios. Caso o usuário não exista ou esteja com cadastro incompleto, será redirecionado para a tela de cadastro.

## 🎯 Objetivos Implementados

✅ Login funciona normalmente, verificando banco de dados  
✅ Usuários novos são redirecionados para cadastro  
✅ Usuários existentes sem dados completos vão para cadastro  
✅ Usuários de teste (3) mantêm funcionamento especial  
✅ Fluxo OAuth e legacy-login funcionam de forma consistente

---

## 🔄 Fluxos de Autenticação

### 1️⃣ Usuários de Teste (Desenvolvimento)

**Usuários Especiais:**
- `aluno.teste@alunos.ibmec.edu.br`
- `professor.teste@orientador.ibmec.edu.br`
- `coordenador.teste@coordenador.ibmec.edu.br`

**Comportamento:**
- ✅ Podem fazer login direto com **qualquer senha**
- ✅ **Bypass completo** da verificação de cadastro
- ✅ Sempre `is_new_user = false`
- ✅ Vão **direto para o dashboard**
- ✅ Não precisam ter CPF, telefone, etc.

**Quando usar:**
- Desenvolvimento local
- Testes rápidos
- Demonstrações

---

### 2️⃣ Usuários Normais - OAuth (Microsoft)

**Fluxo:**

```
1. Usuário clica "Entrar com Microsoft"
   ↓
2. Redireciona para login Microsoft
   ↓
3. Microsoft autentica e retorna para /auth/callback
   ↓
4. Backend verifica se usuário existe no banco
   ↓
5a. NÃO EXISTE → Cria usuário + is_new_user=true
5b. EXISTE mas FALTA DADOS → is_new_user=true
5c. EXISTE e está COMPLETO → is_new_user=false
   ↓
6. Redireciona para frontend com token e flag
   ↓
7a. is_new_user=true → /cadastro (completar dados)
7b. is_new_user=false → /dashboard-{tipo}
```

**Verificação de Dados Obrigatórios:**

| Tipo | Campos Obrigatórios |
|------|-------------------|
| **Aluno** | CPF, telefone, curso, matricula |
| **Orientador** | telefone, departamento |
| **Coordenador** | telefone, departamento |

**Endpoint Backend:**
- `GET /api/auth/login` - Inicia OAuth
- `GET /api/auth/callback` - Processa callback Microsoft

---

### 3️⃣ Usuários Normais - Legacy Login

**Em Desenvolvimento:**
- ❌ **BLOQUEADO** para usuários não-teste
- Retorna `403 Forbidden`
- Mensagem: "Login direto disponível apenas para usuários de teste em desenvolvimento"
- Devem usar OAuth

**Em Produção:**
- ✅ Funciona normalmente
- Valida senha do banco
- Mesma lógica de verificação de dados obrigatórios

---

## 💻 Implementação Técnica

### Backend - `routes/auth.py`

**OAuth Callback (`/api/auth/callback`):**

```python
# 1. Busca ou cria usuário
user_data = db.query(DBUsuario).filter(DBUsuario.email == email).first()

if not user_data:
    # Criar novo usuário
    is_new_user = True
    # ... criar no banco
else:
    is_new_user = False

# 2. Verificar se precisa completar cadastro
# (EXCETO para usuários de teste em dev)
precisa_completar_cadastro = False

if not (microsoft_oauth.is_development and microsoft_oauth.is_test_user(email)):
    # Verificar dados obrigatórios por tipo
    if user_data.tipo == TipoUsuario.aluno:
        if not all([cpf, telefone, curso, matricula]):
            precisa_completar_cadastro = True
    # ... outros tipos

# 3. Se falta dados, marcar como novo usuário
if precisa_completar_cadastro:
    is_new_user = True

# 4. Redirecionar com flag is_new_user
redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}&user={user_encoded}&is_new_user={is_new_user}"
```

**Legacy Login (`/api/auth/legacy-login`):**

Mesma lógica de verificação, mas:
- Em dev: bloqueia não-teste com 403
- Para teste: bypass de senha e cadastro

---

### Frontend - `AuthCallback.jsx`

```javascript
// 1. Recebe parâmetros do backend
const token = searchParams.get('token');
const userEncoded = searchParams.get('user');
const isNewUser = searchParams.get('is_new_user') === 'true';

// 2. Salva no contexto
handleOAuthCallback(token, userData, isNewUser);

// 3. Verifica se precisa completar cadastro
const precisaCompletarCadastro = 
    (userData.tipo === 'aluno' && !userData.curso) ||
    (userData.tipo === 'orientador' && !userData.departamento);

// 4. Redireciona
if (precisaCompletarCadastro) {
    navigate('/cadastro', { state: { email, nome, tipo } });
} else {
    navigate(`/dashboard-${userData.tipo}`);
}
```

---

## 🧪 Testes

Execute o script de teste:

```powershell
.\test_fluxo_normal_login.ps1
```

**Testes Inclusos:**
1. ✅ Login de usuário de teste → sucesso direto
2. ✅ Login de usuário normal → 403 bloqueado
3. ✅ Verificação de is_new_user flag

---

## 📊 Matriz de Decisão

| Situação | is_new_user | Destino |
|----------|-------------|---------|
| Usuário de teste | `false` | Dashboard |
| Novo usuário (OAuth) | `true` | Cadastro |
| Existente sem CPF (aluno) | `true` | Cadastro |
| Existente sem tel (orientador) | `true` | Cadastro |
| Existente completo | `false` | Dashboard |

---

## 🔍 Logs de Depuração

O sistema gera logs no console do backend:

```
✅ Usuário existente: joao.silva@alunos.ibmec.edu.br
⚠️ Aluno precisa completar cadastro: faltam dados obrigatórios
📝 Usuário será redirecionado para completar cadastro
```

```
✅ Usuário de teste: bypass de verificação de cadastro completo
✅ Usuário de teste: bypass de validação de senha
```

---

## ⚙️ Configuração

### Backend - `.env`

```env
# Modo de desenvolvimento (ativa usuários de teste)
ENVIRONMENT=development

# Microsoft OAuth
MICROSOFT_TENANT_ID=5638588d-890a-4954-b63a-912e97a8c2b3
MICROSOFT_CLIENT_ID=d17a3338-b81b-4720-97d6-0d4e55a626fb
MICROSOFT_CLIENT_SECRET=seu_secret

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### Backend - `microsoft_auth.py`

```python
# Lista de usuários de teste
self.test_users = [
    "aluno.teste@alunos.ibmec.edu.br",
    "professor.teste@orientador.ibmec.edu.br",
    "coordenador.teste@coordenador.ibmec.edu.br"
]

# Detectar modo desenvolvimento
self.is_development = os.getenv("ENVIRONMENT", "production") == "development"
```

---

## 🚀 Como Usar

### Para Desenvolvimento (Local)

**Opção 1: Usuários de Teste (Rápido)**
1. Abrir http://localhost:5173/login
2. Usar formulário com:
   - Email: `aluno.teste@alunos.ibmec.edu.br`
   - Senha: qualquer (ex: `123`)
3. Vai direto para dashboard

**Opção 2: OAuth (Fluxo Real)**
1. Clicar "Entrar com Microsoft"
2. Fazer login com conta @ibmec.edu.br
3. Se é primeira vez ou falta dados → Cadastro
4. Se já tem tudo → Dashboard

### Para Produção

**Apenas OAuth:**
1. Usuário clica "Entrar com Microsoft"
2. Faz login com conta institucional
3. Sistema verifica dados e redireciona

---

## 🔒 Segurança

### Em Desenvolvimento
- ✅ Usuários de teste: senha qualquer (apenas 3 específicos)
- ❌ Outros usuários: bloqueados no legacy-login
- ✅ OAuth: funciona normalmente

### Em Produção
- ✅ Sem usuários de teste
- ✅ OAuth obrigatório
- ✅ Validação completa de dados

---

## 📝 Próximos Passos

1. ✅ Implementado: Verificação de dados obrigatórios
2. ✅ Implementado: Redirecionamento para cadastro
3. ✅ Implementado: Manutenção de usuários de teste
4. 🔄 Sugestão: Criar página de cadastro/edição de perfil completa
5. 🔄 Sugestão: Adicionar validação de CPF no frontend
6. 🔄 Sugestão: Adicionar upload de documento CR

---

## 🐛 Troubleshooting

### Problema: "403 Forbidden" ao tentar login
**Solução:** Em desenvolvimento, use usuários de teste ou OAuth

### Problema: Redirecionando sempre para cadastro
**Solução:** Verifique se usuário tem todos os campos obrigatórios:
```sql
SELECT email, cpf, telefone, curso, matricula, departamento 
FROM usuarios 
WHERE email = 'seu.email@ibmec.edu.br';
```

### Problema: Usuário de teste não funciona
**Solução:** 
1. Verificar se ENVIRONMENT=development no .env
2. Verificar se email está exatamente na lista test_users
3. Verificar logs do backend

---

## 📚 Arquivos Modificados

- `backend/routes/auth.py` - Lógica de verificação de dados
- `backend/microsoft_auth.py` - Lista de usuários de teste
- `frontend/src/pages/AuthCallback.jsx` - Já tinha a lógica de verificação
- `frontend/src/pages/Login.jsx` - Já tinha a lógica de verificação

## 📚 Arquivos Criados

- `test_fluxo_normal_login.ps1` - Script de testes
- `FLUXO_LOGIN_NORMAL.md` - Esta documentação

---

**Documentação atualizada em:** 21/11/2024  
**Versão:** 2.0 - Fluxo Normal com Verificação de Dados
