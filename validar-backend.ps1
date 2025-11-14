# Script de Validação Pré-Deploy
# Verifica se tudo está configurado corretamente antes de fazer deploy

Write-Host "🔍 Validando configuração do backend para deploy no Azure..." -ForegroundColor Cyan

$errors = @()
$warnings = @()

# 1. Verificar arquivos necessários
Write-Host "`n📁 Verificando arquivos necessários..." -ForegroundColor Yellow

$requiredFiles = @(
    "backend\main.py",
    "backend\requirements.txt",
    "backend\startup.txt",
    "backend\database.py",
    "backend\config.py",
    "backend\microsoft_auth.py"
)

foreach ($file in $requiredFiles) {
    if (Test-Path (Join-Path $PSScriptRoot $file)) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file - NÃO ENCONTRADO" -ForegroundColor Red
        $errors += "Arquivo obrigatório não encontrado: $file"
    }
}

# 2. Verificar azure-settings.json
Write-Host "`n⚙️  Verificando azure-settings.json..." -ForegroundColor Yellow
$settingsPath = Join-Path $PSScriptRoot "backend\azure-settings.json"

if (Test-Path $settingsPath) {
    Write-Host "  ✓ azure-settings.json encontrado" -ForegroundColor Green
    
    try {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        
        # Verificar variáveis críticas
        $criticalVars = @(
            "MICROSOFT_TENANT_ID",
            "MICROSOFT_CLIENT_ID",
            "MICROSOFT_CLIENT_SECRET",
            "JWT_SECRET_KEY",
            "FRONTEND_URL",
            "BACKEND_URL"
        )
        
        foreach ($var in $criticalVars) {
            $value = $settings.$var
            if ([string]::IsNullOrEmpty($value)) {
                Write-Host "  ✗ $var - NÃO CONFIGURADO" -ForegroundColor Red
                $errors += "Variável de ambiente não configurada: $var"
            } elseif ($value -match "MUDE|SEU_|AQUI|your-") {
                Write-Host "  ⚠  $var - VALOR PADRÃO DETECTADO" -ForegroundColor Yellow
                $warnings += "Variável com valor padrão: $var"
            } else {
                Write-Host "  ✓ $var - Configurado" -ForegroundColor Green
            }
        }
        
        # Verificar se JWT_SECRET_KEY é seguro
        if ($settings.JWT_SECRET_KEY -eq $settings.SECRET_KEY) {
            Write-Host "  ✓ JWT_SECRET_KEY e SECRET_KEY são iguais" -ForegroundColor Green
        } else {
            Write-Host "  ⚠  JWT_SECRET_KEY e SECRET_KEY são diferentes" -ForegroundColor Yellow
            $warnings += "JWT_SECRET_KEY e SECRET_KEY deveriam ser iguais"
        }
        
    } catch {
        Write-Host "  ✗ Erro ao ler azure-settings.json: $($_.Exception.Message)" -ForegroundColor Red
        $errors += "Erro ao ler azure-settings.json"
    }
} else {
    Write-Host "  ✗ azure-settings.json NÃO ENCONTRADO" -ForegroundColor Red
    $errors += "Arquivo azure-settings.json não encontrado. Copie de azure-settings.json.example"
}

# 3. Verificar requirements.txt
Write-Host "`n📦 Verificando requirements.txt..." -ForegroundColor Yellow
$reqPath = Join-Path $PSScriptRoot "backend\requirements.txt"

if (Test-Path $reqPath) {
    $requirements = Get-Content $reqPath
    
    $requiredPackages = @("fastapi", "uvicorn", "gunicorn", "sqlalchemy", "psycopg2-binary")
    
    foreach ($package in $requiredPackages) {
        if ($requirements -match $package) {
            Write-Host "  ✓ $package" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $package - NÃO ENCONTRADO" -ForegroundColor Red
            $errors += "Pacote necessário não encontrado em requirements.txt: $package"
        }
    }
} else {
    Write-Host "  ✗ requirements.txt não encontrado" -ForegroundColor Red
    $errors += "requirements.txt não encontrado"
}

# 4. Verificar startup.txt
Write-Host "`n🚀 Verificando startup.txt..." -ForegroundColor Yellow
$startupPath = Join-Path $PSScriptRoot "backend\startup.txt"

if (Test-Path $startupPath) {
    $startup = Get-Content $startupPath -Raw
    
    if ($startup -match "gunicorn") {
        Write-Host "  ✓ Comando gunicorn configurado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠  Gunicorn não encontrado no startup command" -ForegroundColor Yellow
        $warnings += "Startup command não usa gunicorn"
    }
    
    if ($startup -match "uvicorn.workers.UvicornWorker") {
        Write-Host "  ✓ Worker Uvicorn configurado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠  Worker Uvicorn não configurado" -ForegroundColor Yellow
        $warnings += "Worker Uvicorn não configurado"
    }
} else {
    Write-Host "  ✗ startup.txt não encontrado" -ForegroundColor Red
    $errors += "startup.txt não encontrado"
}

# 5. Verificar Azure CLI
Write-Host "`n☁️  Verificando Azure CLI..." -ForegroundColor Yellow

try {
    $azVersion = az version 2>$null | ConvertFrom-Json
    Write-Host "  ✓ Azure CLI instalado (versão $($azVersion.'azure-cli'))" -ForegroundColor Green
    
    # Verificar login
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        Write-Host "  ✓ Logado como: $($account.user.name)" -ForegroundColor Green
        Write-Host "  ✓ Subscription: $($account.name)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Não está logado no Azure CLI" -ForegroundColor Red
        $errors += "Execute 'az login' antes de fazer deploy"
    }
} catch {
    Write-Host "  ✗ Azure CLI não instalado" -ForegroundColor Red
    $errors += "Azure CLI não está instalado. Instale de: https://aka.ms/azure-cli"
}

# 6. Verificar conectividade com Azure App Service
Write-Host "`n🌐 Verificando conectividade com Azure App Service..." -ForegroundColor Yellow

try {
    $appInfo = az webapp show --resource-group "pictibmec" --name "Pictback" 2>$null | ConvertFrom-Json
    if ($appInfo) {
        Write-Host "  ✓ App Service encontrado: $($appInfo.name)" -ForegroundColor Green
        Write-Host "  ✓ Estado: $($appInfo.state)" -ForegroundColor Green
        Write-Host "  ✓ URL: $($appInfo.defaultHostName)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠  Não foi possível verificar o App Service" -ForegroundColor Yellow
    $warnings += "Não foi possível verificar o App Service. Verifique permissões."
}

# Resumo
Write-Host "`n" + ("="*80) -ForegroundColor Cyan
Write-Host "📊 RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host ("="*80) -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ Tudo certo! Backend pronto para deploy." -ForegroundColor Green
    Write-Host "`nExecute: .\deploy-backend-azure.ps1" -ForegroundColor White
    exit 0
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️  Avisos ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  • $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Erros encontrados ($($errors.Count)):" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  • $err" -ForegroundColor Red
    }
    Write-Host "`n🔧 Corrija os erros antes de fazer deploy." -ForegroundColor Red
    exit 1
}

if ($warnings.Count -gt 0 -and $errors.Count -eq 0) {
    Write-Host "`n⚠️  Há avisos, mas o deploy pode continuar." -ForegroundColor Yellow
    Write-Host "`nDeseja continuar? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "`nExecute: .\deploy-backend-azure.ps1" -ForegroundColor White
        exit 0
    } else {
        Write-Host "Deploy cancelado." -ForegroundColor Yellow
        exit 1
    }
}
