# Script PowerShell para atualizar URLs da API nos arquivos do frontend
# Execute este script na pasta frontend

$arquivos = @(
    "src\pages\DashboardOrientador.jsx",
    "src\pages\DashboardAluno.jsx",
    "src\pages\DashboardCoordenador.jsx",
    "src\pages\EnviarRelatorioParcial.jsx",
    "src\pages\EnviarArtigoFinal.jsx",
    "src\pages\EnviarApresentacaoAmostra.jsx",
    "src\pages\CompletarCadastro.jsx",
    "src\pages\AuthCallback.jsx"
)

foreach ($arquivo in $arquivos) {
    $caminhoCompleto = Join-Path $PSScriptRoot $arquivo
    
    if (Test-Path $caminhoCompleto) {
        Write-Host "Processando: $arquivo" -ForegroundColor Yellow
        
        $conteudo = Get-Content $caminhoCompleto -Raw -Encoding UTF8
        $modificado = $false
        
        # Adicionar import se não existir
        if ($conteudo -notmatch "import API_BASE_URL from") {
            $conteudo = $conteudo -replace "(import .+ from .+;)\n", "`$1`nimport API_BASE_URL from '../config/api';`n"
            $modificado = $true
            Write-Host "  ✓ Import adicionado" -ForegroundColor Green
        }
        
        # Substituir URLs hardcoded
        $padrao = "http://localhost:8000/api"
        if ($conteudo -match [regex]::Escape($padrao)) {
            $conteudo = $conteudo -replace "'http://localhost:8000/api/", '`${API_BASE_URL}/'
            $conteudo = $conteudo -replace "`"http://localhost:8000/api/", '`${API_BASE_URL}/'
            $conteudo = $conteudo -replace "``http://localhost:8000/api/", '`${API_BASE_URL}/'
            
            # Corrigir template strings
            $conteudo = $conteudo -replace "```\$\{API_BASE_URL\}/([^'`"]+)'", '`${API_BASE_URL}/$1`'
            $conteudo = $conteudo -replace "```\$\{API_BASE_URL\}/([^'`"]+)`"", '`${API_BASE_URL}/$1`'
            
            $modificado = $true
            Write-Host "  ✓ URLs atualizadas" -ForegroundColor Green
        }
        
        if ($modificado) {
            Set-Content -Path $caminhoCompleto -Value $conteudo -Encoding UTF8 -NoNewline
            Write-Host "  ✓ Arquivo salvo" -ForegroundColor Green
        } else {
            Write-Host "  - Sem alterações necessárias" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ Arquivo não encontrado: $arquivo" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Concluído!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Revise as alterações nos arquivos"
Write-Host "2. Execute 'npm run build' para testar o build"
Write-Host "3. Faça commit e push para o Azure"
