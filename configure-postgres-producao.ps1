# Script para configurar PostgreSQL no Azure App Service
# Atualiza as variáveis de ambiente do backend em produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando PostgreSQL no App Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$RESOURCE_GROUP = "PICTIBMEC"
$APP_SERVICE_NAME = "pictback-bzakbsfqc6bgqjcc"
$FRONTEND_URL = "https://icy-sea-0c53d910f.3.azurestaticapps.net"
$DATABASE_URL = "postgresql://pictadmin:6RnELl_HP3deSC461PHP_A@pict-ibmec-postgres.postgres.database.azure.com/iniciacao_cientifica?sslmode=require"

Write-Host "1. Configurando DATABASE_URL..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_SERVICE_NAME `
    --settings "DATABASE_URL=$DATABASE_URL" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ DATABASE_URL configurada!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao configurar DATABASE_URL" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Configurando FRONTEND_URL..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_SERVICE_NAME `
    --settings "FRONTEND_URL=$FRONTEND_URL" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ FRONTEND_URL configurada!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao configurar FRONTEND_URL" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Removendo AZURE_DATABASE_URL (antiga)..." -ForegroundColor Yellow
az webapp config appsettings delete `
    --resource-group $RESOURCE_GROUP `
    --name $APP_SERVICE_NAME `
    --setting-names "AZURE_DATABASE_URL" `
    --output none 2>$null

Write-Host "   ✓ Variável antiga removida (se existia)" -ForegroundColor Green

Write-Host ""
Write-Host "4. Reiniciando App Service..." -ForegroundColor Yellow
az webapp restart `
    --resource-group $RESOURCE_GROUP `
    --name $APP_SERVICE_NAME `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ App Service reiniciado!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erro ao reiniciar App Service" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuração concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs configuradas:" -ForegroundColor Cyan
Write-Host "Backend: https://$APP_SERVICE_NAME.brazilsouth-01.azurewebsites.net" -ForegroundColor White
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host "Banco: pict-ibmec-postgres.postgres.database.azure.com" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Aguarde 30-60 segundos para o App Service reiniciar" -ForegroundColor White
Write-Host "2. Teste a API: https://$APP_SERVICE_NAME.brazilsouth-01.azurewebsites.net/docs" -ForegroundColor White
Write-Host "3. Teste o frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs em tempo real:" -ForegroundColor Cyan
Write-Host "az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME" -ForegroundColor Yellow
