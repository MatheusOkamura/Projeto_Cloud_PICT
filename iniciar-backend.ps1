# Script para iniciar o backend
Write-Host "🚀 Iniciando Backend na porta 8000..." -ForegroundColor Green

cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
