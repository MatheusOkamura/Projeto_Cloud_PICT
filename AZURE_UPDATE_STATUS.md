# ✅ Atualização das Rotas para Azure - Resumo

## 📊 Status das Alterações

### ✅ Concluído

#### Frontend
1. **Configuração Centralizada da API**
   - ✅ Criado `src/config/api.js` com URL dinâmica baseada em variáveis de ambiente
   - ✅ Criado `.env.production` com URL do Azure
   - ✅ Criado `.env.development` para desenvolvimento local

2. **Arquivos Atualizados**
   - ✅ `src/context/AuthContext.jsx` - Todas as chamadas OAuth e API
   - ✅ `src/pages/SubmeterProposta.jsx` - Submissão de propostas
   - ✅ `vite.config.js` - Proxy configurado com variável de ambiente

3. **Utilitários**
   - ✅ Criado `src/utils/api.js` - Helper para chamadas API com autenticação automática
   - ✅ Criado `update-urls.ps1` - Script PowerShell para automatizar atualizações
   - ✅ Criado `staticwebapp.config.json` - Configuração do Azure Static Web Apps

#### Backend
1. **CORS Atualizado**
   - ✅ `main.py` - Adicionado domínio do Azure nas origens permitidas
   ```python
   "https://icy-sea-0c53d910f.3.azurestaticapps.net"
   "https://*.azurestaticapps.net"
   ```

### ⚠️ Pendente (Requer Ação Manual)

#### Frontend - Arquivos para Atualizar
Os seguintes arquivos ainda têm URLs hardcoded e precisam ser atualizados:

1. `src/pages/DashboardOrientador.jsx`
2. `src/pages/DashboardAluno.jsx`
3. `src/pages/DashboardCoordenador.jsx`
4. `src/pages/EnviarRelatorioParcial.jsx`
5. `src/pages/EnviarArtigoFinal.jsx`
6. `src/pages/EnviarApresentacaoAmostra.jsx`
7. `src/pages/CompletarCadastro.jsx`
8. `src/pages/AuthCallback.jsx`

## 🚀 Como Completar a Atualização

### Opção 1: Script Automático (Recomendado)

```powershell
cd frontend
.\update-urls.ps1
```

Este script irá:
- Adicionar o import `API_BASE_URL` em todos os arquivos
- Substituir `http://localhost:8000/api` por `${API_BASE_URL}`
- Corrigir template strings

### Opção 2: Manual

Para cada arquivo listado acima:

**1. Adicione o import no topo:**
```javascript
import API_BASE_URL from '../config/api';
```

**2. Substitua todas as ocorrências:**

❌ **Antes:**
```javascript
const response = await fetch('http://localhost:8000/api/usuarios/123');
```

✅ **Depois:**
```javascript
const response = await fetch(`${API_BASE_URL}/usuarios/123`);
```

## 🔧 Configuração no Azure

### 1. Variáveis de Ambiente
No Portal do Azure > Static Web Apps > Configuration:

| Nome | Valor |
|------|-------|
| `VITE_API_URL` | `https://icy-sea-0c53d910f.3.azurestaticapps.net/api` |

### 2. OAuth Redirect URLs
No Azure AD (Entra ID), adicione:
- `https://icy-sea-0c53d910f.3.azurestaticapps.net/auth/callback`
- `https://icy-sea-0c53d910f.3.azurestaticapps.net/completar-cadastro`

## 📝 Testes Necessários

Após completar as atualizações:

```powershell
# 1. Testar build local
cd frontend
npm run build

# 2. Testar localmente
npm run dev

# 3. Verificar console do browser
# - Nenhum erro 404
# - Nenhum erro CORS
# - Chamadas API funcionando

# 4. Deploy para Azure
git add .
git commit -m "feat: atualizar URLs para Azure"
git push
```

## ✅ Checklist Final

- [ ] Executar script `update-urls.ps1` OU atualizar manualmente
- [ ] Revisar alterações nos arquivos
- [ ] Testar build (`npm run build`)
- [ ] Configurar variáveis de ambiente no Azure
- [ ] Atualizar URLs OAuth no Azure AD
- [ ] Fazer commit e push
- [ ] Testar aplicação no Azure
- [ ] Verificar logs no Azure Portal

## 📚 Documentação Adicional

- `docs/AZURE_URL_UPDATE.md` - Guia detalhado completo
- `src/config/api.js` - Configuração centralizada
- `src/utils/api.js` - Utilitários de API

## 🆘 Suporte

Se encontrar problemas:

1. **CORS Error**: Verifique `backend/main.py` - allow_origins
2. **404 em rotas**: Verifique `staticwebapp.config.json`
3. **API não responde**: Verifique variável `VITE_API_URL`
4. **OAuth falha**: Verifique redirect URLs no Azure AD

---

**URL do Aplicativo:** https://icy-sea-0c53d910f.3.azurestaticapps.net
