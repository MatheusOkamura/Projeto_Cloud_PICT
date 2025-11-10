# Guia: Configuração do Azure Database for PostgreSQL

Este guia descreve como criar e configurar um banco de dados PostgreSQL no Azure para o projeto de Iniciação Científica IBMEC.

## 📋 Pré-requisitos

- Azure CLI instalado e configurado
- Assinatura Azure ativa (Azure for Students)
- Acesso ao Resource Group `PICTIBMEC`

## 🚀 Passo 1: Fazer Login no Azure CLI

```powershell
az login
```

Isso abrirá o navegador para autenticação. Use suas credenciais `@alunos.ibmec.edu.br`.

## 🗄️ Passo 2: Criar o Banco de Dados PostgreSQL

Execute o script PowerShell fornecido:

```powershell
.\create-postgres-azure.ps1
```

O script irá:
1. ✅ Criar um servidor PostgreSQL Flexible Server
2. ✅ Criar o banco de dados `iniciacao_cientifica`
3. ✅ Configurar firewall para acesso público (para desenvolvimento)
4. ✅ Gerar a string de conexão

### Configurações do Servidor

- **Tier**: Burstable (Standard_B1ms) - Ideal para estudantes
- **Storage**: 32 GB
- **PostgreSQL Version**: 16
- **Location**: East US
- **SSL**: Obrigatório (sslmode=require)

## 🔑 Passo 3: Configurar Variáveis de Ambiente

Após executar o script, você receberá uma string de conexão. Adicione-a ao arquivo `.env`:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e adicione a string de conexão:

```env
DATABASE_URL=postgresql://pictadmin:SuaSenha@pict-ibmec-postgres.postgres.database.azure.com/iniciacao_cientifica?sslmode=require
```

## 🔄 Passo 4: Migrar o Banco de Dados

O código já está preparado para usar PostgreSQL automaticamente quando a variável `DATABASE_URL` estiver configurada.

Execute as migrações:

```powershell
cd backend
python init_db.py
```

Isso criará todas as tabelas necessárias no PostgreSQL.

## ✅ Passo 5: Testar a Conexão

Execute o backend para verificar se está conectando corretamente:

```powershell
cd backend
uvicorn main:app --reload
```

Verifique os logs. Você deve ver:
- ✅ Conexão com banco de dados estabelecida
- ✅ Nenhum erro de conexão

## 🔒 Segurança

### Gerenciamento de Senhas

**IMPORTANTE**: Nunca commite a senha do banco no Git!

1. A senha está apenas no arquivo `.env` (que está no `.gitignore`)
2. Para produção, use Azure Key Vault ou variáveis de ambiente do App Service

### Firewall

O script configura acesso público para facilitar o desenvolvimento. Para produção:

```powershell
# Restringir acesso apenas ao App Service
az postgres flexible-server firewall-rule create \
  --resource-group PICTIBMEC \
  --name pict-ibmec-postgres \
  --rule-name AllowAppService \
  --start-ip-address <IP_DO_APP_SERVICE> \
  --end-ip-address <IP_DO_APP_SERVICE>
```

## 💰 Custos

Com **Azure for Students**:
- ✅ Crédito gratuito de $100/ano
- ✅ Burstable B1ms é econômico (~$12-15/mês)
- ✅ 32 GB storage incluído

**Dica**: Monitore o uso no Azure Portal regularmente.

## 🛠️ Comandos Úteis

### Verificar Status do Servidor

```powershell
az postgres flexible-server show \
  --resource-group PICTIBMEC \
  --name pict-ibmec-postgres
```

### Listar Bancos de Dados

```powershell
az postgres flexible-server db list \
  --resource-group PICTIBMEC \
  --server-name pict-ibmec-postgres
```

### Conectar via psql (Cliente PostgreSQL)

```powershell
psql "host=pict-ibmec-postgres.postgres.database.azure.com port=5432 dbname=iniciacao_cientifica user=pictadmin password=SuaSenha sslmode=require"
```

### Fazer Backup Manual

```powershell
pg_dump "postgresql://pictadmin:SuaSenha@pict-ibmec-postgres.postgres.database.azure.com/iniciacao_cientifica?sslmode=require" > backup.sql
```

### Restaurar Backup

```powershell
psql "postgresql://pictadmin:SuaSenha@pict-ibmec-postgres.postgres.database.azure.com/iniciacao_cientifica?sslmode=require" < backup.sql
```

## 🔍 Troubleshooting

### Erro: "Connection refused"

1. Verifique se o servidor está rodando:
   ```powershell
   az postgres flexible-server show --resource-group PICTIBMEC --name pict-ibmec-postgres --query state
   ```

2. Verifique as regras de firewall:
   ```powershell
   az postgres flexible-server firewall-rule list --resource-group PICTIBMEC --server-name pict-ibmec-postgres
   ```

### Erro: "SSL required"

Certifique-se de incluir `?sslmode=require` na string de conexão.

### Erro: "Authentication failed"

Verifique:
1. Usuário correto (`pictadmin`)
2. Senha correta (sem espaços ou caracteres especiais não escapados)
3. Nome do servidor correto

## 🌐 Integração com Azure App Service

Quando fizer deploy do backend no App Service, configure a variável de ambiente:

1. Acesse o App Service no Portal Azure
2. Settings > Configuration > Application settings
3. Adicione:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://pictadmin:SuaSenha@pict-ibmec-postgres.postgres.database.azure.com/iniciacao_cientifica?sslmode=require`

## 📊 Monitoramento

### Azure Portal

Acesse: [Azure Portal](https://portal.azure.com)
- Navegue até: PICTIBMEC > pict-ibmec-postgres
- Veja métricas de:
  - CPU Usage
  - Memory Usage
  - Storage Usage
  - Connection Count

### Logs de Query

Para habilitar query logging (útil para debug):

```powershell
az postgres flexible-server parameter set \
  --resource-group PICTIBMEC \
  --server-name pict-ibmec-postgres \
  --name log_statement \
  --value all
```

## 🎓 Recursos Adicionais

- [Documentação Azure PostgreSQL](https://learn.microsoft.com/azure/postgresql/)
- [SQLAlchemy com PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

## 📝 Checklist de Configuração

- [ ] Azure CLI instalado e configurado
- [ ] Login realizado no Azure CLI
- [ ] Script `create-postgres-azure.ps1` executado com sucesso
- [ ] String de conexão copiada para `.env`
- [ ] Arquivo `.env` configurado corretamente
- [ ] Migrações executadas (`python init_db.py`)
- [ ] Backend testado e conectando ao PostgreSQL
- [ ] Senha armazenada em local seguro
- [ ] `.env` está no `.gitignore`

---

**Criado em**: $(date)
**Versão**: 1.0
**Projeto**: Iniciação Científica IBMEC
