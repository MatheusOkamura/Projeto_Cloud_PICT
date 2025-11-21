# Script para configurar OIDC entre GitHub Actions e Azure
# Isso elimina a necessidade de publish profiles

$ErrorActionPreference = "Stop"

# Configuracoes
$appName = "github-actions-pictibmec"
$repoOwner = "MatheusOkamura"
$repoName = "Projeto_Cloud_PICT"
$resourceGroup = "PICTIBMEC"
$webappName = "pictback-bzakbsfgc6bgcjcc"

Write-Host "Configurando OIDC para GitHub Actions..." -ForegroundColor Cyan

# Obter IDs da subscription e tenant
$subscriptionId = az account show --query id -o tsv
$tenantId = az account show --query tenantId -o tsv

Write-Host "Subscription ID: $subscriptionId" -ForegroundColor Yellow
Write-Host "Tenant ID: $tenantId" -ForegroundColor Yellow

# Verificar se o Service Principal ja existe
Write-Host "`nVerificando se o Service Principal ja existe..." -ForegroundColor Cyan
$existingApp = az ad app list --display-name $appName --query "[0].appId" -o tsv

if ($existingApp) {
    Write-Host "Service Principal '$appName' ja existe (App ID: $existingApp)" -ForegroundColor Yellow
    $appId = $existingApp
} else {
    Write-Host "Criando Service Principal..." -ForegroundColor Cyan
    
    # Criar o Service Principal
    $appId = az ad app create --display-name $appName --query appId -o tsv
    
    if (-not $appId) {
        Write-Host "Erro ao criar o Service Principal" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Service Principal criado com sucesso! App ID: $appId" -ForegroundColor Green
    
    # Criar o Service Principal associado
    az ad sp create --id $appId
    
    # Aguardar propagacao
    Write-Host "Aguardando propagacao..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Obter o Object ID do Service Principal
$spObjectId = az ad sp show --id $appId --query id -o tsv

Write-Host "Service Principal Object ID: $spObjectId" -ForegroundColor Yellow

# Atribuir permissoes de Contributor no Resource Group
Write-Host "`nAtribuindo permissoes de Contributor..." -ForegroundColor Cyan

try {
    az role assignment create `
        --role "Contributor" `
        --assignee $appId `
        --scope "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup"
    
    Write-Host "Permissoes atribuidas com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Aviso: Permissao ja pode existir ou erro ao atribuir" -ForegroundColor Yellow
}

# Configurar credenciais federadas para GitHub Actions
Write-Host "`nConfigurando credenciais federadas..." -ForegroundColor Cyan

$credentialName = "github-actions-main"
$subject = "repo:${repoOwner}/${repoName}:ref:refs/heads/main"

# Criar arquivo JSON temporario para as credenciais federadas
$federatedCredential = @{
    name = $credentialName
    issuer = "https://token.actions.githubusercontent.com"
    subject = $subject
    audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json

$tempFile = New-TemporaryFile
$federatedCredential | Set-Content $tempFile.FullName

try {
    az ad app federated-credential create `
        --id $appId `
        --parameters $tempFile.FullName
    
    Write-Host "Credenciais federadas configuradas com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Aviso: Credencial federada ja pode existir" -ForegroundColor Yellow
}

Remove-Item $tempFile.FullName

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACAO CONCLUIDA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nAdicione os seguintes secrets no GitHub:" -ForegroundColor White
Write-Host "https://github.com/$repoOwner/$repoName/settings/secrets/actions" -ForegroundColor Yellow

Write-Host "`n1. AZURE_CLIENT_ID" -ForegroundColor White
Write-Host "   Valor: $appId" -ForegroundColor Yellow

Write-Host "`n2. AZURE_TENANT_ID" -ForegroundColor White
Write-Host "   Valor: $tenantId" -ForegroundColor Yellow

Write-Host "`n3. AZURE_SUBSCRIPTION_ID" -ForegroundColor White
Write-Host "   Valor: $subscriptionId" -ForegroundColor Yellow

Write-Host "`n========================================`n" -ForegroundColor Cyan

Write-Host "Depois de adicionar os secrets, o workflow deploy-backend-oidc.yml funcionara automaticamente!" -ForegroundColor Green
