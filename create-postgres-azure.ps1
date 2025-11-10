# Script para criar Azure Database for PostgreSQL Flexible Server
# Para o projeto de Iniciação Científica Ibmec

# Variáveis de configuração
$RESOURCE_GROUP = "PICTIBMEC"
$LOCATION = "eastus"
$SERVER_NAME = "pict-ibmec-postgres"  # Deve ser único globalmente
$ADMIN_USER = "pictadmin"
$ADMIN_PASSWORD = ""  # Será solicitado interativamente
$DATABASE_NAME = "iniciacao_cientifica"
$SKU_NAME = "Standard_B1ms"  # Burstable tier - adequado para estudantes
$STORAGE_SIZE = 32  # GB
$VERSION = "16"  # PostgreSQL 16

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criação do Azure Database for PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar senha do administrador
if ([string]::IsNullOrEmpty($ADMIN_PASSWORD)) {
    $securePassword = Read-Host "Digite a senha do administrador do banco (mínimo 8 caracteres)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $ADMIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host "1. Criando servidor PostgreSQL Flexible Server..." -ForegroundColor Yellow

# Criar o servidor PostgreSQL
az postgres flexible-server create `
    --resource-group $RESOURCE_GROUP `
    --name $SERVER_NAME `
    --location $LOCATION `
    --admin-user $ADMIN_USER `
    --admin-password $ADMIN_PASSWORD `
    --sku-name $SKU_NAME `
    --tier Burstable `
    --storage-size $STORAGE_SIZE `
    --version $VERSION `
    --public-access 0.0.0.0-255.255.255.255 `
    --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Servidor PostgreSQL criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao criar servidor PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Criando banco de dados '$DATABASE_NAME'..." -ForegroundColor Yellow

# Criar o banco de dados
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $SERVER_NAME `
    --database-name $DATABASE_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Banco de dados criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao criar banco de dados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Obtendo string de conexão..." -ForegroundColor Yellow

# Obter a string de conexão
$connectionString = az postgres flexible-server show-connection-string `
    --server-name $SERVER_NAME `
    --database-name $DATABASE_NAME `
    --admin-user $ADMIN_USER `
    --admin-password $ADMIN_PASSWORD `
    --query "connectionStrings.psql_cmd" `
    --output tsv

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Banco de dados criado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Detalhes da conexão:" -ForegroundColor Cyan
Write-Host "Servidor: $SERVER_NAME.postgres.database.azure.com" -ForegroundColor White
Write-Host "Usuário: $ADMIN_USER" -ForegroundColor White
Write-Host "Banco de dados: $DATABASE_NAME" -ForegroundColor White
Write-Host ""
Write-Host "String de conexão para o .env:" -ForegroundColor Cyan
$dbUrl = "postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com/${DATABASE_NAME}?sslmode=require"
Write-Host "DATABASE_URL=$dbUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Adicione esta string ao arquivo .env do backend!" -ForegroundColor Red
Write-Host ""

# Salvar configurações em arquivo
$configFile = ".\backend\postgres-config.txt"
@"
Azure PostgreSQL Configuration
==============================
Server: $SERVER_NAME.postgres.database.azure.com
Admin User: $ADMIN_USER
Database: $DATABASE_NAME
Location: $LOCATION

Connection String (adicione ao .env):
DATABASE_URL=postgresql://${ADMIN_USER}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com/${DATABASE_NAME}?sslmode=require

Data: $(Get-Date)
"@ | Out-File -FilePath $configFile -Encoding UTF8

Write-Host "Configurações salvas em: $configFile" -ForegroundColor Green
