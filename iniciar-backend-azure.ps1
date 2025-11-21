# Iniciar Azure App Service
Write-Host "[START] Iniciando o backend no Azure..." -ForegroundColor Cyan

$appName = "Pictback"
$resourceGroup = "PICTIBMEC"

# Verificar se esta logado no Azure
Write-Host "[AUTH] Verificando autenticacao..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json

if (-not $account) {
    Write-Host "[ERRO] Nao esta logado no Azure. Execute: az login" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Logado como: $($account.user.name)" -ForegroundColor Green

# Iniciar o App Service
Write-Host "[START] Iniciando App Service '$appName'..." -ForegroundColor Yellow

try {
    az webapp start --name $appName --resource-group $resourceGroup
    
    Write-Host "[OK] App Service iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[INFO] Aguarde alguns segundos para o servico ficar pronto..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    Write-Host "[TEST] Testando backend..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/health" -UseBasicParsing
        Write-Host "[SUCESSO] Backend esta respondendo!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "[AVISO] Backend ainda nao esta respondendo. Aguarde mais alguns segundos." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERRO] Falha ao iniciar: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] URLs do sistema:" -ForegroundColor Cyan
Write-Host "  Backend: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net" -ForegroundColor White
Write-Host "  API Docs: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/docs" -ForegroundColor White
Write-Host "  Health Check: https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net/api/health" -ForegroundColor White
