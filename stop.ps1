# Script para Parar Serviços - Windows PowerShell
# Execute: .\stop.ps1

Write-Host "🛑 Parando Sistema de Iniciação Científica Ibmec..." -ForegroundColor Red
Write-Host ""

# Função para matar processo na porta
function Stop-ProcessOnPort {
    param($Port, $Name)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $connection.OwningProcess -Force
                Write-Host "✅ $Name parado (porta $Port)" -ForegroundColor Green
            }
        } else {
            Write-Host "ℹ️  Nenhum processo rodando na porta $Port" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️  Erro ao parar $Name : $_" -ForegroundColor Yellow
    }
}

# Parar Frontend (porta 3000)
Stop-ProcessOnPort -Port 3000 -Name "Frontend"

# Parar Backend (porta 8000)
Stop-ProcessOnPort -Port 8000 -Name "Backend"

# Parar possíveis processos do Vite
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*vite*"
} | Stop-Process -Force

# Parar possíveis processos do Python
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*backend*"
} | Stop-Process -Force

Write-Host ""
Write-Host "✅ Todos os serviços foram parados!" -ForegroundColor Green
Write-Host ""
