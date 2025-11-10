# 🚀 Comandos Rápidos - Deploy Azure

## Teste Local

```powershell
# Testar frontend localmente
cd frontend
npm run dev

# Abrir em: http://localhost:3000
```

## Build e Verificação

```powershell
# Build de produção
cd frontend
npm run build

# Verificar se a pasta build/ foi criada
ls build/
```

## Deploy para Azure

```powershell
# Fazer commit das alterações
git add .
git commit -m "feat: configurar rotas para Azure"

# Push para branch main (dispara deploy automático)
git push origin main
```

## Verificar Status do Deploy

1. Acesse: https://portal.azure.com
2. Procure por "Static Web Apps"
3. Clique em "PICTIBMEC" ou seu recurso
4. Vá em "GitHub Actions" para ver o log do deploy

## Testar a Aplicação

```powershell
# Abrir no navegador
start https://icy-sea-0c53d910f.3.azurestaticapps.net
```

## Verificar Logs (Se houver problemas)

```powershell
# Ver logs do último commit
git log -1

# Ver status do git
git status

# Ver diferenças
git diff
```

## Comandos Úteis de Depuração

```powershell
# Limpar cache do npm
cd frontend
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install

# Verificar variáveis de ambiente
cat .env.production
cat .env.development

# Testar chamada à API
curl https://icy-sea-0c53d910f.3.azurestaticapps.net/api/health
```

## Configuração Rápida no Azure Portal

### 1. Adicionar Variável de Ambiente

```
Configuration > Application settings > Add

Nome: VITE_API_URL
Valor: https://icy-sea-0c53d910f.3.azurestaticapps.net/api
```

### 2. Verificar Build

```
GitHub Actions > Ver último run
```

### 3. Ver Logs

```
Log Stream (se disponível)
```

## URL Importantes

- **Aplicação**: https://icy-sea-0c53d910f.3.azurestaticapps.net
- **Portal Azure**: https://portal.azure.com
- **Documentação**: https://learn.microsoft.com/azure/static-web-apps/

## Problemas Comuns e Soluções

### 1. Build falha no Azure

```powershell
# Verificar package.json
cd frontend
cat package.json | Select-String "scripts"

# Deve ter:
# "build": "vite build"
```

### 2. 404 em rotas

```powershell
# Verificar se staticwebapp.config.json existe
ls frontend/staticwebapp.config.json
```

### 3. CORS Error

```powershell
# Verificar backend CORS
cd backend
cat main.py | Select-String "allow_origins"
```

### 4. Variáveis de ambiente não funcionam

```powershell
# Rebuild completo
cd frontend
rm -r build/
npm run build

# Verificar se .env.production existe
ls .env.production
```

## Rollback (Se necessário)

```powershell
# Voltar para commit anterior
git log --oneline -5
git revert HEAD
git push origin main
```

## Monitoramento

```powershell
# Verificar site está online
curl -I https://icy-sea-0c53d910f.3.azurestaticapps.net

# Verificar API
curl https://icy-sea-0c53d910f.3.azurestaticapps.net/api/health
```
