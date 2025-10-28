# Script para testar o fluxo de aprovação em duas etapas
# Testa: Aluno → Orientador → Coordenador

$baseUrl = "http://localhost:8000/api/inscricoes"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTE: Fluxo de Aprovação" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se há propostas pendentes para orientador
Write-Host "1️⃣  Verificando propostas pendentes para orientador..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/orientador/1/pendentes" -Method GET
Write-Host "   Total de propostas: $($response.total)" -ForegroundColor Green

if ($response.total -gt 0) {
    $propostaId = $response.propostas[0].id
    Write-Host "   Proposta ID: $propostaId" -ForegroundColor Cyan
    Write-Host "   Título: $($response.propostas[0].titulo_projeto)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.propostas[0].status)" -ForegroundColor Cyan
    
    # 2. Orientador aprova a proposta
    Write-Host "`n2️⃣  Orientador avaliando proposta..." -ForegroundColor Yellow
    
    $bodyOrientador = @{
        aprovar = $true
        feedback = "Proposta aprovada pelo orientador. Excelente trabalho!"
    }
    
    try {
        $responseOrientador = Invoke-RestMethod -Uri "$baseUrl/$propostaId/orientador/avaliar" `
            -Method POST `
            -ContentType "application/x-www-form-urlencoded" `
            -Body $bodyOrientador
        
        Write-Host "   ✅ $($responseOrientador.message)" -ForegroundColor Green
        Write-Host "   Novo status: $($responseOrientador.status)" -ForegroundColor Cyan
        Write-Host "   Próxima etapa: $($responseOrientador.proxima_etapa)" -ForegroundColor Cyan
    } catch {
        Write-Host "   ❌ Erro: $_" -ForegroundColor Red
        exit 1
    }
    
    # 3. Verificar propostas pendentes para coordenador
    Write-Host "`n3️⃣  Verificando propostas pendentes para coordenador..." -ForegroundColor Yellow
    $responseCoordenador = Invoke-RestMethod -Uri "$baseUrl/coordenador/pendentes" -Method GET
    Write-Host "   Total de propostas: $($responseCoordenador.total)" -ForegroundColor Green
    
    if ($responseCoordenador.total -gt 0) {
        $propostaCoordenador = $responseCoordenador.propostas[0]
        Write-Host "   Proposta ID: $($propostaCoordenador.id)" -ForegroundColor Cyan
        Write-Host "   Status: $($propostaCoordenador.status)" -ForegroundColor Cyan
        Write-Host "   Feedback do orientador: $($propostaCoordenador.feedback_orientador)" -ForegroundColor Cyan
        
        # 4. Coordenador aprova a proposta
        Write-Host "`n4️⃣  Coordenador avaliando proposta..." -ForegroundColor Yellow
        
        $bodyCoordenador = @{
            aprovar = $true
            feedback = "Proposta aprovada pelo coordenador. Projeto criado!"
        }
        
        try {
            $responseFinal = Invoke-RestMethod -Uri "$baseUrl/$($propostaCoordenador.id)/coordenador/avaliar" `
                -Method POST `
                -ContentType "application/x-www-form-urlencoded" `
                -Body $bodyCoordenador
            
            Write-Host "   ✅ $($responseFinal.message)" -ForegroundColor Green
            Write-Host "   Novo status: $($responseFinal.status)" -ForegroundColor Cyan
            Write-Host "   Projeto criado: $($responseFinal.projeto_criado)" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Erro: $_" -ForegroundColor Red
            exit 1
        }
        
        # 5. Verificar detalhes da proposta final
        Write-Host "`n5️⃣  Verificando detalhes finais da proposta..." -ForegroundColor Yellow
        $detalhes = Invoke-RestMethod -Uri "$baseUrl/$($propostaCoordenador.id)" -Method GET
        
        Write-Host "   Status final: $($detalhes.status)" -ForegroundColor Green
        Write-Host "   Data de submissão: $($detalhes.data_submissao)" -ForegroundColor Cyan
        Write-Host "   Data de avaliação orientador: $($detalhes.data_avaliacao_orientador)" -ForegroundColor Cyan
        Write-Host "   Data de avaliação coordenador: $($detalhes.data_avaliacao_coordenador)" -ForegroundColor Cyan
        
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "   ✅ TESTE CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
    } else {
        Write-Host "   ⚠️  Nenhuma proposta pendente para coordenador" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "   ℹ️  Nenhuma proposta pendente para orientador" -ForegroundColor Yellow
    Write-Host "   Execute uma submissão de proposta primeiro`n" -ForegroundColor Yellow
}
