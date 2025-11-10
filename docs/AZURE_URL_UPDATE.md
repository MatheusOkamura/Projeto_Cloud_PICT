# Guia de Atualização para Azure

Este documento descreve as alterações feitas para configurar o projeto para funcionar no Azure Static Web Apps.

## 🔧 Alterações Realizadas

### Frontend

#### 1. Configuração Centralizada da API (`src/config/api.js`)
Criado arquivo de configuração centralizada que usa variáveis de ambiente:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://icy-sea-0c53d910f.3.azurestaticapps.net/api';
```

#### 2. Arquivos de Ambiente

- **`.env.development`**: Para desenvolvimento local
  ```
  VITE_API_URL=http://localhost:8000/api
  ```

- **`.env.production`**: Para produção no Azure
  ```
  VITE_API_URL=https://icy-sea-0c53d910f.3.azurestaticapps.net/api
  ```

#### 3. Utilitário de API (`src/utils/api.js`)
Criado utilitário para simplificar chamadas à API com autenticação automática.

#### 4. Arquivos Atualizados

Os seguintes arquivos foram atualizados para usar a configuração centralizada:

- ✅ `src/context/AuthContext.jsx`
- ✅ `src/pages/SubmeterProposta.jsx`
- ⚠️ **Pendente**: Outros arquivos precisam ser atualizados manualmente

**Arquivos que ainda precisam de atualização:**
- `src/pages/DashboardOrientador.jsx`
- `src/pages/DashboardAluno.jsx`
- `src/pages/DashboardCoordenador.jsx`
- `src/pages/EnviarRelatorioParcial.jsx`
- `src/pages/EnviarArtigoFinal.jsx`
- `src/pages/EnviarApresentacaoAmostra.jsx`
- `src/pages/CompletarCadastro.jsx`
- `src/pages/AuthCallback.jsx`

### Backend

#### 1. CORS Atualizado (`main.py`)
Adicionado suporte para o domínio do Azure:

```python
allow_origins=[
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternativo
    "https://icy-sea-0c53d910f.3.azurestaticapps.net",  # Azure Static Web App
    "https://*.azurestaticapps.net",  # Outros ambientes do Azure
],
```

## 📋 Próximos Passos

### 1. Atualizar Arquivos Restantes do Frontend

Para cada arquivo na lista acima, siga este padrão:

**Antes:**
```javascript
const response = await fetch('http://localhost:8000/api/usuarios');
```

**Depois:**
```javascript
import API_BASE_URL from '../config/api';

const response = await fetch(`${API_BASE_URL}/usuarios`);
```

### 2. Configurar Variáveis de Ambiente no Azure

No portal do Azure Static Web Apps, configure:

1. Vá para **Configuration** > **Application settings**
2. Adicione a variável:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://icy-sea-0c53d910f.3.azurestaticapps.net/api`

### 3. Configurar Backend no Azure

Se o backend também estiver no Azure:

1. **Azure Functions ou App Service**: Configure a URL correta
2. **Variáveis de ambiente**: Adicione as configurações necessárias
3. **Banco de dados**: Configure a connection string

### 4. Atualizar OAuth Redirect URLs

No Azure AD (Microsoft Entra ID), adicione as URLs de callback:
- `https://icy-sea-0c53d910f.3.azurestaticapps.net/auth/callback`
- `https://icy-sea-0c53d910f.3.azurestaticapps.net/completar-cadastro`

### 5. Build e Deploy

```powershell
# Desenvolvimento local
cd frontend
npm run dev

# Build para produção
npm run build

# Deploy (se usando Azure Static Web Apps CLI)
swa deploy
```

## 🔍 Verificação

Após as alterações:

1. ✅ Verifique se o frontend carrega no Azure
2. ✅ Teste o login OAuth
3. ✅ Teste as chamadas à API
4. ✅ Verifique os logs de erro no console
5. ✅ Teste upload de arquivos

## 🚨 Problemas Comuns

### CORS Error
- Verifique se o domínio do Azure está nas `allow_origins` do backend
- Confirme que as credenciais estão configuradas corretamente

### 404 em Rotas do Frontend
- Verifique o arquivo `staticwebapp.config.json`
- Adicione regras de fallback para SPA

### API não responde
- Verifique se o backend está rodando
- Confirme a URL da API nas variáveis de ambiente
- Verifique os logs do Azure

## 📚 Recursos

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
