# Iniciar Sistema Completo Localmente
Write-Host "[SISTEMA] Iniciando projeto completo localmente..." -ForegroundColor Cyan
Write-Host ""

# Criar arquivo .env se nao existir
if (-not (Test-Path "backend\.env")) {
    Write-Host "[CONFIG] Criando arquivo .env para backend..." -ForegroundColor Yellow
    
    $envContent = @"
# Configuracao Local
ENVIRONMENT=development
DATABASE_URL=sqlite:///./iniciacao_cientifica.db

# JWT
JWT_SECRET_KEY=chave-secreta-desenvolvimento-local-12345

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# Microsoft OAuth (opcional - deixe vazio se nao usar)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
"@
    
    Set-Content -Path "backend\.env" -Value $envContent
    Write-Host "[OK] Arquivo .env criado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND E FRONTEND" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Abra um NOVO terminal e execute:" -ForegroundColor Yellow
Write-Host "    .\iniciar-backend-local.ps1" -ForegroundColor White
Write-Host ""
Write-Host "[2] Abra OUTRO terminal e execute:" -ForegroundColor Yellow
Write-Host "    .\iniciar-frontend-local.ps1" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URLS DO SISTEMA" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:     http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:      http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs:     http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Health Check: http://localhost:8000/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Perguntar se quer iniciar automaticamente em duas janelas
$resposta = Read-Host "Deseja abrir os dois servidores automaticamente em janelas separadas? (s/n)"

if ($resposta -eq "s" -or $resposta -eq "S") {
    Write-Host "[START] Iniciando Backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\iniciar-backend-local.ps1"
    
    Start-Sleep -Seconds 3
    
    Write-Host "[START] Iniciando Frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\iniciar-frontend-local.ps1"
    
    Write-Host ""
    Write-Host "[OK] Servidores iniciados em janelas separadas!" -ForegroundColor Green
    Write-Host "[INFO] Aguarde alguns segundos para os servidores iniciarem..." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Execute os comandos manualmente conforme instrucoes acima." -ForegroundColor Yellow
}
