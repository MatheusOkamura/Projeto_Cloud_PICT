# Script de Deploy do Backend no Azure App Service
# Execute este script se você tiver acesso ao Azure CLI na conta onde o app está hospedado

# Variáveis
$RESOURCE_GROUP = "pictibmec"
$APP_NAME = "Pictback"
$LOCATION = "brazilsouth"

Write-Host "🚀 Iniciando configuração do Pictback no Azure..." -ForegroundColor Cyan

# 1. Configurar o comando de inicialização
Write-Host "`n📝 Configurando comando de inicialização..." -ForegroundColor Yellow
az webapp config set `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000"

# 2. Configurar variáveis de ambiente
Write-Host "`n🔧 Configurando variáveis de ambiente..." -ForegroundColor Yellow
az webapp config appsettings set `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --settings `
    SECRET_KEY="sua-chave-secreta-super-segura-mude-em-producao-$(Get-Random)" `
    DATABASE_URL="sqlite:///./iniciacao_cientifica.db" `
    PYTHONUNBUFFERED=1 `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# 3. Habilitar HTTPS only
Write-Host "`n🔒 Habilitando HTTPS only..." -ForegroundColor Yellow
az webapp update `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --https-only true

# 4. Fazer o deploy
Write-Host "`n📦 Fazendo deploy do código..." -ForegroundColor Yellow
Write-Host "Navegando para a pasta backend..." -ForegroundColor Gray
$BACKEND_PATH = Split-Path -Parent $PSScriptRoot | Join-Path -ChildPath "backend"
Set-Location $BACKEND_PATH

Write-Host "Criando arquivo ZIP..." -ForegroundColor Gray
$ZIP_PATH = Join-Path (Split-Path -Parent $BACKEND_PATH) "backend-deploy.zip"
if (Test-Path $ZIP_PATH) {
    Remove-Item $ZIP_PATH -Force
}

# Criar ZIP excluindo arquivos desnecessários
$exclude = @("__pycache__", "*.pyc", "*.db", ".env", "venv", "uploads")
Compress-Archive -Path "$BACKEND_PATH\*" -DestinationPath $ZIP_PATH -Force

Write-Host "Fazendo deploy para o Azure..." -ForegroundColor Gray
az webapp deployment source config-zip `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --src $ZIP_PATH

# 5. Reiniciar o app
Write-Host "`n🔄 Reiniciando aplicação..." -ForegroundColor Yellow
az webapp restart `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME

# 6. Testar
Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
Write-Host "`n🌐 Testando a API..." -ForegroundColor Cyan
$API_URL = "https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net"

Start-Sleep -Seconds 10

Write-Host "`nTestando endpoint raiz..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_URL/" -Method Get
    Write-Host "✓ Endpoint raiz OK" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no endpoint raiz" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nTestando health check..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get
    Write-Host "✓ Health check OK" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no health check" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n📊 URLs importantes:" -ForegroundColor Cyan
Write-Host "  API: $API_URL" -ForegroundColor White
Write-Host "  Docs: $API_URL/docs" -ForegroundColor White
Write-Host "  Health: $API_URL/api/health" -ForegroundColor White

Write-Host "`n📝 Para ver os logs:" -ForegroundColor Cyan
Write-Host "  az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME" -ForegroundColor White

Write-Host "`n✨ Deploy finalizado com sucesso!" -ForegroundColor Green
