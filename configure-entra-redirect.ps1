# ====================================
# Configurar Redirect URI do Microsoft Entra ID
# ====================================
# Este script atualiza as variáveis de ambiente no Azure App Service
# para usar o frontend (Static Web App) como redirect URI

Write-Host "🔧 Configurando Redirect URI do Microsoft Entra ID..." -ForegroundColor Cyan

$backendAppName = "pictback-bzakbsfgc6bgcjcc"
$resourceGroup = "pict-ibmec-rg"
$frontendUrl = "https://icy-sea-0c53d910f.3.azurestaticapps.net"
$redirectUri = "$frontendUrl/auth/callback"

Write-Host ""
Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Backend App: $backendAppName"
Write-Host "   Resource Group: $resourceGroup"
Write-Host "   Frontend URL: $frontendUrl"
Write-Host "   Redirect URI: $redirectUri"
Write-Host ""

# Verificar se está logado no Azure
Write-Host "🔍 Verificando login no Azure..." -ForegroundColor Cyan
$account = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Você não está logado no Azure CLI." -ForegroundColor Red
    Write-Host "   Execute: az login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Login no Azure verificado" -ForegroundColor Green

# Atualizar variáveis de ambiente no App Service
Write-Host ""
Write-Host "🔄 Atualizando variáveis de ambiente no App Service..." -ForegroundColor Cyan

try {
    az webapp config appsettings set `
        --name $backendAppName `
        --resource-group $resourceGroup `
        --settings `
            "MICROSOFT_REDIRECT_URI=$redirectUri" `
            "FRONTEND_URL=$frontendUrl"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Variáveis de ambiente atualizadas com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro ao atualizar variáveis de ambiente"
    }
} catch {
    Write-Host "❌ Erro ao atualizar variáveis de ambiente: $_" -ForegroundColor Red
    exit 1
}

# Reiniciar o App Service para aplicar as mudanças
Write-Host ""
Write-Host "🔄 Reiniciando App Service para aplicar mudanças..." -ForegroundColor Cyan

try {
    az webapp restart `
        --name $backendAppName `
        --resource-group $resourceGroup
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ App Service reiniciado com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro ao reiniciar App Service"
    }
} catch {
    Write-Host "❌ Erro ao reiniciar App Service: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" -repeat 60 -ForegroundColor Cyan
Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=" -repeat 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS OBRIGATÓRIOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Configurar no Azure Portal (portal.azure.com):" -ForegroundColor White
Write-Host "   a) Vá para 'Microsoft Entra ID' → 'App registrations'" -ForegroundColor Gray
Write-Host "   b) Encontre seu app: Client ID 417a3338-b81b-4720-97d6-0d4e55a626fb" -ForegroundColor Gray
Write-Host "   c) Clique em 'Authentication'" -ForegroundColor Gray
Write-Host "   d) Adicione esta Redirect URI:" -ForegroundColor Gray
Write-Host "      $redirectUri" -ForegroundColor Cyan
Write-Host "   e) Tipo: Web (não SPA)" -ForegroundColor Gray
Write-Host "   f) Clique em 'Save'" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Testar o login:" -ForegroundColor White
Write-Host "   a) Acesse: $frontendUrl" -ForegroundColor Gray
Write-Host "   b) Clique em 'Entrar com Microsoft'" -ForegroundColor Gray
Write-Host "   c) Faça login com email @ibmec.edu.br" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Verificar se funcionou:" -ForegroundColor White
Write-Host "   - Se redirecionar corretamente e logar = ✅ Sucesso!" -ForegroundColor Gray
Write-Host "   - Se mostrar erro 'redirect_uri_mismatch' = ❌ URI não registrada no Azure" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 DICA: Para depurar problemas de OAuth:" -ForegroundColor Yellow
Write-Host "   - Abra DevTools (F12) → Console" -ForegroundColor Gray
Write-Host "   - Veja os logs do processo de autenticação" -ForegroundColor Gray
Write-Host "   - Erros comuns aparecem com mensagens claras" -ForegroundColor Gray
Write-Host ""
