# 🎓 Sistema de Iniciação Científica - Ibmec

Sistema web completo para gerenciamento do programa de Iniciação Científica do Ibmec, desenvolvido com **React** no frontend e **FastAPI** no backend.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![React](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-06B6D4)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [API](#-api)

## 🎯 Visão Geral

Este projeto transforma o site "Idealiza" em uma plataforma completa para gerenciamento de iniciação científica, permitindo:

- **Alunos**: Inscrever-se, acompanhar status e receber feedbacks
- **Orientadores**: Gerenciar orientandos e avaliar propostas
- **Coordenadores**: Administrar inscrições e gerar relatórios

## ✨ Funcionalidades

### Funcionalidades Gerais
- 🏠 Página inicial institucional
- 📝 Sistema de cadastro/inscrição
- 🔐 Autenticação e autorização por perfil
- 📱 Design responsivo (mobile-first)

### Para Alunos
- ✅ Acompanhamento de status da inscrição
- 💬 Recebimento de feedbacks
- 📊 Visualização de progresso
- 📄 Upload de proposta de projeto

### Para Orientadores
- 👨‍🎓 Gerenciamento de alunos orientados
- 📋 Avaliação de propostas
- 💬 Envio de feedbacks
- 📈 Acompanhamento de progresso

### Para Coordenadores
- 📊 Painel administrativo completo
- 🔍 Filtros por status
- 📈 Relatórios e estatísticas
- ⚡ Gerenciamento de inscrições

## 🚀 Tecnologias

### Frontend
- **React 18.2** - Biblioteca JavaScript
- **Vite** - Build tool
- **React Router DOM** - Navegação
- **TailwindCSS** - Estilização
- **Axios** - Requisições HTTP

### Backend
- **FastAPI** - Framework Python
- **Pydantic** - Validação de dados
- **Uvicorn** - Servidor ASGI
- **SQLAlchemy** - ORM (preparado para PostgreSQL)

## 📁 Estrutura do Projeto

```
project/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── context/         # Context API
│   │   ├── pages/           # Páginas da aplicação
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
│
└── backend/                 # API FastAPI
    ├── models/              # Modelos Pydantic
    ├── routes/              # Rotas da API
    ├── main.py
    └── requirements.txt
```

## 🔧 Instalação

Consulte o arquivo **INSTALACAO.md** para instruções detalhadas.

### Resumo Rápido

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 💻 Uso

### Credenciais de Demonstração

| Tipo | Email | Senha |
|------|-------|-------|
| Aluno | aluno@ibmec.edu.br | qualquer |
| Orientador | orientador@ibmec.edu.br | qualquer |
| Coordenador | coordenador@ibmec.edu.br | qualquer |

## 🌐 API

Documentação completa: http://localhost:8000/docs

## 📞 Contato

- Email: iniciacao.cientifica@ibmec.edu.br
- Tel: (21) 2189-9000

---

Desenvolvido com ❤️ para o Ibmec
