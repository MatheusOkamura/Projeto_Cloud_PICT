# ====================================
# Script: Obter Publish Profile e Configurar no GitHub
# ====================================

$appName = "pictback-bzakbsfgc6bgcjcc"
$resourceGroup = "pict-ibmec-rg"
$outputFile = "publish-profile.xml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Obtendo Publish Profile do Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ====================================
# 1. Obter Publish Profile
# ====================================
Write-Host "📥 1. Baixando publish profile..." -ForegroundColor Yellow

try {
    az webapp deployment list-publishing-profiles `
        --name $appName `
        --resource-group $resourceGroup `
        --xml `
        --output none `
        > $outputFile
    
    if (Test-Path $outputFile) {
        $fileSize = (Get-Item $outputFile).Length
        if ($fileSize -gt 0) {
            Write-Host "   ✅ Publish profile obtido com sucesso!" -ForegroundColor Green
            Write-Host "   📄 Arquivo: $outputFile ($(($fileSize/1KB).ToString('0.00')) KB)" -ForegroundColor Gray
        } else {
            Write-Host "   ❌ Arquivo vazio!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ❌ Falha ao obter publish profile!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
    exit 1
}

# ====================================
# 2. Ler conteúdo do arquivo
# ====================================
Write-Host ""
Write-Host "📖 2. Lendo conteúdo..." -ForegroundColor Yellow

$publishProfile = Get-Content $outputFile -Raw

if ([string]::IsNullOrWhiteSpace($publishProfile)) {
    Write-Host "   ❌ Conteúdo vazio!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Conteúdo lido ($(($publishProfile.Length/1KB).ToString('0.00')) KB)" -ForegroundColor Green

# ====================================
# 3. Mostrar instruções para GitHub
# ====================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 PRÓXIMOS PASSOS - GitHub Secret" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Acesse: " -NoNewline -ForegroundColor White
Write-Host "https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣  Clique em: " -NoNewline -ForegroundColor White
Write-Host "New repository secret" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣  Configure:" -ForegroundColor White
Write-Host "   Name: " -NoNewline -ForegroundColor Gray
Write-Host "AZURE_WEBAPP_PUBLISH_PROFILE" -ForegroundColor Green
Write-Host ""

Write-Host "4️⃣  Cole o conteúdo abaixo no campo " -NoNewline -ForegroundColor White
Write-Host "Secret" -NoNewline -ForegroundColor Yellow
Write-Host ":" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor DarkGray
Write-Host $publishProfile -ForegroundColor White
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""

Write-Host "5️⃣  Clique em: " -NoNewline -ForegroundColor White
Write-Host "Add secret" -ForegroundColor Green
Write-Host ""

# ====================================
# 4. Copiar para clipboard (opcional)
# ====================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "💾 Opções Adicionais" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$copyToClipboard = Read-Host "Copiar publish profile para área de transferência? (S/N)"

if ($copyToClipboard -eq "S" -or $copyToClipboard -eq "s") {
    try {
        $publishProfile | Set-Clipboard
        Write-Host "   ✅ Copiado para área de transferência!" -ForegroundColor Green
        Write-Host "   📋 Agora basta colar (Ctrl+V) no GitHub" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Não foi possível copiar automaticamente" -ForegroundColor Yellow
        Write-Host "   📄 Use o conteúdo exibido acima" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Processo Completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Arquivo salvo em: " -NoNewline -ForegroundColor Gray
Write-Host "$((Get-Location).Path)\$outputFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Delete o arquivo após configurar o secret:" -ForegroundColor Yellow
Write-Host "   Remove-Item $outputFile" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Após adicionar o secret, faça um novo push para ativar o deploy:" -ForegroundColor Cyan
Write-Host "   git commit --allow-empty -m 'chore: trigger deploy'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
