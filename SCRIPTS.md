# 🚀 Scripts de Inicialização Rápida

## Windows PowerShell

### Iniciar Frontend e Backend Simultaneamente

```powershell
# Criar arquivo start.ps1 na raiz do projeto
# E executar: .\start.ps1

# Conteúdo do start.ps1:

# Inicia o Backend em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python main.py"

# Aguarda 3 segundos para o backend iniciar
Start-Sleep -Seconds 3

# Inicia o Frontend em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ Aplicação iniciada!"
Write-Host "🌐 Frontend: http://localhost:3000"
Write-Host "🔌 Backend: http://localhost:8000"
Write-Host "📚 API Docs: http://localhost:8000/docs"
```

### Parar Todos os Serviços

```powershell
# Criar arquivo stop.ps1 na raiz do projeto

# Para processos na porta 3000 (Frontend)
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) {
    Stop-Process -Id $frontend.OwningProcess -Force
    Write-Host "❌ Frontend parado"
}

# Para processos na porta 8000 (Backend)
$backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backend) {
    Stop-Process -Id $backend.OwningProcess -Force
    Write-Host "❌ Backend parado"
}

Write-Host "✅ Todos os serviços foram parados"
```

## Linux/Mac (Bash)

### Iniciar Frontend e Backend

```bash
#!/bin/bash
# Criar arquivo start.sh na raiz do projeto
# Dar permissão: chmod +x start.sh
# Executar: ./start.sh

# Inicia o Backend
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

# Aguarda 3 segundos
sleep 3

# Inicia o Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Aplicação iniciada!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Para parar: kill $BACKEND_PID $FRONTEND_PID"
```

## Docker (Futuro)

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/ibmec_ic
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ibmec_ic
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## NPM Scripts Personalizados

### Frontend (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "format": "prettier --write \"src/**/*.{js,jsx,css}\""
  }
}
```

## Comandos Úteis

### Verificar portas em uso
```powershell
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :3000
lsof -i :8000
```

### Limpar cache e reinstalar
```powershell
# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Backend
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Variáveis de Ambiente

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_ENV=development
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/ibmec_ic
SECRET_KEY=sua-chave-secreta-aqui
```
