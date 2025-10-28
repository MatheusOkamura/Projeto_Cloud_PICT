# Teste simples de login
Write-Host "Testando API..." -ForegroundColor Cyan

# Teste 1: Health check
Write-Host "`nTeste 1: Health check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -Method Get
    Write-Host "OK - Backend rodando" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Backend nao acessivel" -ForegroundColor Red
    Write-Host "Execute: cd backend; uvicorn main:app --reload" -ForegroundColor Yellow
    exit 1
}

# Teste 2: Login
Write-Host "`nTeste 2: Login legado" -ForegroundColor Yellow
$body = @{
    email = 'aluno.teste@alunos.ibmec.edu.br'
    senha = 'senha123'
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/legacy-login' -Method Post -Body $body -ContentType 'application/json'
    Write-Host "OK - Login funcionando" -ForegroundColor Green
    Write-Host "Email: $($result.user.email)" -ForegroundColor Gray
    Write-Host "Nome: $($result.user.nome)" -ForegroundColor Gray
    Write-Host "Tipo: $($result.user.tipo)" -ForegroundColor Gray
} catch {
    Write-Host "ERRO - Login falhou" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nTeste concluido" -ForegroundColor Cyan
