# Upgrade do App Service Plan para B1 (Basic)
Write-Host "[INFO] O App Service esta com status 'QuotaExceeded'" -ForegroundColor Yellow
Write-Host "[INFO] Isso significa que a cota gratuita foi excedida." -ForegroundColor Yellow
Write-Host ""
Write-Host "[OPCAO] Para reativar, voce precisa fazer upgrade do plano." -ForegroundColor Cyan
Write-Host ""

$appName = "Pictback"
$resourceGroup = "PICTIBMEC"

# Listar o App Service Plan atual
Write-Host "[INFO] Verificando App Service Plan atual..." -ForegroundColor Yellow
$appServicePlan = az webapp show --name $appName --resource-group $resourceGroup --query "appServicePlanId" --output tsv

if ($appServicePlan) {
    $planName = $appServicePlan.Split('/')[-1]
    Write-Host "[INFO] App Service Plan: $planName" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "[UPGRADE] Para fazer upgrade para B1 (Basic - ~R$ 60/mes):" -ForegroundColor Yellow
    Write-Host "az appservice plan update --name $planName --resource-group $resourceGroup --sku B1" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[ALTERNATIVA] Ou manter Free e aguardar reset da cota (proximo dia/mes)" -ForegroundColor Yellow
    Write-Host ""
    
    $resposta = Read-Host "Deseja fazer upgrade agora? (s/n)"
    
    if ($resposta -eq "s" -or $resposta -eq "S") {
        Write-Host "[UPGRADE] Fazendo upgrade..." -ForegroundColor Cyan
        az appservice plan update --name $planName --resource-group $resourceGroup --sku B1
        
        Write-Host "[OK] Upgrade concluido!" -ForegroundColor Green
        Write-Host "[START] Iniciando App Service..." -ForegroundColor Yellow
        az webapp start --name $appName --resource-group $resourceGroup
        
        Write-Host ""
        Write-Host "[SUCESSO] App Service reativado!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Nenhuma alteracao feita." -ForegroundColor Yellow
    }
}
