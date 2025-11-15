# Script para verificar e configurar o GitHub Secret do Azure Static Web Apps

$ErrorActionPreference = "Stop"

# Configuracoes
$owner = "MatheusOkamura"
$repo = "Projeto_Cloud_PICT"
$secretName = "AZURE_STATIC_WEB_APPS_API_TOKEN"

# Obter o token do Azure Static Web Apps
Write-Host "Obtendo token do Azure Static Web Apps..." -ForegroundColor Cyan
$azureToken = az staticwebapp secrets list --name PictIbmec --resource-group PICTIBMEC --query "properties.apiKey" -o tsv

if (-not $azureToken) {
    Write-Host "Erro: Nao foi possivel obter o token do Azure." -ForegroundColor Red
    exit 1
}

Write-Host "Token do Azure obtido com sucesso." -ForegroundColor Green

# Instrucoes manuais
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACAO MANUAL DO SECRET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n1. Acesse: https://github.com/$owner/$repo/settings/secrets/actions" -ForegroundColor White
Write-Host "`n2. Clique em 'New repository secret' (ou 'Update' se ja existir)" -ForegroundColor White
Write-Host "`n3. Configure:" -ForegroundColor White
Write-Host "   Nome: $secretName" -ForegroundColor Yellow
Write-Host "   Valor: $azureToken" -ForegroundColor Yellow
Write-Host "`n4. Clique em 'Add secret' ou 'Update secret'" -ForegroundColor White
Write-Host "`n5. IMPORTANTE: Verifique se o nome esta EXATAMENTE como mostrado acima" -ForegroundColor Red
Write-Host "   (case-sensitive, sem espacos extras)" -ForegroundColor Red
Write-Host "`n========================================`n" -ForegroundColor Cyan

Write-Host "Script concluido." -ForegroundColor Green
