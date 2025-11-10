# 🚀 Guia de Deploy do Backend

## Informações do App
- **Nome:** Pictback
- **URL:** https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net
- **Resource Group:** pictibmec
- **Runtime:** Python 3.11

## ⚙️ Configurações Necessárias no Azure

### 1. Configuração Geral
No Azure Portal → Pictback → **Configuração** → **Configurações gerais**:
- **Stack:** Python
- **Versão:** 3.11
- **Comando de inicialização:** 
  ```
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
  ```

### 2. Variáveis de Ambiente
No Azure Portal → Pictback → **Configuração** → **Configurações de aplicativo**:

Adicionar as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `SECRET_KEY` | `sua-chave-secreta-super-segura-mude-em-producao` |
| `DATABASE_URL` | `sqlite:///./iniciacao_cientifica.db` |
| `PYTHONUNBUFFERED` | `1` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |

### 3. HTTPS Only
No Azure Portal → Pictback → **Configuração** → **Configurações gerais**:
- Marcar **"Somente HTTPS"**

## 📦 Opções de Deploy

### Opção 1: GitHub Actions (Recomendado)

1. **Baixar o Publish Profile:**
   - Azure Portal → Pictback → **Visão geral**
   - Clicar em **"Baixar o perfil de publicação"**
   - Salvar o arquivo `Pictback.PublishSettings`

2. **Adicionar Secret no GitHub:**
   - Ir em: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions
   - Clicar em **"New repository secret"**
   - Nome: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Valor: Colar todo o conteúdo do arquivo XML
   - Salvar

3. **Fazer Push:**
   ```powershell
   git add .
   git commit -m "feat: deploy backend no Azure"
   git push origin main
   ```

### Opção 2: Deploy Manual via ZIP

1. **Criar ZIP da pasta backend**
2. **Azure Portal → Pictback → Centro de Implantação**
3. **Escolher "ZIP Deploy"**
4. **Fazer upload do arquivo ZIP**

### Opção 3: Deploy via Portal (Integração GitHub)

1. **Azure Portal → Pictback → Centro de Implantação**
2. **Conectar com GitHub**
3. **Selecionar:**
   - Repositório: `MatheusOkamura/Projeto_Cloud_PICT`
   - Branch: `main`
   - Pasta: `backend`
4. **Salvar**

## ✅ Verificar Deploy

Após o deploy, testar:

```powershell
# Testar endpoint raiz
curl https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/

# Testar health check
curl https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/api/health

# Testar docs
# Abrir no navegador: https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/docs
```

## 🔧 Troubleshooting

### Ver logs do App Service:
```powershell
# No portal: Pictback → Fluxo de log
# Ou via CLI (se tiver acesso):
az webapp log tail --resource-group pictibmec --name Pictback
```

### Reiniciar o App:
```powershell
# No portal: Pictback → Reiniciar
# Ou via CLI:
az webapp restart --resource-group pictibmec --name Pictback
```

## 📝 Arquivos Importantes

- `requirements.txt` - Dependências Python
- `startup.txt` - Comando de inicialização
- `.deployment` - Configuração de build
- `runtime.txt` - Versão do Python
- `main.py` - Aplicação FastAPI

## 🌐 Frontend

Após o deploy do backend, o frontend já está configurado para usar:
- **Produção:** `https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net`
- Configurado em: `frontend/.env.production`
