# Script de Teste Completo do Backend

$BACKEND_URL = "https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net"
$RESOURCE_GROUP = "PICTIBMEC"
$APP_NAME = "Pictback"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE COMPLETO DO BACKEND" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Status do Azure App Service
Write-Host "1️⃣  Status do Azure App Service" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $appStatus = az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "{state:state, availabilityState:availabilityState, httpsOnly:httpsOnly}" | ConvertFrom-Json
    
    Write-Host "   Estado: " -NoNewline; Write-Host $appStatus.state -ForegroundColor $(if ($appStatus.state -eq "Running") { "Green" } else { "Red" })
    Write-Host "   Disponibilidade: " -NoNewline; Write-Host $appStatus.availabilityState -ForegroundColor $(if ($appStatus.availabilityState -eq "Normal") { "Green" } else { "Yellow" })
    Write-Host "   HTTPS Only: " -NoNewline; Write-Host $appStatus.httpsOnly -ForegroundColor White
} catch {
    Write-Host "   ❌ Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Configuração do Runtime
Write-Host "2️⃣  Configuração do Runtime" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $runtimeConfig = az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "{pythonVersion:linuxFxVersion, startupCommand:appCommandLine}" | ConvertFrom-Json
    
    Write-Host "   Python: " -NoNewline; Write-Host $runtimeConfig.pythonVersion -ForegroundColor White
    Write-Host "   Startup: " -NoNewline; Write-Host $runtimeConfig.startupCommand -ForegroundColor White
} catch {
    Write-Host "   ❌ Erro ao verificar configuração: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Variáveis de Ambiente
Write-Host "3️⃣  Variáveis de Ambiente Críticas" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $settings = az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP | ConvertFrom-Json
    
    $criticalVars = @("PYTHONUNBUFFERED", "SCM_DO_BUILD_DURING_DEPLOYMENT", "ENABLE_ORYX_BUILD", "WEBSITES_PORT")
    
    foreach ($varName in $criticalVars) {
        $var = $settings | Where-Object { $_.name -eq $varName }
        if ($var) {
            Write-Host "   ✅ $varName = $($var.value)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $varName = NÃO CONFIGURADO" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Erro ao verificar variáveis: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Teste de Conexão - Root
Write-Host "4️⃣  Teste de Endpoint: Root (/)" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri $BACKEND_URL -Method Get -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   ✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "   📋 Resposta:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 2 | ForEach-Object { "      $_" } | Write-Host -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
        Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 5. Teste de Endpoint - Health
Write-Host "5️⃣  Teste de Endpoint: Health (/api/health)" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/api/health" -Method Get -TimeoutSec 15 -ErrorAction Stop
    Write-Host "   ✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "   📋 Resposta:" -ForegroundColor Yellow
    $health | ConvertTo-Json -Depth 2 | ForEach-Object { "      $_" } | Write-Host -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
        Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 6. Teste de Endpoint - Docs
Write-Host "6️⃣  Teste de Endpoint: Docs (/docs)" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $docs = Invoke-WebRequest -Uri "$BACKEND_URL/docs" -Method Get -TimeoutSec 15 -ErrorAction Stop -UseBasicParsing
    Write-Host "   ✅ Status: $($docs.StatusCode) OK" -ForegroundColor Green
    Write-Host "   📄 Documentação acessível: $BACKEND_URL/docs" -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
        Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 7. GitHub Actions Status
Write-Host "7️⃣  Status do GitHub Actions" -ForegroundColor Cyan
Write-Host "   ----------------------------" -ForegroundColor Gray
try {
    $runs = gh run list --workflow=deploy-backend.yml --limit 3 --json status,conclusion,createdAt,headBranch 2>&1
    if ($LASTEXITCODE -eq 0 -and $runs) {
        $runsData = $runs | ConvertFrom-Json
        if ($runsData.Count -gt 0) {
            foreach ($run in $runsData) {
                $status = if ($run.conclusion -eq "success") { "✅" } elseif ($run.conclusion -eq "failure") { "❌" } else { "⏳" }
                $color = if ($run.conclusion -eq "success") { "Green" } elseif ($run.conclusion -eq "failure") { "Red" } else { "Yellow" }
                Write-Host "   $status Status: " -NoNewline; Write-Host $run.status -ForegroundColor $color -NoNewline
                Write-Host " - Branch: $($run.headBranch)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ⚠️  Nenhum deploy encontrado" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  GitHub CLI não autenticado ou erro ao buscar runs" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Não foi possível verificar: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# 8. Resumo Final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor White
Write-Host "Docs: $BACKEND_URL/docs" -ForegroundColor White
Write-Host "GitHub Actions: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions" -ForegroundColor White
Write-Host ""
Write-Host "💡 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor Gray
Write-Host "   Reiniciar: az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP" -ForegroundColor Gray
Write-Host "   Deploy manual: gh workflow run deploy-backend.yml" -ForegroundColor Gray
Write-Host ""
