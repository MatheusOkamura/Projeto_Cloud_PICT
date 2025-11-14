# Script de Deploy do Backend no Azure App Service
# Execute este script se você tiver acesso ao Azure CLI na conta onde o app está hospedado

# Variáveis
$RESOURCE_GROUP = "pictibmec"
$APP_NAME = "Pictback"
$LOCATION = "brazilsouth"

Write-Host "🚀 Iniciando configuração do Pictback no Azure..." -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANTE: Configure as variáveis de ambiente antes do deploy!" -ForegroundColor Yellow
Write-Host "   Edite backend/azure-settings.json com suas credenciais" -ForegroundColor Yellow

# Verificar se está logado no Azure
Write-Host "`n🔐 Verificando login no Azure..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "✓ Logado como: $($account.user.name)" -ForegroundColor Green
    Write-Host "✓ Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Não está logado no Azure CLI" -ForegroundColor Red
    Write-Host "Execute: az login" -ForegroundColor Yellow
    exit 1
}

# 1. Configurar o comando de inicialização
Write-Host "`n📝 Configurando comando de inicialização..." -ForegroundColor Yellow
az webapp config set `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --timeout 120 --log-level info"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Startup command configurado" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao configurar startup command" -ForegroundColor Red
}

# 2. Configurar variáveis de ambiente
Write-Host "`n🔧 Configurando variáveis de ambiente..." -ForegroundColor Yellow
Write-Host "⚠️  EDITE backend/azure-settings.json com suas credenciais antes de continuar!" -ForegroundColor Yellow
Write-Host "   Pressione ENTER para continuar após editar o arquivo..." -ForegroundColor Cyan
Read-Host

$settingsPath = Join-Path $PSScriptRoot "backend\azure-settings.json"
if (Test-Path $settingsPath) {
    Write-Host "Aplicando configurações de: $settingsPath" -ForegroundColor Gray
    
    # Ler e converter JSON para formato Azure CLI
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    $settingsArray = @()
    
    $settings.PSObject.Properties | ForEach-Object {
        $settingsArray += "$($_.Name)=$($_.Value)"
    }
    
    az webapp config appsettings set `
      --resource-group $RESOURCE_GROUP `
      --name $APP_NAME `
      --settings $settingsArray
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Variáveis de ambiente configuradas" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro ao configurar variáveis" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Arquivo azure-settings.json não encontrado!" -ForegroundColor Red
    Write-Host "   Copie azure-settings.json.example e configure suas credenciais" -ForegroundColor Yellow
}

# 3. Habilitar HTTPS only
Write-Host "`n🔒 Habilitando HTTPS only..." -ForegroundColor Yellow
az webapp update `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --https-only true

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ HTTPS obrigatório habilitado" -ForegroundColor Green
}

# 4. Fazer o deploy
Write-Host "`n📦 Fazendo deploy do código..." -ForegroundColor Yellow
Write-Host "Navegando para a pasta backend..." -ForegroundColor Gray
$BACKEND_PATH = Join-Path $PSScriptRoot "backend"
$ORIGINAL_PATH = Get-Location

try {
    Set-Location $BACKEND_PATH
    
    Write-Host "Criando arquivo ZIP..." -ForegroundColor Gray
    $ZIP_PATH = Join-Path $PSScriptRoot "backend-deploy.zip"
    
    if (Test-Path $ZIP_PATH) {
        Remove-Item $ZIP_PATH -Force
    }
    
    # Criar lista de arquivos para incluir (excluir __pycache__, .env, etc)
    $filesToZip = Get-ChildItem -Path $BACKEND_PATH -Recurse -File | 
        Where-Object { 
            $_.FullName -notmatch '__pycache__' -and
            $_.Extension -ne '.pyc' -and
            $_.Extension -ne '.db' -and
            $_.Name -ne '.env' -and
            $_.FullName -notmatch 'venv' -and
            $_.FullName -notmatch 'uploads'
        }
    
    Write-Host "Incluindo $($filesToZip.Count) arquivos no deploy..." -ForegroundColor Gray
    
    Compress-Archive -Path $filesToZip.FullName -DestinationPath $ZIP_PATH -Force
    
    Write-Host "Fazendo upload para o Azure..." -ForegroundColor Gray
    az webapp deployment source config-zip `
      --resource-group $RESOURCE_GROUP `
      --name $APP_NAME `
      --src $ZIP_PATH
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deploy concluído com sucesso" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro no deploy" -ForegroundColor Red
    }
    
    # Limpar arquivo ZIP
    Remove-Item $ZIP_PATH -Force
    
} finally {
    Set-Location $ORIGINAL_PATH
}

# 5. Reiniciar o app
Write-Host "`n🔄 Reiniciando aplicação..." -ForegroundColor Yellow
az webapp restart `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Aplicação reiniciada" -ForegroundColor Green
}

# 6. Aguardar inicialização
Write-Host "`n⏳ Aguardando inicialização (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 7. Testar
Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
Write-Host "`n🌐 Testando a API..." -ForegroundColor Cyan
$API_URL = "https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net"

Write-Host "`nTestando endpoint raiz..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_URL/" -Method Get -TimeoutSec 30
    Write-Host "✓ Endpoint raiz OK" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no endpoint raiz" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nTestando health check..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/health" -Method Get -TimeoutSec 30
    Write-Host "✓ Health check OK" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no health check" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n📊 URLs importantes:" -ForegroundColor Cyan
Write-Host "  API: $API_URL" -ForegroundColor White
Write-Host "  Docs: $API_URL/docs" -ForegroundColor White
Write-Host "  Health: $API_URL/api/health" -ForegroundColor White

Write-Host "`n📝 Para ver os logs em tempo real:" -ForegroundColor Cyan
Write-Host "  az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME" -ForegroundColor White

Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Configure as variáveis de ambiente no Azure Portal" -ForegroundColor White
Write-Host "  2. Configure o Redirect URI no Microsoft Entra ID" -ForegroundColor White
Write-Host "  3. Teste o login OAuth" -ForegroundColor White
Write-Host "  4. Atualize o frontend para usar a URL de produção" -ForegroundColor White

Write-Host "`n✨ Deploy finalizado!" -ForegroundColor Green
