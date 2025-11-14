# Script para configurar GitHub Actions para deploy do backend
# Execute este script para criar o Service Principal e obter as credenciais

Write-Host "🔧 Configurando GitHub Actions para Deploy do Backend..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está logado no Azure
Write-Host "📋 Verificando login no Azure..." -ForegroundColor Yellow
$account = az account show 2>$null
if ($null -eq $account) {
    Write-Host "❌ Você não está logado no Azure!" -ForegroundColor Red
    Write-Host "Execute: az login" -ForegroundColor White
    exit 1
}

$accountInfo = $account | ConvertFrom-Json
Write-Host "✅ Logado como: $($accountInfo.user.name)" -ForegroundColor Green
Write-Host "   Subscription: $($accountInfo.name)" -ForegroundColor Gray
Write-Host ""

# 2. Criar Service Principal
Write-Host "🔐 Criando Service Principal para GitHub Actions..." -ForegroundColor Yellow
Write-Host "   Nome: github-actions-pictback" -ForegroundColor Gray
Write-Host "   Scope: Resource Group PICTIBMEC" -ForegroundColor Gray
Write-Host ""

$subscriptionId = $accountInfo.id

try {
    $credentials = az ad sp create-for-rbac `
        --name "github-actions-pictback" `
        --role contributor `
        --scopes "/subscriptions/$subscriptionId/resourceGroups/PICTIBMEC" `
        --sdk-auth 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao criar Service Principal!" -ForegroundColor Red
        Write-Host $credentials -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Service Principal criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    # 3. Exibir credenciais
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "📋 COPIE AS CREDENCIAIS ABAIXO:" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $credentials -ForegroundColor White
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    
    # 4. Salvar em arquivo temporário
    $tempFile = "$env:TEMP\azure-credentials-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    $credentials | Out-File -FilePath $tempFile -Encoding UTF8
    Write-Host "✅ Credenciais salvas em: $tempFile" -ForegroundColor Green
    Write-Host ""
    
    # 5. Copiar para clipboard
    $credentials | Set-Clipboard
    Write-Host "✅ Credenciais copiadas para a área de transferência!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    exit 1
}

# 6. Configurar comando de startup
Write-Host "⚙️ Configurando comando de startup no Azure App Service..." -ForegroundColor Yellow
az webapp config set `
    --resource-group PICTIBMEC `
    --name Pictback `
    --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind=0.0.0.0:8000 --timeout 600"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Comando de startup configurado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aviso: Não foi possível configurar o comando de startup automaticamente." -ForegroundColor Yellow
}
Write-Host ""

# 7. Instruções finais
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Vá até: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Clique em 'New repository secret'" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure o secret:" -ForegroundColor White
Write-Host "   Nome: AZURE_CREDENTIALS" -ForegroundColor Gray
Write-Host "   Valor: Cole o JSON que foi copiado (Ctrl+V)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Clique em 'Add secret'" -ForegroundColor White
Write-Host ""
Write-Host "5. Faça commit e push para testar:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Configure GitHub Actions'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Configuração concluída!" -ForegroundColor Green
Write-Host "📚 Mais detalhes em: CONFIGURAR_GITHUB_ACTIONS.md" -ForegroundColor Gray
