# 🔧 Script para Configurar Variáveis de Ambiente no Azure App Service

$RESOURCE_GROUP = "PICTIBMEC"
$APP_NAME = "Pictback"

Write-Host "🔐 Configurando Variáveis de Ambiente no Azure App Service" -ForegroundColor Cyan
Write-Host "   Resource Group: $RESOURCE_GROUP" -ForegroundColor Gray
Write-Host "   App Name: $APP_NAME" -ForegroundColor Gray
Write-Host ""

# Verificar login no Azure
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "✓ Logado como: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Não está logado no Azure CLI" -ForegroundColor Red
    Write-Host "Execute: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n⚠️  IMPORTANTE: Você precisa ter estas informações:" -ForegroundColor Yellow
Write-Host "  • Microsoft Tenant ID (Azure AD)" -ForegroundColor Gray
Write-Host "  • Microsoft Client ID (Azure AD)" -ForegroundColor Gray
Write-Host "  • Microsoft Client Secret (Azure AD)" -ForegroundColor Gray
Write-Host "  • JWT Secret Key (gere uma chave forte)" -ForegroundColor Gray
Write-Host ""

Write-Host "Deseja continuar? (S/N)" -ForegroundColor Cyan
$continuar = Read-Host

if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host "Cancelado." -ForegroundColor Yellow
    exit 0
}

# Configurar variáveis de ambiente
Write-Host "`n📝 Configurando variáveis de ambiente..." -ForegroundColor Yellow

$settings = @(
    # Environment
    "ENVIRONMENT=production"
    
    # URLs (PRODUÇÃO)
    "FRONTEND_URL=https://icy-sea-0c53d910f.3.azurestaticapps.net"
    "AZURE_STATIC_WEB_APP_URL=https://icy-sea-0c53d910f.3.azurestaticapps.net"
    "BACKEND_URL=https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net"
    
    # Python
    "PYTHONUNBUFFERED=1"
    "SCM_DO_BUILD_DURING_DEPLOYMENT=true"
    
    # Upload
    "UPLOAD_DIR=/home/site/wwwroot/uploads"
)

Write-Host "`nConfigurando URLs de produção..." -ForegroundColor Gray
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings $settings

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ URLs configuradas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao configurar URLs" -ForegroundColor Red
    exit 1
}

# Agora configurar secrets (interativo)
Write-Host "`n🔐 Agora vamos configurar os SECRETS..." -ForegroundColor Cyan
Write-Host "⚠️  ATENÇÃO: Estas informações são sensíveis!" -ForegroundColor Yellow
Write-Host ""

# Microsoft OAuth
Write-Host "📋 Microsoft OAuth Configuration:" -ForegroundColor Cyan
Write-Host "Cole o Microsoft Tenant ID:" -ForegroundColor White
$tenantId = Read-Host
Write-Host "Cole o Microsoft Client ID:" -ForegroundColor White
$clientId = Read-Host
Write-Host "Cole o Microsoft Client Secret:" -ForegroundColor White
$clientSecret = Read-Host

# JWT Secret
Write-Host "`n🔑 JWT Secret Key:" -ForegroundColor Cyan
Write-Host "Cole uma chave JWT forte (ou deixe em branco para gerar automaticamente):" -ForegroundColor White
$jwtSecret = Read-Host

if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    Write-Host "Gerando chave JWT aleatória..." -ForegroundColor Gray
    # Gerar chave aleatória de 32 bytes em base64
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    Write-Host "✓ Chave gerada: $($jwtSecret.Substring(0, 20))..." -ForegroundColor Green
}

# Database (opcional)
Write-Host "`n🗄️  Database Configuration:" -ForegroundColor Cyan
Write-Host "Deseja configurar PostgreSQL no Azure? (S/N)" -ForegroundColor White
Write-Host "(Se não, usará SQLite)" -ForegroundColor Gray
$usePostgres = Read-Host

$databaseUrl = ""
if ($usePostgres -eq "S" -or $usePostgres -eq "s") {
    Write-Host "Cole a DATABASE_URL (PostgreSQL connection string):" -ForegroundColor White
    $databaseUrl = Read-Host
}

# Configurar secrets
Write-Host "`n📤 Enviando secrets para o Azure..." -ForegroundColor Yellow

$secretSettings = @(
    "MICROSOFT_TENANT_ID=$tenantId"
    "MICROSOFT_CLIENT_ID=$clientId"
    "MICROSOFT_CLIENT_SECRET=$clientSecret"
    "MICROSOFT_REDIRECT_URI=https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/auth/callback"
    "JWT_SECRET_KEY=$jwtSecret"
    "SECRET_KEY=$jwtSecret"
)

if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
    $secretSettings += "DATABASE_URL=$databaseUrl"
}

az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP `
    --name $APP_NAME `
    --settings $secretSettings

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Todas as variáveis configuradas com sucesso!" -ForegroundColor Green
    
    Write-Host "`n📋 Configuração Aplicada:" -ForegroundColor Cyan
    Write-Host "  ✓ Environment: production" -ForegroundColor Gray
    Write-Host "  ✓ Frontend URL: https://icy-sea-0c53d910f.3.azurestaticapps.net" -ForegroundColor Gray
    Write-Host "  ✓ Backend URL: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net" -ForegroundColor Gray
    Write-Host "  ✓ Microsoft OAuth configurado" -ForegroundColor Gray
    Write-Host "  ✓ JWT Secret configurado" -ForegroundColor Gray
    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        Write-Host "  ✓ PostgreSQL configurado" -ForegroundColor Gray
    } else {
        Write-Host "  ✓ SQLite (padrão)" -ForegroundColor Gray
    }
    
    Write-Host "`n🔄 Reiniciando App Service..." -ForegroundColor Yellow
    az webapp restart --resource-group $RESOURCE_GROUP --name $APP_NAME
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ App Service reiniciado" -ForegroundColor Green
    }
    
    Write-Host "`n📝 Próximos Passos:" -ForegroundColor Cyan
    Write-Host "  1. Configure o Redirect URI no Azure AD:" -ForegroundColor White
    Write-Host "     https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/auth/callback" -ForegroundColor Gray
    Write-Host "  2. Teste a API:" -ForegroundColor White
    Write-Host "     https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/health" -ForegroundColor Gray
    Write-Host "  3. Faça o build e deploy do frontend" -ForegroundColor White
    
    Write-Host "`n✨ Backend configurado para PRODUÇÃO!" -ForegroundColor Green
    
} else {
    Write-Host "`n✗ Erro ao configurar secrets" -ForegroundColor Red
    Write-Host "Verifique as permissões e tente novamente" -ForegroundColor Yellow
}
