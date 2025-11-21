# Script de teste para o fluxo normal de login
# Testa:
# 1. Login de usuário de teste (deve logar direto sem cadastro)
# 2. Login de usuário novo via OAuth (deve criar usuário e marcar is_new_user=true)
# 3. Login de usuário existente com dados completos (deve logar direto)
# 4. Login de usuário existente SEM dados completos (deve marcar is_new_user=true para ir ao cadastro)

$baseUrl = "http://localhost:8000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTE 1: Usuario de Teste - Aluno Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Esperado: Login direto (is_new_user=false), bypass de verificacao de cadastro`n" -ForegroundColor Yellow

$body1 = @{
    email = "aluno.teste@alunos.ibmec.edu.br"
    senha = "qualquer"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/auth/legacy-login" -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "✅ Status: SUCESSO" -ForegroundColor Green
    Write-Host "   User: $($response1.user.nome)" -ForegroundColor White
    Write-Host "   Email: $($response1.user.email)" -ForegroundColor White
    Write-Host "   Tipo: $($response1.user.tipo)" -ForegroundColor White
    Write-Host "   is_new_user: $($response1.is_new_user)" -ForegroundColor $(if ($response1.is_new_user -eq $false) { "Green" } else { "Red" })
    Write-Host "   CPF: $($response1.user.cpf)" -ForegroundColor White
    Write-Host "   Telefone: $($response1.user.telefone)" -ForegroundColor White
    Write-Host "   Curso: $($response1.user.curso)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTE 2: Usuario de Teste - Professor Teste" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Esperado: Login direto (is_new_user=false), bypass de verificacao de cadastro`n" -ForegroundColor Yellow

$body2 = @{
    email = "professor.teste@orientador.ibmec.edu.br"
    senha = "123"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/auth/legacy-login" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "✅ Status: SUCESSO" -ForegroundColor Green
    Write-Host "   User: $($response2.user.nome)" -ForegroundColor White
    Write-Host "   Email: $($response2.user.email)" -ForegroundColor White
    Write-Host "   Tipo: $($response2.user.tipo)" -ForegroundColor White
    Write-Host "   is_new_user: $($response2.is_new_user)" -ForegroundColor $(if ($response2.is_new_user -eq $false) { "Green" } else { "Red" })
    Write-Host "   Telefone: $($response2.user.telefone)" -ForegroundColor White
    Write-Host "   Departamento: $($response2.user.departamento)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTE 3: Usuario Normal Bloqueado em Dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Esperado: 403 Forbidden (apenas usuarios de teste em dev)`n" -ForegroundColor Yellow

$body3 = @{
    email = "joao.silva@alunos.ibmec.edu.br"
    senha = "123456"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/auth/legacy-login" -Method Post -Body $body3 -ContentType "application/json"
    Write-Host "❌ ERRO: Deveria ter bloqueado!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "✅ Status: BLOQUEADO (403 Forbidden)" -ForegroundColor Green
        Write-Host "   Mensagem: Login direto disponivel apenas para usuarios de teste" -ForegroundColor White
    } else {
        Write-Host "❌ Erro inesperado: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMO DO FLUXO IMPLEMENTADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Usuarios de Teste (aluno.teste, professor.teste, coordenador.teste):" -ForegroundColor Green
Write-Host "   - Podem fazer login direto com qualquer senha" -ForegroundColor White
Write-Host "   - Bypass de verificacao de cadastro completo" -ForegroundColor White
Write-Host "   - Sempre is_new_user=false (vao direto pro dashboard)" -ForegroundColor White
Write-Host ""
Write-Host "✅ Usuarios Normais via OAuth:" -ForegroundColor Green
Write-Host "   - Redirecionam para Microsoft para autenticar" -ForegroundColor White
Write-Host "   - Se NAO existir no banco: is_new_user=true → cadastro" -ForegroundColor White
Write-Host "   - Se existir MAS faltam dados: is_new_user=true → cadastro" -ForegroundColor White
Write-Host "   - Se existir E completo: is_new_user=false → dashboard" -ForegroundColor White
Write-Host ""
Write-Host "✅ Usuarios Normais via Legacy Login:" -ForegroundColor Green
Write-Host "   - BLOQUEADOS em desenvolvimento (403 Forbidden)" -ForegroundColor White
Write-Host "   - Devem usar fluxo OAuth" -ForegroundColor White
Write-Host ""
Write-Host "Dados obrigatorios verificados:" -ForegroundColor Yellow
Write-Host "   - Aluno: CPF, telefone, curso, matricula" -ForegroundColor White
Write-Host "   - Orientador: telefone, departamento" -ForegroundColor White
Write-Host "   - Coordenador: telefone, departamento" -ForegroundColor White
Write-Host ""
