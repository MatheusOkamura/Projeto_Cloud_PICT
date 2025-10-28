# 🧪 Guia Rápido de Teste - OAuth 2.0

## ⚡ Testes Rápidos

### 1️⃣ Teste OAuth Flow (Recomendado)

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Passos:**
1. Abra `http://localhost:5173/login`
2. Clique no botão azul **"Entrar com Microsoft"**
3. Será redirecionado para login Microsoft
4. Faça login com email `@ibmec.edu.br`
5. Autorize o aplicativo
6. Deve retornar para o sistema autenticado

**Logs esperados no backend:**
```
🔐 Redirecionando para login Microsoft (state: abc123...)
✅ State validado: abc123...
🔄 Trocando código por token...
✅ Token obtido com sucesso
👤 Obtendo informações do usuário...
✅ Usuário Microsoft: Seu Nome (seu.email@ibmec.edu.br)
✅ Novo usuário criado: seu.email@ibmec.edu.br (tipo: aluno)
🎉 Autenticação concluída! Redirecionando para frontend...
```

---

### 2️⃣ Teste Login Legado (Compatibilidade)

**Via Interface:**
1. Na página de login, role para baixo
2. Preencha formulário abaixo do divisor "Ou use o formulário"
3. Email: `aluno@alunos.ibmec.edu.br`
4. Senha: `senha123`
5. Clique "Entrar"

**Via API:**
```bash
curl -X POST http://localhost:8000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@alunos.ibmec.edu.br",
    "senha": "senha123"
  }'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "aluno@alunos.ibmec.edu.br",
    "nome": "Nome do Aluno",
    "tipo": "aluno",
    ...
  },
  "is_new_user": false
}
```

---

### 3️⃣ Teste Callback Direto

**Simular callback OAuth (desenvolvimento):**
```bash
# Gerar auth URL
curl http://localhost:8000/api/auth/login -L

# Backend retorna redirect para Microsoft
# Copie o state da URL
```

---

### 4️⃣ Teste JWT Token

**Decodificar JWT:**
```bash
# Copie o access_token da resposta
# Cole em https://jwt.io

# Payload esperado:
{
  "sub": "email@ibmec.edu.br",
  "user_id": 1,
  "tipo": "aluno",
  "nome": "Nome do Usuário",
  "exp": 1234567890
}
```

---

## ✅ Checklist de Testes

### Backend
- [ ] `GET /api/auth/login` retorna RedirectResponse
- [ ] `GET /api/auth/callback` processa code e state
- [ ] `POST /api/auth/legacy-login` funciona com email/senha
- [ ] JWT token é criado corretamente
- [ ] Usuário é salvo no banco SQLite
- [ ] Logs aparecem no console

### Frontend
- [ ] Botão "Entrar com Microsoft" aparece
- [ ] Redirecionamento para Microsoft funciona
- [ ] Página `/auth/callback` processa retorno
- [ ] Token é salvo no localStorage
- [ ] Usuário é salvo no localStorage
- [ ] Redirecionamento para dashboard correto

### Fluxo Completo
- [ ] Novo usuário: Login OAuth → Redirect → Callback → Cadastro
- [ ] Usuário existente: Login OAuth → Redirect → Callback → Dashboard
- [ ] Login legado funciona para compatibilidade
- [ ] Logout limpa localStorage
- [ ] Rotas protegidas verificam autenticação

---

## 🐛 Problemas Comuns

### "State inválido"
```bash
# Causa: State expirado ou já usado
# Solução: Faça login novamente
```

### "Email não encontrado"
```bash
# Causa: Email não é @ibmec.edu.br
# Solução: Use email institucional
```

### "Token não encontrado"
```bash
# Causa: Callback não recebeu token
# Solução: Verifique logs do backend
```

### Frontend não redireciona
```bash
# Causa: FRONTEND_URL incorreta
# Solução: Confirme .env:
FRONTEND_URL=http://localhost:5173
```

---

## 📊 Teste de Performance

```bash
# Teste múltiplos logins simultâneos
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/legacy-login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"aluno$i@alunos.ibmec.edu.br\", \"senha\": \"senha123\"}" &
done

# Todos devem retornar 200 ou 201
```

---

## 🔍 Debug

### Ver logs detalhados

**Backend:**
```python
# Adicione em auth.py (temporário)
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```javascript
// Adicione em AuthCallback.jsx
console.log('Token:', token);
console.log('User:', userData);
console.log('Is New:', isNewUser);
```

### Verificar banco de dados

```bash
cd backend
sqlite3 iniciacao_cientifica.db

# Listar usuários
SELECT id, email, nome, tipo, status FROM usuario;

# Sair
.quit
```

---

## 📝 Cenários de Teste

### Cenário 1: Aluno Novo
1. **Ação**: Login OAuth com email `@alunos.ibmec.edu.br`
2. **Esperado**: Criar usuário tipo "aluno", redirecionar para cadastro
3. **Validar**: Usuário no banco, tipo correto, status "ativo"

### Cenário 2: Professor Novo
1. **Ação**: Login OAuth com email `@orientador.ibmec.edu.br`
2. **Esperado**: Criar usuário tipo "orientador", redirecionar para dashboard
3. **Validar**: Usuário no banco, tipo "orientador"

### Cenário 3: Usuário Existente
1. **Ação**: Login OAuth com email já cadastrado
2. **Esperado**: Não criar duplicata, redirecionar para dashboard
3. **Validar**: Apenas 1 registro no banco

### Cenário 4: Email Inválido
1. **Ação**: Login legado com `teste@gmail.com`
2. **Esperado**: Erro "Email não é institucional"
3. **Validar**: 401 Unauthorized

---

## 🎯 Teste de Integração

```bash
# Script completo de teste
# Salve como test_auth.sh

#!/bin/bash

echo "🧪 Testando autenticação..."

# 1. Login legado
echo "1️⃣ Testando login legado..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/legacy-login \
  -H "Content-Type: application/json" \
  -d '{"email": "aluno@alunos.ibmec.edu.br", "senha": "senha123"}')

echo "$RESPONSE" | jq .

TOKEN=$(echo "$RESPONSE" | jq -r .access_token)

if [ "$TOKEN" != "null" ]; then
  echo "✅ Login legado: OK"
else
  echo "❌ Login legado: FALHOU"
fi

# 2. Verificar usuário no banco
echo "2️⃣ Verificando banco de dados..."
sqlite3 backend/iniciacao_cientifica.db "SELECT email, tipo FROM usuario WHERE email='aluno@alunos.ibmec.edu.br'"

echo "✅ Testes concluídos!"
```

---

## 🚀 CI/CD

```yaml
# .github/workflows/test.yml
name: Test Authentication

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest tests/test_auth.py -v
```

---

**Status**: ✅ Pronto para testes  
**Última atualização**: Janeiro 2025
