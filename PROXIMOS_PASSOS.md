# ✅ PRÓXIMOS PASSOS - Deploy Backend

## 🎯 Resumo da Situação

- ✅ Backend configurado e pronto para deploy
- ✅ Frontend já configurado para apontar para o backend no Azure
- ✅ Arquivos de configuração criados
- ⏳ Falta apenas fazer o deploy do backend

## 🔑 O que seu colega precisa fazer

Existem **3 opções**. Escolha a mais fácil para vocês:

---

## 📋 OPÇÃO 1: Publish Profile (Mais Simples - RECOMENDADO)

### Seu colega deve:

1. **Acessar o Azure Portal:** https://portal.azure.com
2. **Ir em:** App Services → Pictback
3. **Clicar em:** "Baixar o perfil de publicação" (ou "Download publish profile")
4. **Enviar para você:** O arquivo `Pictback.PublishSettings` (ou copiar o conteúdo)

### Você deve:

1. **Adicionar o secret no GitHub:**
   - Ir em: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions
   - Clicar em "New repository secret"
   - Nome: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Valor: Colar TODO o conteúdo do arquivo XML
   - Salvar

2. **Fazer o commit e push:**
   ```powershell
   git add .
   git commit -m "feat: configurar deploy automático do backend no Azure"
   git push origin main
   ```

3. **Acompanhar o deploy:**
   - Ir em: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions
   - Ver o workflow "Deploy Backend to Azure App Service" rodando
   - Aguardar a conclusão (2-3 minutos)

---

## 📦 OPÇÃO 2: Deploy Manual via Portal (Sem CLI)

### Seu colega deve:

1. **Comprimir a pasta backend:**
   - Selecionar todos os arquivos dentro de `backend/`
   - Clicar com botão direito → Enviar para → Pasta compactada
   - Nomear como `backend.zip`

2. **Fazer o upload no Azure:**
   - Azure Portal → Pictback → Centro de Implantação
   - Escolher "ZIP Deploy"
   - Fazer upload do `backend.zip`
   - Aguardar a conclusão

3. **Configurar o comando de inicialização:**
   - Azure Portal → Pictback → Configuração → Configurações gerais
   - Em "Comando de inicialização", adicionar:
     ```
     gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
     ```
   - Salvar e reiniciar o app

---

## 💻 OPÇÃO 3: Deploy via Script (Se ele tiver Azure CLI)

### Seu colega deve:

1. **Fazer login no Azure CLI:**
   ```powershell
   az login
   ```

2. **Executar o script:**
   ```powershell
   cd "c:\Users\yamam\OneDrive\Área de Trabalho\6° Semestre\Projeto\Iniciacao-main"
   .\deploy-backend-azure.ps1
   ```

---

## ✅ Verificar se funcionou

Após qualquer das opções acima, testar:

### 1. Testar API no navegador:
- https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/
- https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/docs
- https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/api/health

### 2. Testar o login no frontend:
- https://icy-sea-0c53d910f.3.azurestaticapps.net/
- Tentar fazer login
- Se funcionar = SUCESSO! 🎉

---

## 🐛 Se der erro

### Ver logs do backend:
- Azure Portal → Pictback → Fluxo de log

### Reiniciar o app:
- Azure Portal → Pictback → Reiniciar

### Verificar configurações:
- Azure Portal → Pictback → Configuração
- Verificar se o "Comando de inicialização" está correto
- Verificar se as variáveis de ambiente estão configuradas

---

## 📞 Contato

Se precisar de ajuda, compartilhe:
- Mensagem de erro
- Screenshot do erro
- Logs do Azure (se disponível)
