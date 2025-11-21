# Autenticação Microsoft - Configuração Correta

## 📋 Visão Geral

O sistema utiliza **OAuth 2.0 com Microsoft** para autenticação de usuários reais.

Em modo desenvolvimento, **apenas 3 usuários de teste** podem fazer login diretamente sem OAuth:
- `aluno.teste@alunos.ibmec.edu.br`
- `professor.teste@orientador.ibmec.edu.br`
- `coordenador.teste@coordenador.ibmec.edu.br`

Todos os outros usuários **devem usar o fluxo OAuth normal** mesmo em desenvolvimento.

## 🔧 Usuários de Teste (Desenvolvimento)

### Acesso Direto Permitido

Estes usuários podem fazer login via endpoint tradicional **sem** credenciais Microsoft:

```json
POST /api/auth/legacy-login

// Aluno de teste
{"email": "aluno.teste@alunos.ibmec.edu.br", "senha": "qualquer"}

// Professor de teste
{"email": "professor.teste@orientador.ibmec.edu.br", "senha": "qualquer"}

// Coordenador de teste
{"email": "coordenador.teste@coordenador.ibmec.edu.br", "senha": "qualquer"}
```

✅ **Qualquer senha funciona** para usuários de teste  
✅ **Criados automaticamente** no primeiro login  
✅ **Apenas em ambiente `development`**


## 🔒 Usuários Reais (OAuth Obrigatório)

### Todos os Outros Usuários

Qualquer email que **não seja** um dos 3 usuários de teste deve usar OAuth:

```bash
# Iniciar fluxo OAuth
GET /api/auth/login
# Redireciona para login Microsoft
# Após autenticação, redireciona para /api/auth/callback
```

❌ **Login tradicional bloqueado** para usuários não-teste:
```json
POST /api/auth/legacy-login
{"email": "usuario.real@alunos.ibmec.edu.br", "senha": "123"}

// Resposta: 403 Forbidden
// "Login direto disponível apenas para usuários de teste"
```

### Configurar OAuth Microsoft

Para que usuários reais possam fazer login, configure:

**1. Registrar App no Azure Portal**
- Acesse [portal.azure.com](https://portal.azure.com)
- Azure Active Directory > App registrations > New registration
- Redirect URI: `http://localhost:8000/api/auth/callback`

**2. Configurar Variáveis**
```env
MICROSOFT_TENANT_ID=seu-tenant-id
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
```

**3. Permissões Necessárias**
- Delegated: `User.Read`, `openid`, `profile`, `email`
- Application: `User.Read.All` (para validação)

## 🧪 Testando

### Teste Usuários de Teste
```powershell
# Deve funcionar
$body = @{email="aluno.teste@alunos.ibmec.edu.br"; senha="123"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/auth/legacy-login -Method POST -Body $body -ContentType "application/json"
```

### Teste Usuário Real (Deve Falhar sem OAuth)
```powershell
# Deve retornar 403 Forbidden
$body = @{email="joao.silva@alunos.ibmec.edu.br"; senha="123"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/auth/legacy-login -Method POST -Body $body -ContentType "application/json"
# Erro: Login direto disponível apenas para usuários de teste
```

## 📊 Resumo

| Usuário | Login Tradicional | OAuth Microsoft |
|---------|------------------|-----------------|
| `aluno.teste@alunos.ibmec.edu.br` | ✅ Permitido | ✅ Permitido |
| `professor.teste@orientador.ibmec.edu.br` | ✅ Permitido | ✅ Permitido |
| `coordenador.teste@coordenador.ibmec.edu.br` | ✅ Permitido | ✅ Permitido |
| Qualquer outro email | ❌ Bloqueado (403) | ✅ Obrigatório |

## ⚠️ Importante

### Desenvolvimento
- ✅ 3 usuários de teste com acesso direto
- ✅ Usuários reais precisam de OAuth configurado
- ✅ Validação de email institucional ativa
- ⚠️ Configure credenciais Microsoft para testar usuários reais

### Produção
- ❌ Login tradicional desabilitado
- ✅ OAuth obrigatório para todos
- ✅ Validação completa no Azure AD
- ✅ Login interativo seguro

## 🐛 Troubleshooting

### "Login direto disponível apenas para usuários de teste"
- Você está tentando usar login tradicional com usuário não-teste
- **Solução**: Use o fluxo OAuth (`GET /api/auth/login`) ou configure credenciais Microsoft

### "Microsoft OAuth não configurado"
- Credenciais Microsoft não estão no `.env`
- **Solução**: Configure `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

### "Email institucional inválido"
- Email não termina com `@ibmec.edu.br`
- **Solução**: Use um email institucional válido

### Backend não inicia
```powershell
# Ativar ambiente virtual
cd backend
.\venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r requirements.txt

# Iniciar
uvicorn main:app --reload
```

### Frontend não conecta
- Verifique se `FRONTEND_URL=http://localhost:5173` no `.env`
- Certifique-se que o CORS está configurado no `main.py`

## 📚 Referências

- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
