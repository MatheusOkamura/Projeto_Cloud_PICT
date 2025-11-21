# Iniciar Frontend Localmente
Write-Host "[FRONTEND] Iniciando servidor local..." -ForegroundColor Cyan

# Ir para pasta do frontend
Set-Location frontend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "[NPM] Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar servidor de desenvolvimento
Write-Host ""
Write-Host "[OK] Iniciando Vite..." -ForegroundColor Green
Write-Host "[INFO] Frontend rodando em: http://localhost:5173" -ForegroundColor Cyan
Write-Host "[INFO] Conectando ao backend em: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "[AVISO] Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Rodar servidor
npm run dev
