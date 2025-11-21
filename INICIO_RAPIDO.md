# 🎯 Guia Rápido - Rodar Projeto Localmente

## ✅ Tudo já está configurado!

O projeto está pronto para rodar localmente com:
- **Backend**: localhost:8000 (SQLite)
- **Frontend**: localhost:3000

## ▶️ Como Iniciar

### Opção 1: Abrir 2 Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```powershell
.\iniciar-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\iniciar-frontend.ps1
```

### Opção 2: Ver ambos os logs

Use o script automático que gerencia ambos:
```powershell
.\rodar-local.ps1
```

## 🌐 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## 🔑 Login no Sistema

Usuários de teste já criados:

### Coordenador
- **Email**: coordenador@ibmec.edu.br
- **Senha**: senha123

### Orientador
- **Email**: orientador@ibmec.edu.br
- **Senha**: senha123

### Aluno
- **Email**: aluno@alunos.ibmec.edu.br
- **Senha**: senha123

⚠️ **Importante**: Como o OAuth Microsoft não está configurado, use o endpoint de login legado no frontend.

## 📦 O que já foi feito

✅ Ambiente virtual Python criado
✅ Dependências instaladas
✅ Banco de dados SQLite inicializado
✅ Usuários de teste criados
✅ Configurações locais definidas (.env)

## 🛠️ Comandos Úteis

### Reiniciar Banco de Dados
```powershell
cd backend
Remove-Item iniciacao_cientifica.db
python init_db.py
python criar_usuario_teste.py
```

### Instalar/Atualizar Dependências Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Instalar/Atualizar Dependências Frontend
```powershell
cd frontend
npm install
```

### Ver Logs do Backend
O backend mostra logs em tempo real no terminal onde foi iniciado.

### Parar os Servidores
Pressione `Ctrl+C` no terminal onde o servidor está rodando.

## 📁 Arquivos Importantes

- `backend/.env` - Configurações do backend (SQLite, URLs locais)
- `frontend/.env.development` - Configurações do frontend (API URL)
- `backend/iniciacao_cientifica.db` - Banco de dados SQLite
- `backend/uploads/` - Arquivos enviados pelos usuários

## 🔄 Diferenças do Modo Local vs Azure

### Modo Local (Atual)
- ✅ Banco de dados SQLite (arquivo local)
- ✅ Sem necessidade de credenciais Azure
- ✅ OAuth Microsoft desabilitado (usa login legado)
- ✅ Arquivos salvos localmente

### Modo Azure (Produção)
- PostgreSQL na nuvem
- Requer credenciais Azure
- OAuth Microsoft habilitado
- Arquivos podem ser salvos no Azure Blob Storage

## ❓ Problemas Comuns

### Porta 8000 já em uso
```powershell
netstat -ano | findstr :8000
# Anote o PID e mate o processo:
taskkill /PID <numero> /F
```

### Porta 3000 já em uso
```powershell
netstat -ano | findstr :3000
# Anote o PID e mate o processo:
taskkill /PID <numero> /F
```

### Frontend não conecta no Backend
Verifique se:
1. Backend está rodando em http://localhost:8000
2. Arquivo `frontend/.env.development` tem `VITE_API_URL=http://localhost:8000`
3. Ambos os servidores estão rodando

### Erro ao importar módulos Python
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 📝 Notas

- O banco SQLite é criado automaticamente na primeira execução
- Todos os dados são salvos localmente
- Para ambiente de produção, configure as variáveis do Azure
- Os uploads ficam em `backend/uploads/`

---

**Desenvolvido para o Programa de Iniciação Científica do Ibmec** 🎓
