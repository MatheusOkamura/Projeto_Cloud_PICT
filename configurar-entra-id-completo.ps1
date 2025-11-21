# ====================================
# Script: Configurar Microsoft Entra ID Completo
# ====================================
# Este script configura TODAS as variáveis necessárias para Microsoft Entra ID
# funcionar perfeitamente no Azure App Service
# ====================================

$appName = "pictback-bzakbsfgc6bgcjcc"
$resourceGroup = "pict-ibmec-rg"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando Microsoft Entra ID no Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ====================================
# 1. Variáveis de URL
# ====================================
Write-Host "📍 1. Configurando URLs..." -ForegroundColor Yellow

$settings = @(
    "FRONTEND_URL=https://icy-sea-0c53d910f.3.azurestaticapps.net"
    "AZURE_STATIC_WEB_APP_URL=https://icy-sea-0c53d910f.3.azurestaticapps.net"
    "BACKEND_URL=https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net"
)

az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings $settings `
    --output none

Write-Host "   ✅ URLs configuradas" -ForegroundColor Green

# ====================================
# 2. Microsoft Entra ID (OAuth)
# ====================================
Write-Host ""
Write-Host "🔐 2. Configurando Microsoft Entra ID OAuth..." -ForegroundColor Yellow

$microsoftSettings = @(
    "MICROSOFT_TENANT_ID=organizations"
    "MICROSOFT_CLIENT_ID=d17a3338-b81b-4720-97d6-0d4e55a626fb"
    "MICROSOFT_REDIRECT_URI=https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/auth/callback"
)

az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings $microsoftSettings `
    --output none

Write-Host "   ✅ Microsoft Entra ID configurado" -ForegroundColor Green

# ====================================
# 3. Microsoft Client Secret (Sensível)
# ====================================
Write-Host ""
Write-Host "🔑 3. Configurando Client Secret..." -ForegroundColor Yellow
Write-Host "   ⚠️  ATENÇÃO: Secret sensível!" -ForegroundColor Magenta

$clientSecret = Read-Host "Cole o MICROSOFT_CLIENT_SECRET" -AsSecureString
$clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)

az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings "MICROSOFT_CLIENT_SECRET=$clientSecretPlain" `
    --output none

Write-Host "   ✅ Client Secret configurado (não exibido)" -ForegroundColor Green

# ====================================
# 4. JWT Configuration
# ====================================
Write-Host ""
Write-Host "🔐 4. Configurando JWT..." -ForegroundColor Yellow

$jwtSecret = Read-Host "Cole o JWT_SECRET_KEY (ou Enter para manter existente)" -AsSecureString
if ($jwtSecret.Length -gt 0) {
    $jwtSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($jwtSecret)
    )
    
    $jwtSettings = @(
        "SECRET_KEY=$jwtSecretPlain"
        "JWT_SECRET_KEY=$jwtSecretPlain"
        "ALGORITHM=HS256"
        "ACCESS_TOKEN_EXPIRE_MINUTES=1440"
    )
    
    az webapp config appsettings set `
        --name $appName `
        --resource-group $resourceGroup `
        --settings $jwtSettings `
        --output none
    
    Write-Host "   ✅ JWT configurado" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  JWT mantido (não alterado)" -ForegroundColor Gray
}

# ====================================
# 5. Database Configuration
# ====================================
Write-Host ""
Write-Host "🗄️  5. Configurando Database..." -ForegroundColor Yellow

$dbUrl = Read-Host "Cole o DATABASE_URL (ou Enter para manter existente)" -AsSecureString
if ($dbUrl.Length -gt 0) {
    $dbUrlPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbUrl)
    )
    
    az webapp config appsettings set `
        --name $appName `
        --resource-group $resourceGroup `
        --settings "DATABASE_URL=$dbUrlPlain" `
        --output none
    
    Write-Host "   ✅ Database URL configurada" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Database URL mantida (não alterada)" -ForegroundColor Gray
}

# ====================================
# 6. Ambiente e Upload
# ====================================
Write-Host ""
Write-Host "⚙️  6. Configurando ambiente..." -ForegroundColor Yellow

$envSettings = @(
    "ENVIRONMENT=production"
    "MAX_FILE_SIZE=5242880"
    "UPLOAD_DIR=uploads"
)

az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings $envSettings `
    --output none

Write-Host "   ✅ Ambiente configurado" -ForegroundColor Green

# ====================================
# 7. Restart App Service
# ====================================
Write-Host ""
Write-Host "🔄 7. Reiniciando Azure App Service..." -ForegroundColor Yellow

az webapp restart --name $appName --resource-group $resourceGroup --output none

Write-Host "   ✅ App reiniciado" -ForegroundColor Green

# ====================================
# Resumo Final
# ====================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Variáveis configuradas:" -ForegroundColor White
Write-Host "   • FRONTEND_URL" -ForegroundColor Gray
Write-Host "   • AZURE_STATIC_WEB_APP_URL" -ForegroundColor Gray
Write-Host "   • BACKEND_URL" -ForegroundColor Gray
Write-Host "   • MICROSOFT_TENANT_ID" -ForegroundColor Gray
Write-Host "   • MICROSOFT_CLIENT_ID" -ForegroundColor Gray
Write-Host "   • MICROSOFT_CLIENT_SECRET ⚠️" -ForegroundColor Gray
Write-Host "   • MICROSOFT_REDIRECT_URI" -ForegroundColor Gray
Write-Host "   • JWT_SECRET_KEY ⚠️" -ForegroundColor Gray
Write-Host "   • DATABASE_URL ⚠️" -ForegroundColor Gray
Write-Host "   • ENVIRONMENT=production" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 URLs importantes:" -ForegroundColor White
Write-Host "   Frontend: https://icy-sea-0c53d910f.3.azurestaticapps.net" -ForegroundColor Cyan
Write-Host "   Backend: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net" -ForegroundColor Cyan
Write-Host "   Login: https://icy-sea-0c53d910f.3.azurestaticapps.net/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Microsoft Entra ID OAuth configurado e pronto!" -ForegroundColor Green
Write-Host ""
