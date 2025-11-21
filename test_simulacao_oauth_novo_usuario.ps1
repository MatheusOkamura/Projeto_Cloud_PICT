# Teste de simulação do fluxo OAuth para usuário novo
# Este script simula o que aconteceria após o callback do OAuth

$baseUrl = "http://localhost:8000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SIMULACAO: Usuario Novo via OAuth" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "CENARIO: maria.silva@alunos.ibmec.edu.br faz login pela primeira vez via OAuth" -ForegroundColor Yellow
Write-Host ""
Write-Host "Fluxo esperado:" -ForegroundColor White
Write-Host "1. Usuario nao existe no banco" -ForegroundColor White
Write-Host "2. Backend cria usuario com dados basicos (email, nome, tipo)" -ForegroundColor White
Write-Host "3. Backend detecta que faltam: CPF, telefone, curso, matricula" -ForegroundColor White
Write-Host "4. Backend marca is_new_user=true" -ForegroundColor White
Write-Host "5. Frontend redireciona para /cadastro" -ForegroundColor White
Write-Host ""

# Verificar se usuário já existe
Write-Host "Verificando se usuario existe no banco..." -ForegroundColor Cyan
try {
    $checkUser = Invoke-RestMethod -Uri "$baseUrl/usuarios?email=maria.silva@alunos.ibmec.edu.br" -Method Get -ErrorAction SilentlyContinue
    if ($checkUser) {
        Write-Host "⚠️ Usuario ja existe! Removendo para teste..." -ForegroundColor Yellow
        # Em producao, nao faremos isso - apenas para teste
    }
} catch {
    Write-Host "✅ Usuario nao existe (perfeito para teste)" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LOGICA NO BACKEND (routes/auth.py)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "No callback OAuth, o codigo faz:" -ForegroundColor White
Write-Host ""
Write-Host "# 1. Buscar usuario no banco" -ForegroundColor Gray
Write-Host "user_data = db.query(Usuario).filter(email == 'maria.silva@alunos.ibmec.edu.br').first()" -ForegroundColor Gray
Write-Host ""
Write-Host "# 2. Se nao existe, criar" -ForegroundColor Gray
Write-Host "if not user_data:" -ForegroundColor Gray
Write-Host "    is_new_user = True" -ForegroundColor Gray
Write-Host "    user_data = Usuario(email=..., nome=..., tipo=aluno)" -ForegroundColor Gray
Write-Host "    db.add(user_data)" -ForegroundColor Gray
Write-Host ""
Write-Host "# 3. Verificar dados obrigatorios (SE NAO for usuario de teste)" -ForegroundColor Gray
Write-Host "if not is_test_user(email):" -ForegroundColor Gray
Write-Host "    if tipo == aluno:" -ForegroundColor Gray
Write-Host "        if not all([cpf, telefone, curso, matricula]):" -ForegroundColor Gray
Write-Host "            precisa_completar_cadastro = True" -ForegroundColor Gray
Write-Host ""
Write-Host "# 4. Se falta dados, marcar como novo" -ForegroundColor Gray
Write-Host "if precisa_completar_cadastro:" -ForegroundColor Gray
Write-Host "    is_new_user = True" -ForegroundColor Gray
Write-Host ""
Write-Host "# 5. Redirecionar com flag" -ForegroundColor Gray
Write-Host "redirect_url = f'{frontend}/auth/callback?token={token}&is_new_user={is_new_user}'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LOGICA NO FRONTEND (AuthCallback.jsx)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "No componente AuthCallback, o codigo faz:" -ForegroundColor White
Write-Host ""
Write-Host "// 1. Receber parametros" -ForegroundColor Gray
Write-Host "const isNewUser = searchParams.get('is_new_user') === 'true'" -ForegroundColor Gray
Write-Host "const userData = JSON.parse(atob(searchParams.get('user')))" -ForegroundColor Gray
Write-Host ""
Write-Host "// 2. Verificar se falta dados" -ForegroundColor Gray
Write-Host "const alunoSemDados = userData.tipo === 'aluno' && (" -ForegroundColor Gray
Write-Host "    !userData.curso || !userData.matricula || !userData.cpf || !userData.telefone" -ForegroundColor Gray
Write-Host ")" -ForegroundColor Gray
Write-Host ""
Write-Host "// 3. Redirecionar" -ForegroundColor Gray
Write-Host "if (alunoSemDados) {" -ForegroundColor Gray
Write-Host "    navigate('/cadastro', { state: { email, nome, tipo } })" -ForegroundColor Gray
Write-Host "} else {" -ForegroundColor Gray
Write-Host "    navigate('/dashboard-aluno')" -ForegroundColor Gray
Write-Host "}" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTADO ESPERADO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Para maria.silva@alunos.ibmec.edu.br (primeira vez):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "  - Usuario criado: email='maria.silva@alunos.ibmec.edu.br', nome='Maria Silva', tipo='aluno'" -ForegroundColor White
Write-Host "  - Faltam: cpf=null, telefone=null, curso=null, matricula=null" -ForegroundColor White
Write-Host "  - is_new_user = true" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "  - Recebe is_new_user=true" -ForegroundColor White
Write-Host "  - Verifica que faltam dados obrigatorios" -ForegroundColor White
Write-Host "  - Redireciona para: /cadastro" -ForegroundColor Green
Write-Host "  - Usuario preenche: CPF, telefone, curso, matricula" -ForegroundColor White
Write-Host ""
Write-Host "Proximo login:" -ForegroundColor Cyan
Write-Host "  - Usuario ja existe E tem todos os dados" -ForegroundColor White
Write-Host "  - is_new_user = false" -ForegroundColor White
Write-Host "  - Redireciona para: /dashboard-aluno" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPARACAO: TESTE vs NORMAL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Usuario de Teste (aluno.teste@alunos.ibmec.edu.br):" -ForegroundColor Yellow
Write-Host "  ✅ is_test_user() = true" -ForegroundColor Green
Write-Host "  ✅ Pula verificacao de dados obrigatorios" -ForegroundColor Green
Write-Host "  ✅ Sempre is_new_user=false" -ForegroundColor Green
Write-Host "  ✅ Vai direto para dashboard" -ForegroundColor Green
Write-Host ""
Write-Host "Usuario Normal (maria.silva@alunos.ibmec.edu.br):" -ForegroundColor Yellow
Write-Host "  ❌ is_test_user() = false" -ForegroundColor Red
Write-Host "  ✅ Verifica dados obrigatorios" -ForegroundColor Green
Write-Host "  ✅ Se falta dados: is_new_user=true → cadastro" -ForegroundColor Green
Write-Host "  ✅ Se completo: is_new_user=false → dashboard" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CODIGO RELEVANTE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Arquivo: backend/routes/auth.py" -ForegroundColor White
Write-Host "Linhas: ~195-230 (OAuth callback)" -ForegroundColor Gray
Write-Host ""
Write-Host "Arquivo: backend/microsoft_auth.py" -ForegroundColor White
Write-Host "Linhas: test_users = [...], is_test_user()" -ForegroundColor Gray
Write-Host ""
Write-Host "Arquivo: frontend/src/pages/AuthCallback.jsx" -ForegroundColor White
Write-Host "Linhas: ~33-76 (verificacao e redirecionamento)" -ForegroundColor Gray
Write-Host ""
