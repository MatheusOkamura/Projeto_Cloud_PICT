# Script de Inicialização - Windows PowerShell
# Execute: .\start.ps1

Write-Host "🚀 Iniciando Sistema de Iniciação Científica Ibmec..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o backend existe
if (-Not (Test-Path "backend\main.py")) {
    Write-Host "❌ Erro: Pasta backend não encontrada!" -ForegroundColor Red
    exit 1
}

# Verificar se o frontend existe
if (-Not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Erro: Pasta frontend não encontrada!" -ForegroundColor Red
    exit 1
}

# Iniciar Backend
Write-Host "🔌 Iniciando Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '🔌 BACKEND - FastAPI' -ForegroundColor Green; " +
    "cd backend; " +
    "if (Test-Path 'venv\Scripts\activate.ps1') { .\venv\Scripts\activate } else { Write-Host '⚠️ Ambiente virtual não encontrado. Execute: python -m venv venv' -ForegroundColor Yellow }; " +
    "python main.py"

# Aguardar backend iniciar
Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar Frontend
Write-Host "🌐 Iniciando Frontend (React + Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Write-Host '🌐 FRONTEND - React' -ForegroundColor Blue; " +
    "cd frontend; " +
    "if (Test-Path 'node_modules') { npm run dev } else { Write-Host '⚠️ Dependências não instaladas. Execute: npm install' -ForegroundColor Yellow; npm install; npm run dev }"

# Mensagem de sucesso
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "✅ Aplicação iniciada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs de Acesso:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   🔌 Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   📚 API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Credenciais de Teste:" -ForegroundColor Cyan
Write-Host "   👨‍🎓 Aluno:       aluno@ibmec.edu.br" -ForegroundColor White
Write-Host "   👨‍🏫 Orientador:  orientador@ibmec.edu.br" -ForegroundColor White
Write-Host "   👨‍💼 Coordenador: coordenador@ibmec.edu.br" -ForegroundColor White
Write-Host "   🔐 Senha:       qualquer valor" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Para parar os serviços, feche as janelas do PowerShell ou execute: .\stop.ps1" -ForegroundColor Yellow
