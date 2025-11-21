# Configurar variaveis de ambiente no Azure App Service
Write-Host "[CONFIG] Configurando variaveis de ambiente no Azure App Service..." -ForegroundColor Cyan

$appName = "Pictback"
$resourceGroup = "PICTIBMEC"  # Ajuste se necessario

# Verificar se esta logado no Azure
Write-Host "[AUTH] Verificando autenticacao Azure..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json

if (-not $account) {
    Write-Host "[ERRO] Nao esta logado no Azure. Execute: az login" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Logado como: $($account.user.name)" -ForegroundColor Green
Write-Host ""

# Variaveis de ambiente necessarias
Write-Host "[CONFIG] Configurando variaveis de ambiente..." -ForegroundColor Yellow

# URLs
az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings `
        FRONTEND_URL="https://icy-sea-0c53d910f.3.azurestaticapps.net" `
        BACKEND_URL="https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net" `
        ENVIRONMENT="production"

Write-Host "[OK] URLs configuradas" -ForegroundColor Green

# Solicitar credenciais sensiveis
Write-Host ""
Write-Host "[ATENCAO] Agora configure as credenciais sensiveis:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Execute os seguintes comandos manualmente com seus valores reais:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Configurar JWT Secret" -ForegroundColor Gray
Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings JWT_SECRET_KEY=`"SUA-CHAVE-SECRETA-AQUI`"" -ForegroundColor White
Write-Host ""
Write-Host "# Configurar Microsoft OAuth (se usar)" -ForegroundColor Gray
Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings MICROSOFT_CLIENT_ID=`"SEU-CLIENT-ID`"" -ForegroundColor White
Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings MICROSOFT_CLIENT_SECRET=`"SEU-CLIENT-SECRET`"" -ForegroundColor White
Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings MICROSOFT_TENANT_ID=`"SEU-TENANT-ID`"" -ForegroundColor White
Write-Host ""
Write-Host "# Configurar Database URL (se usar PostgreSQL)" -ForegroundColor Gray
Write-Host "az webapp config appsettings set --name $appName --resource-group $resourceGroup --settings DATABASE_URL=`"postgresql://user:pass@host/db`"" -ForegroundColor White
Write-Host ""

Write-Host "[CONCLUIDO] Configuracao inicial completa!" -ForegroundColor Green
Write-Host "[AVISO] Nao esqueca de configurar as credenciais sensiveis acima!" -ForegroundColor Yellow
