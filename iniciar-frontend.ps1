# Script para iniciar o frontend
Write-Host "🚀 Iniciando Frontend na porta 3000..." -ForegroundColor Green

cd frontend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
    npm install
}

npm run dev -- --port 3000 --host
