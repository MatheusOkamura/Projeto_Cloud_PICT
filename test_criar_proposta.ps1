# Script para criar uma proposta de teste para o orientador avaliar
$baseUrl = "http://localhost:8000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTE: Criar Proposta para Avaliação" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se aluno teste existe
Write-Host "1️⃣  Verificando usuário aluno teste..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "aluno.teste@alunos.ibmec.edu.br"
        senha = "senha123"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/legacy-login" `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $loginBody
    
    $alunoId = $response.user.id
    Write-Host "   ✅ Aluno encontrado: $($response.user.nome) (ID: $alunoId)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao buscar aluno: $_" -ForegroundColor Red
    exit 1
}

# 2. Verificar se orientador teste existe
Write-Host "`n2️⃣  Verificando usuário orientador teste..." -ForegroundColor Yellow
try {
    $loginOrientador = @{
        email = "orientador.teste@orientador.ibmec.edu.br"
        senha = "senha123"
    }
    
    $responseOrientador = Invoke-RestMethod -Uri "$baseUrl/auth/legacy-login" `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $loginOrientador
    
    $orientadorId = $responseOrientador.user.id
    Write-Host "   ✅ Orientador encontrado: $($responseOrientador.user.nome) (ID: $orientadorId)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao buscar orientador: $_" -ForegroundColor Red
    exit 1
}

# 3. Criar proposta
Write-Host "`n3️⃣  Criando proposta de teste..." -ForegroundColor Yellow

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"usuario_id`"$LF",
    $alunoId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"titulo_projeto`"$LF",
    "Desenvolvimento de Sistema Web para Gerenciamento de Projetos de Iniciação Científica",
    "--$boundary",
    "Content-Disposition: form-data; name=`"area_conhecimento`"$LF",
    "Ciência da Computação",
    "--$boundary",
    "Content-Disposition: form-data; name=`"orientador_id`"$LF",
    $orientadorId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"descricao`"$LF",
    "Este projeto visa desenvolver uma plataforma web completa para gerenciamento de projetos de iniciação científica, permitindo que alunos, orientadores e coordenadores possam acompanhar o desenvolvimento dos projetos de forma integrada e eficiente.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"objetivos`"$LF",
    "1. Criar uma interface intuitiva para submissão de propostas`n2. Implementar sistema de aprovação em duas etapas`n3. Desenvolver dashboards específicos para cada tipo de usuário`n4. Garantir segurança e autenticação robusta",
    "--$boundary",
    "Content-Disposition: form-data; name=`"metodologia`"$LF",
    "O projeto será desenvolvido utilizando React no frontend e FastAPI no backend. Será adotada metodologia ágil com sprints de 2 semanas. Testes automatizados garantirão a qualidade do código.",
    "--$boundary",
    "Content-Disposition: form-data; name=`"resultados_esperados`"$LF",
    "Espera-se ao final do projeto ter uma plataforma funcional, testada e documentada, capaz de gerenciar todo o fluxo de projetos de iniciação científica, desde a submissão até a conclusão.",
    "--$boundary--$LF"
)

$bodyString = $bodyLines -join $LF

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/inscricoes/proposta" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyString
    
    Write-Host "   ✅ Proposta criada com sucesso!" -ForegroundColor Green
    Write-Host "   ID da proposta: $($response.proposta_id)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "   Data de submissão: $($response.data_submissao)" -ForegroundColor Cyan
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "   ✅ PROPOSTA CRIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Faça login como orientador teste" -ForegroundColor White
    Write-Host "   2. Acesse o Dashboard do Orientador" -ForegroundColor White
    Write-Host "   3. Vá na aba 'Propostas Pendentes'" -ForegroundColor White
    Write-Host "   4. Avalie a proposta criada`n" -ForegroundColor White
    
} catch {
    Write-Host "   ❌ Erro ao criar proposta: $_" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Red
}
