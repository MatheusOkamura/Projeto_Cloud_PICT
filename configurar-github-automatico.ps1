# Script para configurar GitHub Actions usando credenciais existentes
# Execute este script para configurar o secret AZURE_CREDENTIALS automaticamente

$REPO = "MatheusOkamura/Projeto_Cloud_PICT"

Write-Host "🔧 Configurando GitHub Actions com credenciais existentes..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se gh está instalado
Write-Host "📋 Verificando GitHub CLI..." -ForegroundColor Yellow
$ghVersion = gh --version 2>$null
if ($null -eq $ghVersion) {
    Write-Host "❌ GitHub CLI (gh) não está instalado!" -ForegroundColor Red
    Write-Host "Instale em: https://cli.github.com/" -ForegroundColor White
    exit 1
}
Write-Host "✅ GitHub CLI instalado" -ForegroundColor Green
Write-Host ""

# 2. Verificar autenticação
Write-Host "🔐 Verificando autenticação no GitHub..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não está autenticado no GitHub!" -ForegroundColor Red
    Write-Host "Execute: gh auth login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Autenticado no GitHub" -ForegroundColor Green
Write-Host ""

# 3. Listar secrets existentes
Write-Host "📋 Verificando secrets existentes..." -ForegroundColor Yellow
$existingSecrets = gh secret list --repo $REPO 2>&1

if ($existingSecrets -match "AZURE_CREDENTIALS") {
    Write-Host "⚠️  Secret AZURE_CREDENTIALS já existe!" -ForegroundColor Yellow
    $resposta = Read-Host "Deseja sobrescrever? (s/N)"
    if ($resposta -ne "s" -and $resposta -ne "S") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}
Write-Host ""

# 4. Buscar credenciais existentes do Azure
Write-Host "🔍 Buscando Service Principals existentes..." -ForegroundColor Yellow
$servicePrincipals = az ad sp list --query "[?contains(displayName, 'github') || contains(displayName, 'pictback')].{DisplayName:displayName, AppId:appId}" | ConvertFrom-Json

if ($servicePrincipals.Count -eq 0) {
    Write-Host "⚠️  Nenhum Service Principal encontrado com 'github' ou 'pictback' no nome" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Listando todos os Service Principals:" -ForegroundColor Cyan
    az ad sp list --query "[].{DisplayName:displayName, AppId:appId}" --output table | Select-Object -First 20
    Write-Host ""
    $appId = Read-Host "Digite o App ID (Client ID) do Service Principal que deseja usar"
} elseif ($servicePrincipals.Count -eq 1) {
    $appId = $servicePrincipals[0].AppId
    Write-Host "✅ Encontrado: $($servicePrincipals[0].DisplayName)" -ForegroundColor Green
    Write-Host "   App ID: $appId" -ForegroundColor Gray
} else {
    Write-Host "📋 Service Principals encontrados:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $servicePrincipals.Count; $i++) {
        Write-Host "  [$i] $($servicePrincipals[$i].DisplayName) - $($servicePrincipals[$i].AppId)" -ForegroundColor White
    }
    $escolha = Read-Host "Escolha o número (0-$($servicePrincipals.Count - 1))"
    $appId = $servicePrincipals[[int]$escolha].AppId
}
Write-Host ""

# 5. Criar novo client secret
Write-Host "🔐 Criando novo client secret..." -ForegroundColor Yellow
$secretName = "github-actions-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$newSecret = az ad sp credential reset --id $appId --append --display-name $secretName --query "{clientId:appId, clientSecret:password, tenantId:tenant}" | ConvertFrom-Json

if ($null -eq $newSecret) {
    Write-Host "❌ Erro ao criar client secret!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Client secret criado!" -ForegroundColor Green
Write-Host ""

# 6. Obter subscription ID
Write-Host "📋 Obtendo informações da assinatura..." -ForegroundColor Yellow
$subscription = az account show --query "{subscriptionId:id, tenantId:tenantId}" | ConvertFrom-Json

# 7. Criar JSON no formato correto
$credentials = @{
    clientId = $newSecret.clientId
    clientSecret = $newSecret.clientSecret
    subscriptionId = $subscription.subscriptionId
    tenantId = $subscription.tenantId
    activeDirectoryEndpointUrl = "https://login.microsoftonline.com"
    resourceManagerEndpointUrl = "https://management.azure.com/"
    activeDirectoryGraphResourceId = "https://graph.windows.net/"
    sqlManagementEndpointUrl = "https://management.core.windows.net:8443/"
    galleryEndpointUrl = "https://gallery.azure.com/"
    managementEndpointUrl = "https://management.core.windows.net/"
} | ConvertTo-Json -Compress

Write-Host "✅ Credenciais preparadas" -ForegroundColor Green
Write-Host ""

# 8. Configurar secret no GitHub
Write-Host "🚀 Configurando secret AZURE_CREDENTIALS no GitHub..." -ForegroundColor Yellow
$credentials | gh secret set AZURE_CREDENTIALS --repo $REPO

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secret AZURE_CREDENTIALS configurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao configurar secret!" -ForegroundColor Red
    Write-Host ""
    Write-Host "JSON das credenciais:" -ForegroundColor Yellow
    Write-Host $credentials -ForegroundColor White
    exit 1
}
Write-Host ""

# 9. Verificar
Write-Host "📋 Verificando secrets configurados..." -ForegroundColor Yellow
gh secret list --repo $REPO
Write-Host ""

# 10. Fazer commit e push
Write-Host "📦 Fazendo commit das alterações..." -ForegroundColor Yellow
git add .
git commit -m "Configure GitHub Actions for automatic backend deployment"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado!" -ForegroundColor Green
    Write-Host ""
    
    $push = Read-Host "Deseja fazer push agora? (S/n)"
    if ($push -ne "n" -and $push -ne "N") {
        Write-Host "🚀 Fazendo push..." -ForegroundColor Yellow
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Deploy será iniciado automaticamente!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Acompanhe em:" -ForegroundColor Cyan
            Write-Host "https://github.com/$REPO/actions" -ForegroundColor White
        } else {
            Write-Host "❌ Erro no push" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  Nada para commitar ou erro no commit" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Configuração concluída!" -ForegroundColor Green
