# 🚀 Guia de Instalação e Execução

## Requisitos do Sistema

- **Node.js**: versão 16 ou superior
- **npm** ou **yarn**: gerenciador de pacotes
- **Python**: versão 3.8 ou superior
- **pip**: gerenciador de pacotes Python

## Instalação Passo a Passo

### 1️⃣ Frontend (React)

```powershell
# Navegar para a pasta do frontend
cd frontend

# Instalar todas as dependências
npm install

# OU usando yarn
yarn install

# Iniciar servidor de desenvolvimento
npm run dev

# OU usando yarn
yarn dev
```

✅ O frontend estará rodando em: **http://localhost:3000**

### 2️⃣ Backend (FastAPI)

```powershell
# Voltar para a raiz e navegar para backend
cd ..
cd backend

# Criar ambiente virtual Python (recomendado)
python -m venv venv

# Ativar o ambiente virtual
# Windows PowerShell:
.\venv\Scripts\activate

# Windows CMD:
.\venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor FastAPI
python main.py

# OU usando uvicorn diretamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ O backend estará rodando em: **http://localhost:8000**
✅ Documentação da API: **http://localhost:8000/docs**

## Verificação da Instalação

### Testando o Frontend
1. Abra seu navegador em `http://localhost:3000`
2. Você deve ver a página inicial do sistema
3. Navegue para Login e use: `aluno@ibmec.edu.br`

### Testando o Backend
1. Abra `http://localhost:8000`
2. Você verá uma mensagem JSON de boas-vindas
3. Acesse `http://localhost:8000/docs` para a documentação interativa

## Problemas Comuns

### Erro: "npm não é reconhecido"
**Solução**: Instale o Node.js de https://nodejs.org/

### Erro: "python não é reconhecido"
**Solução**: Instale o Python de https://www.python.org/

### Erro: "Porta 3000 já em uso"
**Solução**: 
```powershell
# Matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID [número_do_PID] /F
```

### Erro: "Porta 8000 já em uso"
**Solução**: 
```powershell
# Matar processo na porta 8000
netstat -ano | findstr :8000
taskkill /PID [número_do_PID] /F
```

### Erro de CORS
**Solução**: Certifique-se de que o backend está rodando antes do frontend

## Executando em Produção

### Frontend
```powershell
# Build para produção
npm run build

# Os arquivos estarão em dist/
# Deploy em serviços como Vercel, Netlify, etc.
```

### Backend
```powershell
# Instalar servidor de produção
pip install gunicorn

# Rodar com gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Scripts Úteis

### Frontend
- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

### Backend
- `python main.py` - Iniciar servidor
- `pytest` - Rodar testes (quando implementados)

## Próximos Passos

Após instalação bem-sucedida:
1. ✅ Configure o banco de dados PostgreSQL (opcional)
2. ✅ Configure as variáveis de ambiente (.env)
3. ✅ Teste todas as funcionalidades
4. ✅ Personalize conforme necessário

## Suporte

Em caso de dúvidas:
- 📧 Entre em contato: iniciacao.cientifica@ibmec.edu.br
- 📚 Consulte a documentação completa no README.md
