# 📚 Documentação do Sistema PICT

## 📋 Índice de Documentos

### 🔐 Autenticação
- **[AZURE_SETUP.md](./AZURE_SETUP.md)** - Configuração passo a passo do Azure AD
- **[OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md)** - Guia completo de implementação OAuth 2.0
- **[CHANGELOG_OAUTH.md](./CHANGELOG_OAUTH.md)** - Resumo de mudanças na implementação OAuth

### 🧪 Testes
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Guia de testes e troubleshooting

### ℹ️ Geral
- **[MICROSOFT_VALIDATION_SETUP.md](./MICROSOFT_VALIDATION_SETUP.md)** - Setup inicial de validação Microsoft (legado)

---

## 🚀 Quick Start

### 1. Configurar Azure AD
```bash
# Siga o guia completo em AZURE_SETUP.md
1. Registrar aplicação no Azure Portal
2. Copiar credenciais (Tenant ID, Client ID, Secret)
3. Configurar permissões e redirect URIs
```

### 2. Configurar Ambiente
```bash
# Backend
cd backend
cp .env.example .env
# Edite .env com suas credenciais Azure

# Frontend
cd frontend
npm install
```

### 3. Iniciar Aplicação
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Testar
```
1. Abra http://localhost:5173/login
2. Clique "Entrar com Microsoft"
3. Faça login com email @ibmec.edu.br
```

---

## 📖 Leitura Recomendada

### Para Implementação
1. **Primeiro**: [AZURE_SETUP.md](./AZURE_SETUP.md) - Configure credenciais
2. **Segundo**: [OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md) - Entenda a arquitetura
3. **Terceiro**: [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Teste o sistema

### Para Manutenção
- [CHANGELOG_OAUTH.md](./CHANGELOG_OAUTH.md) - Ver todas as mudanças feitas

---

## 🎯 Fluxo de Autenticação

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Frontend │         │  Backend │         │Microsoft │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Click "Login"   │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │      2. Redirect to Microsoft            │
     │<───────────────────┤                     │
     │                                          │
     │ 3. User login      │                     │
     ├─────────────────────────────────────────>│
     │                                          │
     │ 4. Auth code       │                     │
     │<─────────────────────────────────────────┤
     │                                          │
     │ 5. Send code       │                     │
     ├───────────────────>│                     │
     │                    │ 6. Exchange token   │
     │                    ├────────────────────>│
     │                    │                     │
     │                    │ 7. Access token     │
     │                    │<────────────────────┤
     │                    │                     │
     │                    │ 8. Get user info    │
     │                    ├────────────────────>│
     │                    │                     │
     │ 9. JWT + User data │                     │
     │<───────────────────┤                     │
     │                                          │
     │ 10. Navigate to dashboard               │
     │                                          │
```

---

## 🔧 Tecnologias

### Backend
- **FastAPI** - Framework web
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **python-jose** - JWT tokens
- **requests** - HTTP client
- **Microsoft Graph API** - Validação de usuários

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Navegação
- **Tailwind CSS** - Estilos

### Autenticação
- **OAuth 2.0** - Authorization Code Flow
- **JWT** - Token de autenticação
- **Azure AD** - Identity provider

---

## 📁 Estrutura do Projeto

```
Iniciacao-main/
├── backend/
│   ├── routes/
│   │   └── auth.py          # Endpoints OAuth
│   ├── models/
│   │   └── database_models.py
│   ├── microsoft_auth.py     # Cliente OAuth Microsoft
│   ├── main.py              # FastAPI app
│   ├── .env.example         # Template de config
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── AuthCallback.jsx  # Processa OAuth
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # State de autenticação
│   │   └── App.jsx
│   └── package.json
│
└── docs/                    # ← Você está aqui
    ├── README.md            # Este arquivo
    ├── AZURE_SETUP.md       # Setup Azure AD
    ├── OAUTH_IMPLEMENTATION.md
    ├── TESTING_GUIDE.md
    └── CHANGELOG_OAUTH.md
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env)
```bash
# Microsoft Azure AD
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/auth/callback
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# Database
DATABASE_URL=sqlite:///./iniciacao_cientifica.db
```

---

## 🐛 Troubleshooting

### Erro Comum 1: "State inválido"
```
Causa: State OAuth expirado
Solução: Faça novo login
```

### Erro Comum 2: "Email não encontrado"
```
Causa: Email não é @ibmec.edu.br
Solução: Use email institucional
```

### Erro Comum 3: "Token inválido"
```
Causa: JWT expirado ou inválido
Solução: Faça logout e login novamente
```

**Mais detalhes**: [TESTING_GUIDE.md](./TESTING_GUIDE.md#troubleshooting)

---

## 📊 Status do Projeto

| Componente | Status | Versão |
|------------|--------|--------|
| Backend API | ✅ Funcionando | 1.0.0 |
| Frontend | ✅ Funcionando | 1.0.0 |
| OAuth 2.0 | ✅ Implementado | 1.0.0 |
| JWT Tokens | ✅ Implementado | 1.0.0 |
| Documentação | ✅ Completa | 1.0.0 |

---

## 🤝 Contribuindo

### Fluxo de Desenvolvimento
1. Leia a documentação relevante
2. Faça alterações
3. Teste localmente
4. Atualize documentação se necessário
5. Commit e push

### Atualizando Documentação
```bash
# Ao modificar autenticação
docs/OAUTH_IMPLEMENTATION.md

# Ao adicionar testes
docs/TESTING_GUIDE.md

# Mudanças significativas
docs/CHANGELOG_OAUTH.md
```

---

## 📞 Suporte

### Problemas de Autenticação
1. Verifique logs do backend
2. Consulte [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. Verifique credenciais em `.env`

### Problemas de Configuração Azure
1. Consulte [AZURE_SETUP.md](./AZURE_SETUP.md)
2. Verifique permissões no Azure Portal
3. Confirme redirect URIs

---

## 📝 Changelog

### v1.0.0 (Janeiro 2025)
- ✅ Implementação OAuth 2.0
- ✅ JWT tokens
- ✅ Integração Microsoft Graph API
- ✅ Documentação completa
- ✅ Guias de setup e teste

---

## 🎯 Roadmap

### v1.1.0
- [ ] Refresh tokens
- [ ] Logout da Microsoft
- [ ] Rate limiting

### v2.0.0
- [ ] Migração PostgreSQL
- [ ] Deploy Azure
- [ ] CI/CD pipeline

---

## 📚 Recursos Externos

### Microsoft
- [Azure AD Documentation](https://learn.microsoft.com/en-us/azure/active-directory/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)
- [OAuth 2.0](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

### Tecnologias
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [JWT](https://jwt.io/)

---

**Última atualização**: Janeiro 2025  
**Mantido por**: Equipe PICT Ibmec
