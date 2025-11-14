# Script para criar e configurar AZURE_CREDENTIALS corretamente
# Resolve o erro: "Not all values are present"

$REPO = "MatheusOkamura/Projeto_Cloud_PICT"
$RESOURCE_GROUP = "PICTIBMEC"
$SP_NAME = "github-actions-pictback-$(Get-Date -Format 'yyyyMMdd')"

Write-Host "🔧 Configurando AZURE_CREDENTIALS do zero..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar GitHub CLI
Write-Host "📋 Verificando GitHub CLI..." -ForegroundColor Yellow
try {
    $ghVersion = gh --version 2>$null
    if ($null -eq $ghVersion) { throw }
    Write-Host "✅ GitHub CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale: winget install GitHub.cli" -ForegroundColor White
    exit 1
}
Write-Host ""

# 2. Verificar autenticação GitHub
Write-Host "🔐 Verificando autenticação GitHub..." -ForegroundColor Yellow
$ghAuth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não autenticado no GitHub!" -ForegroundColor Red
    Write-Host "Execute: gh auth login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Autenticado no GitHub" -ForegroundColor Green
Write-Host ""

# 3. Verificar autenticação Azure
Write-Host "🔐 Verificando autenticação Azure..." -ForegroundColor Yellow
$azAccount = az account show 2>$null | ConvertFrom-Json
if ($null -eq $azAccount) {
    Write-Host "❌ Não autenticado no Azure!" -ForegroundColor Red
    Write-Host "Execute: az login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Autenticado no Azure" -ForegroundColor Green
Write-Host "   Subscription: $($azAccount.name)" -ForegroundColor Gray
Write-Host "   Tenant: $($azAccount.tenantId)" -ForegroundColor Gray
Write-Host ""

# 4. Obter Subscription ID
$subscriptionId = $azAccount.id
$tenantId = $azAccount.tenantId

# 5. Criar Service Principal
Write-Host "🔐 Criando Service Principal: $SP_NAME" -ForegroundColor Yellow
Write-Host "   Scope: /subscriptions/$subscriptionId/resourceGroups/$RESOURCE_GROUP" -ForegroundColor Gray

try {
    $spJson = az ad sp create-for-rbac `
        --name $SP_NAME `
        --role contributor `
        --scopes "/subscriptions/$subscriptionId/resourceGroups/$RESOURCE_GROUP" `
        --sdk-auth 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao criar Service Principal: $spJson"
    }
    
    # Parse do JSON
    $spCredentials = $spJson | ConvertFrom-Json
    
    Write-Host "✅ Service Principal criado!" -ForegroundColor Green
    Write-Host "   Client ID: $($spCredentials.clientId)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    
    # Tentar usar existente
    Write-Host ""
    Write-Host "⚠️  Tentando usar Service Principal existente..." -ForegroundColor Yellow
    
    $existingSPs = az ad sp list --display-name $SP_NAME --query "[0]" | ConvertFrom-Json
    
    if ($null -eq $existingSPs) {
        Write-Host "❌ Não foi possível criar ou encontrar Service Principal" -ForegroundColor Red
        exit 1
    }
    
    # Reset credentials
    $spCredentials = az ad sp credential reset --id $existingSPs.appId --query "{clientId:appId, clientSecret:password, tenantId:tenant}" | ConvertFrom-Json
    $spCredentials | Add-Member -NotePropertyName "subscriptionId" -NotePropertyValue $subscriptionId
    
    Write-Host "✅ Credenciais resetadas!" -ForegroundColor Green
}

# 6. Criar JSON completo no formato correto
$azureCredentials = @{
    clientId = $spCredentials.clientId
    clientSecret = $spCredentials.clientSecret
    subscriptionId = $subscriptionId
    tenantId = $tenantId
    activeDirectoryEndpointUrl = "https://login.microsoftonline.com"
    resourceManagerEndpointUrl = "https://management.azure.com/"
    activeDirectoryGraphResourceId = "https://graph.windows.net/"
    sqlManagementEndpointUrl = "https://management.core.windows.net:8443/"
    galleryEndpointUrl = "https://gallery.azure.com/"
    managementEndpointUrl = "https://management.core.windows.net/"
}

$azureCredentialsJson = $azureCredentials | ConvertTo-Json -Compress

# 7. Validar JSON
Write-Host "📋 Validando credenciais..." -ForegroundColor Yellow
$requiredFields = @("clientId", "clientSecret", "subscriptionId", "tenantId")
$missingFields = @()

foreach ($field in $requiredFields) {
    if ([string]::IsNullOrEmpty($azureCredentials[$field])) {
        $missingFields += $field
    }
}

if ($missingFields.Count -gt 0) {
    Write-Host "❌ Campos obrigatórios faltando: $($missingFields -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Todas as credenciais presentes!" -ForegroundColor Green
Write-Host ""

# 8. Mostrar JSON (sem clientSecret)
Write-Host "📋 Credenciais geradas:" -ForegroundColor Cyan
$displayCreds = $azureCredentials.Clone()
$displayCreds.clientSecret = "***HIDDEN***"
$displayCreds | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
Write-Host ""

# 9. Configurar secret no GitHub
Write-Host "🚀 Configurando secret AZURE_CREDENTIALS no GitHub..." -ForegroundColor Yellow

try {
    $azureCredentialsJson | gh secret set AZURE_CREDENTIALS --repo $REPO
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secret configurado com sucesso!" -ForegroundColor Green
    } else {
        throw "Erro ao configurar secret"
    }
} catch {
    Write-Host "❌ Erro ao configurar secret: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure manualmente em:" -ForegroundColor Yellow
    Write-Host "https://github.com/$REPO/settings/secrets/actions" -ForegroundColor White
    Write-Host ""
    Write-Host "JSON para copiar:" -ForegroundColor Yellow
    $azureCredentialsJson | Set-Clipboard
    Write-Host $azureCredentialsJson -ForegroundColor White
    Write-Host ""
    Write-Host "✅ JSON copiado para área de transferência!" -ForegroundColor Green
    exit 1
}
Write-Host ""

# 10. Verificar secrets
Write-Host "📋 Secrets configurados no repositório:" -ForegroundColor Yellow
gh secret list --repo $REPO
Write-Host ""

# 11. Commit e Push
Write-Host "📦 Preparando para commit..." -ForegroundColor Yellow
$hasChanges = git status --porcelain
if ($hasChanges) {
    git add .
    git commit -m "Fix: Configure AZURE_CREDENTIALS for backend deployment"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit realizado!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "🚀 Fazendo push..." -ForegroundColor Yellow
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Push concluído!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 GitHub Actions iniciará o deploy automaticamente!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Acompanhe em:" -ForegroundColor Cyan
            Write-Host "https://github.com/$REPO/actions" -ForegroundColor White
        } else {
            Write-Host "❌ Erro no push" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  Nenhuma alteração para commitar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Você pode forçar um novo deploy em:" -ForegroundColor Cyan
    Write-Host "https://github.com/$REPO/actions/workflows/deploy-backend.yml" -ForegroundColor White
    Write-Host "Clique em 'Run workflow'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Resumo:" -ForegroundColor Cyan
Write-Host "   Service Principal: $SP_NAME" -ForegroundColor White
Write-Host "   Client ID: $($azureCredentials.clientId)" -ForegroundColor White
Write-Host "   Tenant ID: $tenantId" -ForegroundColor White
Write-Host "   Subscription ID: $subscriptionId" -ForegroundColor White
