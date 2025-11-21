# Iniciar Backend Localmente
Write-Host "[BACKEND] Iniciando servidor local..." -ForegroundColor Cyan

# Ir para pasta do backend
Set-Location backend

# Verificar se o ambiente virtual existe
if (-not (Test-Path "venv")) {
    Write-Host "[VENV] Criando ambiente virtual Python..." -ForegroundColor Yellow
    python -m venv venv
}

# Ativar ambiente virtual
Write-Host "[VENV] Ativando ambiente virtual..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Instalar dependencias
Write-Host "[INSTALL] Instalando dependencias..." -ForegroundColor Yellow
pip install -r requirements.txt

# Verificar se o banco de dados existe
if (-not (Test-Path "iniciacao_cientifica.db")) {
    Write-Host "[DB] Inicializando banco de dados..." -ForegroundColor Yellow
    python init_db.py
}

# Iniciar servidor
Write-Host ""
Write-Host "[OK] Iniciando FastAPI..." -ForegroundColor Green
Write-Host "[INFO] Backend rodando em: http://localhost:8000" -ForegroundColor Cyan
Write-Host "[INFO] Documentacao da API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "[AVISO] Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

# Rodar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
