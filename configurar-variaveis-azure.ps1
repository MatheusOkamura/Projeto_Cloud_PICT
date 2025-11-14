# Script para Configurar Variáveis de Ambiente do Backend no Azure
# Execute este script para garantir que todas as variáveis necessárias estejam configuradas

$RESOURCE_GROUP = "PICTIBMEC"
$APP_NAME = "Pictback"

Write-Host "🔧 Configurando variáveis de ambiente do Backend..." -ForegroundColor Cyan
Write-Host ""

# 1. Variáveis de Build e Runtime
Write-Host "📦 Configurando variáveis de build..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings `
        PYTHONUNBUFFERED=1 `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        ENABLE_ORYX_BUILD=true `
        WEBSITES_PORT=8000 `
        WEBSITES_CONTAINER_START_TIME_LIMIT=600

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Variáveis de build configuradas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao configurar variáveis de build" -ForegroundColor Red
}
Write-Host ""

# 2. Verificar se DATABASE_URL existe
Write-Host "🗄️ Verificando DATABASE_URL..." -ForegroundColor Yellow
$settings = az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME | ConvertFrom-Json
$dbUrl = ($settings | Where-Object { $_.name -eq "DATABASE_URL" }).value

if ([string]::IsNullOrEmpty($dbUrl)) {
    Write-Host "⚠️  DATABASE_URL não configurado!" -ForegroundColor Yellow
    Write-Host "   Você precisa configurar manualmente com a string de conexão do PostgreSQL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Execute:" -ForegroundColor White
    Write-Host "   az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings DATABASE_URL='postgresql://usuario:senha@servidor.postgres.database.azure.com:5432/banco'" -ForegroundColor Gray
} else {
    Write-Host "✅ DATABASE_URL já configurado" -ForegroundColor Green
}
Write-Host ""

# 3. Configurar SECRET_KEY se não existir
Write-Host "🔐 Configurando SECRET_KEY..." -ForegroundColor Yellow
$secretKey = ($settings | Where-Object { $_.name -eq "SECRET_KEY" }).value

if ([string]::IsNullOrEmpty($secretKey)) {
    $newSecretKey = "$(New-Guid)-$(Get-Date -Format 'yyyyMMddHHmmss')-$(New-Guid)"
    
    az webapp config appsettings set `
        --resource-group $RESOURCE_GROUP `
        --name $APP_NAME `
        --settings SECRET_KEY="$newSecretKey"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SECRET_KEY gerado e configurado!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao configurar SECRET_KEY" -ForegroundColor Red
    }
} else {
    Write-Host "✅ SECRET_KEY já configurado" -ForegroundColor Green
}
Write-Host ""

# 4. Configurar comando de startup
Write-Host "🚀 Configurando comando de startup..." -ForegroundColor Yellow
az webapp config set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000 --timeout 600"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Comando de startup configurado!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao configurar comando de startup" -ForegroundColor Red
}
Write-Host ""

# 5. Habilitar logs
Write-Host "📊 Habilitando logs..." -ForegroundColor Yellow
az webapp log config `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --application-logging filesystem `
    --detailed-error-messages true `
    --failed-request-tracing true `
    --web-server-logging filesystem `
    --level information

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Logs habilitados!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aviso: Não foi possível habilitar logs" -ForegroundColor Yellow
}
Write-Host ""

# 6. Verificar configuração final
Write-Host "📋 Configuração atual:" -ForegroundColor Cyan
Write-Host ""

Write-Host "Variáveis de ambiente:" -ForegroundColor White
az webapp config appsettings list `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --query "[?name=='PYTHONUNBUFFERED' || name=='SCM_DO_BUILD_DURING_DEPLOYMENT' || name=='ENABLE_ORYX_BUILD' || name=='WEBSITES_PORT'].{name:name, value:value}" `
    --output table

Write-Host ""
Write-Host "Configuração do runtime:" -ForegroundColor White
az webapp config show `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --query "{Python:linuxFxVersion, StartupCommand:appCommandLine}" `
    --output table

Write-Host ""
Write-Host "✨ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Reiniciando aplicação..." -ForegroundColor Yellow
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Aplicação reiniciada!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Execute manualmente: az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Para ver os logs:" -ForegroundColor Cyan
Write-Host "az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor White
