# Script para criar usuarios de teste para cada perfil

Write-Host "Criando usuarios de teste..." -ForegroundColor Cyan

# Funcao para fazer login e criar usuario
function Test-Login {
    param(
        [string]$Email,
        [string]$Senha,
        [string]$Tipo
    )
    
    $body = @{
        email = $Email
        senha = $Senha
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/legacy-login' `
            -Method Post `
            -Body $body `
            -ContentType 'application/json'
        
        Write-Host "`n[$Tipo] Usuario criado/autenticado:" -ForegroundColor Green
        Write-Host "  Email: $($result.user.email)" -ForegroundColor Gray
        Write-Host "  Nome: $($result.user.nome)" -ForegroundColor Gray
        Write-Host "  Tipo: $($result.user.tipo)" -ForegroundColor Gray
        Write-Host "  ID: $($result.user.id)" -ForegroundColor Gray
        Write-Host "  Novo usuario: $($result.is_new_user)" -ForegroundColor Gray
        
        return $result
    } catch {
        Write-Host "`n[$Tipo] ERRO ao criar usuario" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Criar usuario ALUNO
Write-Host "`n=== ALUNO ===" -ForegroundColor Yellow
$aluno = Test-Login -Email "aluno.teste@alunos.ibmec.edu.br" -Senha "senha123" -Tipo "ALUNO"

# Criar usuario ORIENTADOR
Write-Host "`n=== ORIENTADOR ===" -ForegroundColor Yellow
$orientador = Test-Login -Email "orientador.teste@orientador.ibmec.edu.br" -Senha "senha123" -Tipo "ORIENTADOR"

# Criar usuario COORDENADOR
Write-Host "`n=== COORDENADOR ===" -ForegroundColor Yellow
$coordenador = Test-Login -Email "coordenador.teste@coordenador.ibmec.edu.br" -Senha "senha123" -Tipo "COORDENADOR"

# Resumo
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "USUARIOS DE TESTE CRIADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($aluno) {
    Write-Host "`nALUNO:" -ForegroundColor Green
    Write-Host "  Email: aluno.teste@alunos.ibmec.edu.br"
    Write-Host "  Senha: senha123"
    Write-Host "  Dashboard: http://localhost:5173/dashboard-aluno"
}

if ($orientador) {
    Write-Host "`nORIENTADOR:" -ForegroundColor Green
    Write-Host "  Email: orientador.teste@orientador.ibmec.edu.br"
    Write-Host "  Senha: senha123"
    Write-Host "  Dashboard: http://localhost:5173/dashboard-orientador"
}

if ($coordenador) {
    Write-Host "`nCOORDENADOR:" -ForegroundColor Green
    Write-Host "  Email: coordenador.teste@coordenador.ibmec.edu.br"
    Write-Host "  Senha: senha123"
    Write-Host "  Dashboard: http://localhost:5173/dashboard-coordenador"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Use estes usuarios para testar o sistema!" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
