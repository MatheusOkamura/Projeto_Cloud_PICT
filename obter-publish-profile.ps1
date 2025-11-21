# Script para obter e configurar o Publish Profile no GitHub

$ErrorActionPreference = "Stop"

$webappName = "Pictback"
$resourceGroup = "PICTIBMEC"
$repoOwner = "MatheusOkamura"
$repoName = "Projeto_Cloud_PICT"

Write-Host "Baixando Publish Profile..." -ForegroundColor Cyan

# Baixar usando Azure CLI diretamente para arquivo
az webapp deployment list-publishing-profiles `
    --name $webappName `
    --resource-group $resourceGroup `
    --xml `
    --output none `
    --subscription c1ccd263-cd87-4e1a-b12c-f3412a28cac1 > temp-profile.xml 2>&1

# Ler o conteudo
$publishProfile = Get-Content temp-profile.xml -Raw

# Remover arquivo temporario
Remove-Item temp-profile.xml -ErrorAction SilentlyContinue

Write-Host "Publish Profile obtido com sucesso!" -ForegroundColor Green

# Codificar em base64 para facilitar
$publishProfileBytes = [System.Text.Encoding]::UTF8.GetBytes($publishProfile)
$publishProfileBase64 = [Convert]::ToBase64String($publishProfileBytes)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACAO DO GITHUB SECRET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Acesse:" -ForegroundColor White
Write-Host "   https://github.com/$repoOwner/$repoName/settings/secrets/actions" -ForegroundColor Yellow

Write-Host "`n2. Adicione ou atualize o secret:" -ForegroundColor White
Write-Host "   Nome: AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Yellow

Write-Host "`n3. Cole o conteudo completo do arquivo 'publish-profile.xml' que foi salvo" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Salvar em arquivo para referencia
$publishProfile | Set-Content "publish-profile.xml" -NoNewline

Write-Host "O publish profile foi salvo em: publish-profile.xml" -ForegroundColor Green
Write-Host "Use o conteudo desse arquivo como valor do secret AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Yellow
Write-Host "`nIMPORTANTE: Nao compartilhe esse arquivo! Ele contem credenciais sensiveis." -ForegroundColor Red
