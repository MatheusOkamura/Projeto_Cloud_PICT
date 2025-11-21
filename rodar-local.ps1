# Script para rodar o projeto localmente
# Backend: localhost:8000
# Frontend: localhost:3000

Write-Host "🚀 Iniciando Projeto de Iniciação Científica Localmente" -ForegroundColor Green
Write-Host "=" -NoNewline; Write-Host ("=" * 60) -ForegroundColor Green
Write-Host ""

# Verificar se Python está instalado
Write-Host "🔍 Verificando Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python não encontrado! Instale Python 3.9+ antes de continuar." -ForegroundColor Red
    exit 1
}

# Verificar se Node.js está instalado
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado! Instale Node.js 18+ antes de continuar." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Preparando ambiente..." -ForegroundColor Yellow

# Verificar se o ambiente virtual existe
$venvPath = ".\backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "⚠️  Ambiente virtual não encontrado. Criando..." -ForegroundColor Yellow
    python -m venv $venvPath
    Write-Host "✅ Ambiente virtual criado!" -ForegroundColor Green
}

# Verificar se as dependências do Python estão instaladas
Write-Host "🔍 Verificando dependências do backend..." -ForegroundColor Cyan
& "$venvPath\Scripts\python.exe" -c "import fastapi" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
    & "$venvPath\Scripts\pip.exe" install -r .\backend\requirements.txt
    Write-Host "✅ Dependências do backend instaladas!" -ForegroundColor Green
}

# Verificar se o banco de dados existe
$dbPath = ".\backend\iniciacao_cientifica.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "🗄️  Banco de dados não encontrado. Inicializando..." -ForegroundColor Yellow
    Push-Location backend
    & "..\backend\venv\Scripts\python.exe" init_db.py
    Pop-Location
    Write-Host "✅ Banco de dados inicializado!" -ForegroundColor Green
}

# Verificar se node_modules existe
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "✅ Dependências do frontend instaladas!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Iniciando servidores..." -ForegroundColor Green
Write-Host ""

# Função para iniciar o backend
$backendJob = Start-Job -ScriptBlock {
    param($projectPath)
    Set-Location $projectPath
    Set-Location backend
    & ".\venv\Scripts\Activate.ps1"
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
} -ArgumentList (Get-Location).Path

# Aguardar um pouco para o backend iniciar
Start-Sleep -Seconds 3

# Função para iniciar o frontend
$frontendJob = Start-Job -ScriptBlock {
    param($projectPath)
    Set-Location $projectPath
    Set-Location frontend
    npm run dev -- --port 3000 --host
} -ArgumentList (Get-Location).Path

Write-Host "✅ Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "✅ Frontend iniciado (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host "   Para ver logs do backend:  Receive-Job $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "   Para ver logs do frontend: Receive-Job $($frontendJob.Id) -Keep" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  Para parar os servidores:" -ForegroundColor Yellow
Write-Host "   Stop-Job $($backendJob.Id); Stop-Job $($frontendJob.Id)" -ForegroundColor White
Write-Host "   Remove-Job $($backendJob.Id); Remove-Job $($frontendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "Ou simplesmente feche este terminal." -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione Ctrl+C para sair e parar os servidores..." -ForegroundColor Yellow

# Manter o script rodando e mostrar logs
try {
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Verificar se os jobs ainda estão rodando
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Backend falhou!" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Frontend falhou!" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Parando servidores..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servidores parados!" -ForegroundColor Green
}
