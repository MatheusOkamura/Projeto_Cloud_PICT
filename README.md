# 🎓 Projeto_Cloud_PICT- Ibmec

Sistema completo para gerenciamento do programa de Iniciação Científica do Ibmec, desenvolvido com **FastAPI** (Backend) e **React** (Frontend), hospedado no **Azure Static Web Apps**.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Fluxo de Aprovação](#-fluxo-de-aprovação)
- [Tipos de Usuários](#-tipos-de-usuários)
- [Rotas da API](#-rotas-da-api)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
- [Instalação e Configuração](#-instalação-e-configuração)

---

## 🌐 Visão Geral

O sistema gerencia todo o ciclo de vida da Iniciação Científica, desde a submissão de propostas até a conclusão do projeto, passando por múltiplas etapas de aprovação e acompanhamento.

### URLs do Sistema

- **Frontend (Azure):** https://icy-sea-0c53d910f.3.azurestaticapps.net
- **Backend (Azure):** https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net
- **Documentação da API:** https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/docs

### Tecnologias Utilizadas

**Backend:**
- FastAPI (Framework Python)
- SQLAlchemy (ORM)
- PostgreSQL (Banco de dados)
- JWT (Autenticação)
- Microsoft OAuth 2.0 (Login institucional)
- Azure App Service

**Frontend:**
- React 18
- Vite (Build tool)
- React Router (Navegação)
- TailwindCSS (Estilização)
- Azure Static Web Apps

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                  Azure Static Web Apps                           │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │  Login   │  Aluno   │Orientador│Coordenador│  Cadastro│      │
│  │  OAuth   │Dashboard │Dashboard │Dashboard  │          │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│                   Azure App Service                              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │   Auth   │  Alunos  │Orientador│Coordenador│ Inscrições│     │
│  │  Routes  │  Routes  │ Routes   │ Routes    │  Routes   │     │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Usuários │Inscrições│ Projetos │ Entregas │ Cursos   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Aprovação

### 1️⃣ Submissão de Proposta (Aluno)

```
Aluno → Submete Proposta → Status: "pendente_orientador"
```

**Rota:** `POST /api/inscricoes/proposta`

**Dados necessários:**
- Título do projeto
- Área de conhecimento
- Descrição, objetivos, metodologia
- Orientador escolhido
- Arquivo da proposta (PDF)

### 2️⃣ Avaliação do Orientador

```
Orientador → Avalia Proposta → ✅ Aprovado: "pendente_coordenador"
                              → ❌ Rejeitado: "rejeitada_orientador"
```

**Rota:** `POST /api/orientadores/inscricoes/{inscricao_id}/avaliar`

**Parâmetros:**
- `aprovar`: boolean (true/false)
- `feedback`: string (comentários)

### 3️⃣ Avaliação do Coordenador

```
Coordenador → Avalia Proposta → ✅ Aprovado: "aprovada" → Cria Projeto
                               → ❌ Rejeitado: "rejeitada_coordenador"
```

**Rota:** `POST /api/coordenadores/inscricoes/{inscricao_id}/aprovar-final`

**Se aprovado:**
- Status → `"aprovada"`
- Cria registro na tabela `Projeto`
- Aluno pode começar entregas

### 4️⃣ Entregas do Aluno

```
Aluno → Envia Entrega → Status: "pendente" (orientador)
                      ↓
Orientador → Avalia → ✅ Aprovado: "pendente" (coordenador)
                    → ❌ Rejeitado: "rejeitado"
                      ↓
Coordenador → Avalia Final → ✅ Aprovado: "aprovado"
                            → ❌ Rejeitado: "rejeitado"
```

**Rotas de entrega:**
- `POST /api/alunos/{aluno_id}/entrega-etapa` (aluno envia)
- `POST /api/orientadores/{orientador_id}/entregas/{entrega_id}/avaliar` (orientador avalia)
- `POST /api/coordenadores/entregas/{entrega_id}/avaliar` (coordenador avalia)

---

## 👥 Tipos de Usuários

### 🎓 Aluno

**Capacidades:**
- Submeter proposta de projeto
- Acompanhar status da proposta
- Enviar entregas (relatório parcial, apresentação, artigo final)
- Visualizar feedback de orientadores e coordenadores

**Rotas frontend:**
- `/dashboard-aluno` - Dashboard principal
- `/submeter-proposta` - Submissão de proposta
- `/enviar-relatorio-parcial` - Envio de relatório parcial
- `/enviar-apresentacao-amostra` - Envio de apresentação
- `/enviar-artigo-final` - Envio de artigo final

### 👨‍🏫 Orientador

**Capacidades:**
- Visualizar alunos orientados
- Avaliar propostas de alunos (primeira aprovação)
- Avaliar entregas de alunos (primeira aprovação)
- Enviar relatórios mensais sobre o progresso dos alunos
- Visualizar mensagens e feedback

**Rotas frontend:**
- `/dashboard-orientador` - Dashboard com lista de alunos e propostas

### 👔 Coordenador

**Capacidades:**
- Visualizar todos os alunos e projetos
- Avaliar propostas (aprovação final após orientador)
- Avaliar entregas (aprovação final após orientador)
- Alterar etapa/status de projetos
- Visualizar relatórios mensais de orientadores
- Gerenciar sistema

**Rotas frontend:**
- `/dashboard-coordenador` - Dashboard principal
- `/coordenador/status` - Gestão de status e etapas

---

## 🛣️ Rotas da API

### 🔐 Autenticação (`/api/auth`)

| Método | Rota | Descrição | Início | Fim |
|--------|------|-----------|--------|-----|
| **GET** | `/api/auth/login` | Inicia fluxo OAuth Microsoft | Frontend | Redirect Microsoft Login |
| **GET** | `/api/auth/callback` | Callback OAuth da Microsoft | Microsoft | Cria/busca usuário → JWT token → Redirect Frontend |
| **POST** | `/api/auth/legacy-login` | Login legado (email/senha) | Frontend | JWT token + dados usuário |

**Fluxo OAuth completo:**

```
1. Frontend → GET /api/auth/login
2. Backend → Gera URL Microsoft → Redirect usuário
3. Usuário → Login Microsoft → Callback
4. Microsoft → GET /api/auth/callback?code=XXX&state=YYY
5. Backend → Troca código por token → Busca dados usuário
6. Backend → Valida email @ibmec.edu.br
7. Backend → Cria/busca usuário no BD
8. Backend → Gera JWT token
9. Backend → Redirect frontend/auth/callback?token=JWT&user=DATA
10. Frontend → Salva token → Redirect dashboard
```

---

### 📝 Inscrições/Propostas (`/api/inscricoes`)

| Método | Rota | Descrição | Início | Fim | Função |
|--------|------|-----------|--------|-----|--------|
| **POST** | `/api/inscricoes/proposta` | Submeter proposta | Aluno envia formulário + PDF | Cria inscrição com status `pendente_orientador` | Registra proposta no BD, salva arquivo |
| **GET** | `/api/inscricoes/usuario/{usuario_id}` | Obter proposta do usuário | Frontend busca proposta | Retorna dados da inscrição ou `tem_proposta: false` | Busca última inscrição do aluno |
| **GET** | `/api/inscricoes` | Listar todas inscrições | Coordenador acessa lista | Retorna array de inscrições | Lista todas as propostas |

---

### 🎓 Rotas de Alunos (`/api/alunos`)

| Método | Rota | Descrição | Início | Fim | Função |
|--------|------|-----------|--------|-----|--------|
| **GET** | `/api/alunos/{aluno_id}/projeto` | Obter projeto do aluno | Aluno acessa dashboard | Retorna projeto aprovado ou `tem_projeto: false` | Busca projeto ativo do aluno |
| **POST** | `/api/alunos/{aluno_id}/entrega-etapa` | Enviar entrega de etapa | Aluno submete arquivo + descrição | Cria entrega com status `pendente` | Salva arquivo, cria registro, atualiza etapa do projeto |
| **GET** | `/api/alunos/{aluno_id}/entregas` | Listar entregas do aluno | Aluno visualiza histórico | Retorna array de entregas com status | Busca todas entregas do aluno |
| **GET** | `/api/alunos/{aluno_id}/mensagens` | Listar mensagens recebidas | Aluno abre mensagens | Retorna mensagens de orientador/coordenador | Busca mensagens relacionadas ao projeto |

**Tipos de entregas válidos:**
- `relatorio_parcial` - Relatório Parcial
- `apresentacao` - Apresentação de Amostra
- `artigo_final` - Artigo Final
- `relatorio_mensal` - Relatório Mensal (múltiplos)

---

### 👨‍🏫 Rotas de Orientadores (`/api/orientadores`)

| Método | Rota | Descrição | Início | Fim | Função |
|--------|------|-----------|--------|-----|--------|
| **GET** | `/api/orientadores/{orientador_id}/alunos` | Listar alunos orientados | Orientador acessa dashboard | Retorna lista de alunos com projetos | Busca projetos do orientador |
| **GET** | `/api/orientadores/{orientador_id}/alunos/{aluno_id}/entregas` | Listar entregas de um aluno | Orientador visualiza entregas | Retorna entregas do aluno | Busca entregas do projeto |
| **POST** | `/api/orientadores/{orientador_id}/entregas/{entrega_id}/avaliar` | Avaliar entrega (1ª aprovação) | Orientador aprova/rejeita | ✅ `status_orientador: aprovado` → pendente coordenador<br>❌ `status_orientador: rejeitado` | Atualiza status, salva feedback, envia para coordenador se aprovado |
| **POST** | `/api/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais` | Enviar relatório mensal | Orientador envia relato | Cria entrega tipo `relatorio_mensal` | Registra progresso mensal do aluno |
| **GET** | `/api/orientadores/{orientador_id}/mensagens` | Listar mensagens enviadas | Orientador visualiza histórico | Retorna mensagens para alunos | Busca mensagens do orientador |
| **GET** | `/api/orientadores/{orientador_id}/inscricoes` | Listar propostas pendentes | Orientador vê propostas | Retorna inscrições com status `pendente_orientador` | Filtra propostas aguardando avaliação |
| **POST** | `/api/orientadores/inscricoes/{inscricao_id}/avaliar` | Avaliar proposta (1ª aprovação) | Orientador aprova/rejeita proposta | ✅ `status: pendente_coordenador`<br>❌ `status: rejeitada_orientador` | Primeira etapa de aprovação de proposta |

---

### 👔 Rotas de Coordenadores (`/api/coordenadores`)

| Método | Rota | Descrição | Início | Fim | Função |
|--------|------|-----------|--------|-----|--------|
| **GET** | `/api/coordenadores/alunos` | Listar todos os alunos | Coordenador acessa sistema | Retorna todos alunos com projetos | Visão geral de todos os projetos |
| **GET** | `/api/coordenadores/alunos/{aluno_id}/status-etapa` | Obter status/etapa do aluno | Coordenador consulta etapa | Retorna etapa atual e etapas válidas | Busca etapa do projeto |
| **PATCH** | `/api/coordenadores/alunos/{aluno_id}/status-etapa` | Atualizar etapa do projeto | Coordenador altera etapa | Atualiza `etapa_atual` do projeto | Muda etapa manualmente (ex: `desenvolvimento` → `relatorio_parcial`) |
| **GET** | `/api/coordenadores/alunos/{aluno_id}/entregas` | Listar entregas do aluno | Coordenador visualiza entregas | Retorna entregas do projeto | Busca entregas para aprovação |
| **POST** | `/api/coordenadores/entregas/{entrega_id}/avaliar` | Avaliar entrega (aprovação final) | Coordenador aprova/rejeita | ✅ `status_coordenador: aprovado` (entrega concluída)<br>❌ `status_coordenador: rejeitado` | Segunda e última etapa de aprovação |
| **GET** | `/api/coordenadores/orientadores/{orientador_id}/relatorios-mensais` | Listar relatórios mensais | Coordenador acompanha orientadores | Retorna relatórios mensais por orientador | Monitora atividade dos orientadores |
| **GET** | `/api/coordenadores/inscricoes` | Listar propostas pendentes | Coordenador vê propostas aprovadas por orientadores | Retorna inscrições com status `pendente_coordenador` | Filtra propostas para aprovação final |
| **POST** | `/api/coordenadores/inscricoes/{inscricao_id}/aprovar-final` | Aprovar proposta (aprovação final) | Coordenador aprova/rejeita | ✅ `status: aprovada` → Cria `Projeto`<br>❌ `status: rejeitada_coordenador` | Aprovação final, cria projeto se aprovado |

**Etapas válidas de projeto:**
- `inscricao` - Fase de inscrição
- `desenvolvimento` - Desenvolvimento do projeto
- `relatorio_parcial` - Relatório parcial
- `apresentacao` - Apresentação de amostra
- `relatorio_final` - Artigo/relatório final
- `concluido` - Projeto concluído

---

### 👤 Rotas de Usuários (`/api/usuarios`)

| Método | Rota | Descrição | Início | Fim | Função |
|--------|------|-----------|--------|-----|--------|
| **GET** | `/api/usuarios` | Listar todos usuários | Sistema busca usuários | Retorna array de usuários (pode filtrar por tipo) | Lista usuários do sistema |
| **GET** | `/api/usuarios/{usuario_id}` | Obter usuário específico | Sistema busca dados | Retorna dados completos do usuário | Busca usuário por ID |
| **PUT** | `/api/usuarios/{usuario_id}/completar-cadastro` | Completar cadastro | Novo usuário preenche dados | Atualiza dados do usuário | Atualiza CPF, telefone, curso, etc. |
| **GET** | `/api/estatisticas` | Obter estatísticas gerais | Coordenador visualiza dashboard | Retorna contadores (alunos, orientadores, inscrições) | Dados estatísticos do sistema |

---

### 📚 Rotas Utilitárias (`/api`)

| Método | Rota | Descrição | Retorno |
|--------|------|-----------|---------|
| **GET** | `/` | Root da API | Mensagem de boas-vindas + versão |
| **GET** | `/api/health` | Health check | `{"status": "healthy"}` |
| **GET** | `/api/cursos` | Listar cursos do Ibmec | Array de cursos ativos |
| **GET** | `/api/unidades` | Listar unidades do Ibmec | Array de unidades |
| **GET** | `/api/orientadores` | Listar orientadores disponíveis | Array de orientadores ativos com vagas |

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `usuarios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID único |
| `email` | String (Unique) | Email institucional |
| `senha` | String | Senha (vazia para OAuth) |
| `nome` | String | Nome completo |
| `cpf` | String (Unique) | CPF |
| `telefone` | String | Telefone |
| `tipo` | Enum | `aluno`, `orientador`, `coordenador` |
| `status` | Enum | `pendente`, `ativo`, `inativo` |
| `data_cadastro` | DateTime | Data de criação |
| **Campos de Aluno** | | |
| `curso` | String | Nome do curso |
| `unidade` | String | Unidade (Vila da Serra, Barra, etc.) |
| `matricula` | String (Unique) | Matrícula |
| `cr` | Float | Coeficiente de Rendimento |
| `documento_cr` | String | Caminho do arquivo CR |
| **Campos de Orientador** | | |
| `departamento` | String | Departamento |
| `area_pesquisa` | String | Área de pesquisa |
| `titulacao` | String | Titulação (Mestre, Doutor, etc.) |
| `vagas_disponiveis` | Integer | Vagas disponíveis |

---

### Tabela: `inscricoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID da inscrição |
| `usuario_id` | Integer (FK) | ID do aluno |
| `nome` | String | Nome do aluno (snapshot) |
| `email` | String | Email do aluno |
| `cpf` | String | CPF |
| `telefone` | String | Telefone |
| `curso` | String | Curso |
| `matricula` | String | Matrícula |
| `unidade` | String | Unidade |
| `cr` | Float | CR |
| `titulo_projeto` | String | Título do projeto |
| `area_conhecimento` | String | Área de conhecimento |
| `descricao` | Text | Descrição do projeto |
| `objetivos` | Text | Objetivos |
| `metodologia` | Text | Metodologia |
| `resultados_esperados` | Text | Resultados esperados |
| `arquivo_projeto` | String | Nome do arquivo PDF |
| `orientador_id` | Integer (FK) | ID do orientador escolhido |
| `orientador_nome` | String | Nome do orientador |
| **Status e Aprovações** | | |
| `status` | Enum | `pendente_orientador`, `pendente_coordenador`, `aprovada`, `rejeitada_orientador`, `rejeitada_coordenador` |
| `status_aprovacao_orientador` | String | `pendente`, `aprovado`, `rejeitado` |
| `status_aprovacao_coordenador` | String | `pendente`, `aprovado`, `rejeitado` |
| `feedback_orientador` | Text | Feedback do orientador |
| `feedback_coordenador` | Text | Feedback do coordenador |
| `data_submissao` | DateTime | Data de submissão |
| `data_avaliacao_orientador` | DateTime | Data avaliação orientador |
| `data_avaliacao_coordenador` | DateTime | Data avaliação coordenador |

---

### Tabela: `projetos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID do projeto |
| `aluno_id` | Integer (FK) | ID do aluno |
| `orientador_id` | Integer (FK) | ID do orientador |
| `titulo` | String | Título do projeto |
| `area_conhecimento` | String | Área |
| `descricao` | Text | Descrição |
| `objetivos` | Text | Objetivos |
| `metodologia` | Text | Metodologia |
| `etapa_atual` | Enum | `inscricao`, `desenvolvimento`, `relatorio_parcial`, `apresentacao`, `relatorio_final`, `concluido` |
| `data_inicio` | DateTime | Data de início |
| `data_conclusao` | DateTime | Data de conclusão |

**Relacionamentos:**
- `aluno` → `usuarios.id` (tipo=aluno)
- `orientador` → `usuarios.id` (tipo=orientador)
- `entregas` → várias entregas do projeto

---

### Tabela: `entregas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID da entrega |
| `projeto_id` | Integer (FK) | ID do projeto |
| `aluno_id` | Integer (FK) | ID do aluno |
| `tipo` | String | `relatorio_parcial`, `apresentacao`, `artigo_final`, `relatorio_mensal` |
| `titulo` | String | Título da entrega |
| `descricao` | Text | Descrição |
| `arquivo` | String | Nome do arquivo |
| `data_entrega` | DateTime | Data de envio |
| `prazo` | DateTime | Prazo (opcional) |
| **Aprovação Orientador** | | |
| `status_aprovacao_orientador` | String | `pendente`, `aprovado`, `rejeitado` |
| `feedback_orientador` | Text | Feedback do orientador |
| `data_avaliacao_orientador` | DateTime | Data da avaliação |
| **Aprovação Coordenador** | | |
| `status_aprovacao_coordenador` | String | `pendente`, `aprovado`, `rejeitado`, `n/a` |
| `feedback_coordenador` | Text | Feedback do coordenador |
| `data_avaliacao_coordenador` | DateTime | Data da avaliação |

---

### Tabela: `cursos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID do curso |
| `nome` | String | Nome do curso |
| `codigo` | String | Código do curso |
| `ativo` | Integer | 1=ativo, 0=inativo |

---

### Tabela: `mensagens_relatorios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID da mensagem |
| `projeto_id` | Integer (FK) | ID do projeto |
| `remetente_id` | Integer (FK) | ID do remetente |
| `destinatario_id` | Integer (FK) | ID do destinatário |
| `mensagem` | Text | Conteúdo da mensagem |
| `data_envio` | DateTime | Data de envio |
| `lida` | Boolean | Lida ou não |

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Python 3.9+
- Node.js 18+
- PostgreSQL
- Azure CLI (para deploy)

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Criar arquivo .env com:
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET_KEY=sua-chave-secreta
MICROSOFT_CLIENT_ID=seu-client-id
MICROSOFT_CLIENT_SECRET=seu-client-secret
MICROSOFT_TENANT_ID=seu-tenant-id
FRONTEND_URL=http://localhost:5173

# Inicializar banco de dados
python init_db.py

# Rodar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env.development:
VITE_API_URL=http://localhost:8000/api

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Deploy no Azure

```bash
# Backend (App Service)
az webapp up --name pictback --resource-group seu-resource-group

# Frontend (Static Web Apps)
# Usar GitHub Actions configurado em .github/workflows/
# Secret necessário: AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F
```

---

## 📊 Fluxo Completo de Dados

### Exemplo: Submissão de Proposta

```
1. Aluno acessa /submeter-proposta
   ↓
2. Preenche formulário (título, descrição, orientador, arquivo PDF)
   ↓
3. Frontend → POST /api/inscricoes/proposta
   ↓
4. Backend recebe dados + arquivo
   ↓
5. Salva arquivo em uploads/propostas/
   ↓
6. Cria registro em `inscricoes` com:
   - usuario_id = aluno.id
   - orientador_id = orientador_escolhido.id
   - status = "pendente_orientador"
   - status_aprovacao_orientador = "pendente"
   ↓
7. Retorna: {"message": "Proposta submetida", "proposta_id": X}
   ↓
8. Orientador acessa /dashboard-orientador
   ↓
9. Vê proposta na lista de pendentes
   ↓
10. Clica "Avaliar" → Formulário de aprovação
    ↓
11. Frontend → POST /api/orientadores/inscricoes/X/avaliar
    - aprovar: true/false
    - feedback: "texto"
    ↓
12. Backend atualiza:
    - Se aprovar: status = "pendente_coordenador"
    - Se rejeitar: status = "rejeitada_orientador"
    ↓
13. Coordenador acessa /dashboard-coordenador
    ↓
14. Vê propostas com status "pendente_coordenador"
    ↓
15. Clica "Aprovar Final"
    ↓
16. Frontend → POST /api/coordenadores/inscricoes/X/aprovar-final
    ↓
17. Backend:
    - Atualiza status = "aprovada"
    - Cria registro em `projetos`:
      - aluno_id = inscricao.usuario_id
      - orientador_id = inscricao.orientador_id
      - titulo = inscricao.titulo_projeto
      - etapa_atual = "desenvolvimento"
    ↓
18. Aluno pode agora enviar entregas!
```

---

## 🔒 Autenticação e Autorização

### JWT Token

Após login bem-sucedido, o backend retorna um JWT contendo:

```json
{
  "sub": "email@alunos.ibmec.edu.br",
  "user_id": 123,
  "tipo": "aluno",
  "nome": "João Silva",
  "exp": 1699999999
}
```

### Proteção de Rotas

**Frontend:** Usa `ProtectedRoute` component
```jsx
<Route 
  path="submeter-proposta" 
  element={
    <ProtectedRoute allowedRoles={['aluno']}>
      <SubmeterProposta />
    </ProtectedRoute>
  } 
/>
```

**Backend:** Usa `Depends(get_current_user)` (a ser implementado)

---

## 📝 Notas Importantes

1. **Email institucional obrigatório:** Apenas emails `@ibmec.edu.br` podem fazer login
2. **Fluxo de aprovação duplo:** Orientador → Coordenador (ambos precisam aprovar)
3. **Entregas únicas:** Cada tipo de entrega (exceto relatorio_mensal) só pode ser enviado uma vez
4. **Arquivos salvos localmente:** Em produção, migrar para Azure Blob Storage ou AWS S3
5. **CORS configurado:** Frontend e backend em domínios diferentes, CORS habilitado

---

## 🐛 Troubleshooting

### Erro: "deployment_token was not provided"
**Solução:** Adicionar secret no GitHub:
- Nome: `AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_SEA_0C53D910F`
- Valor: token do Azure Static Web Apps

### Erro: "CORS policy"
**Solução:** Verificar `allow_origins` em `backend/main.py`

### Erro: "Email institucional inválido"
**Solução:** Usar email @ibmec.edu.br ou adicionar domínio em `microsoft_auth.py`

---

## 📞 Suporte

Para dúvidas ou problemas:
- Documentação da API: https://pictback-bzakbsfqc6bgqjcc.brazilsouth-01.azurewebsites.net/docs
- Issues no GitHub: [link do repositório]

---

**Desenvolvido para o programa de Iniciação Científica do Ibmec** 🎓