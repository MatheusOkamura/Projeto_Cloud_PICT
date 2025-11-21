# Deploy Backend para Azure usando Zip Deploy
# Baseado no arquivo Pictback.PublishSettings

Write-Host "[DEPLOY] Iniciando deploy do backend para Azure..." -ForegroundColor Cyan

# Configuracoes do Azure (do arquivo PublishSettings)
$appName = "Pictback"
$publishUrl = "pictback-bzakbsfgc6bgcjcc.scm.brazilsouth-01.azurewebsites.net"
$username = "`$Pictback"
$password = "93unmPxokdSq4QJ9hw5zmuoti0DlfyLHrr4ej4NndSrcGorjNKKsuYT6Qp1b"

# Diretorio do backend
$backendPath = Join-Path $PSScriptRoot "backend"
$zipPath = Join-Path $PSScriptRoot "backend-deploy.zip"

# Verificar se a pasta backend existe
if (-not (Test-Path $backendPath)) {
    Write-Host "[ERRO] Pasta 'backend' nao encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "[ZIP] Criando arquivo ZIP do backend..." -ForegroundColor Yellow

# Remover ZIP antigo se existir
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Criar ZIP do backend (excluindo arquivos desnecessarios)
$filesToZip = Get-ChildItem $backendPath -Recurse | Where-Object {
    $_.FullName -notmatch '__pycache__|\.pyc$|\.env$|\.db$|uploads\\'
}

Compress-Archive -Path "$backendPath\*" -DestinationPath $zipPath -Force

Write-Host "[OK] ZIP criado: $zipPath" -ForegroundColor Green
Write-Host "[UPLOAD] Enviando para Azure App Service..." -ForegroundColor Yellow

# Criar credenciais Basic Auth
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username, $password)))

# URL do Kudu Zip Deploy
$zipDeployUrl = "https://$publishUrl/api/zipdeploy"

try {
    # Upload do ZIP
    $result = Invoke-RestMethod -Uri $zipDeployUrl `
        -Headers @{Authorization=("Basic {0}" -f $base64AuthInfo)} `
        -Method POST `
        -InFile $zipPath `
        -ContentType "application/zip" `
        -TimeoutSec 300

    Write-Host "[SUCESSO] Deploy concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[URL] Backend: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net" -ForegroundColor Cyan
    Write-Host "[DOCS] API Docs: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/docs" -ForegroundColor Cyan
    
} catch {
    Write-Host "[ERRO] Falha no deploy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Limpar arquivo ZIP
Write-Host "[CLEANUP] Limpando arquivos temporarios..." -ForegroundColor Yellow
Remove-Item $zipPath -Force

Write-Host ""
Write-Host "[CONCLUIDO] Deploy finalizado!" -ForegroundColor Green
