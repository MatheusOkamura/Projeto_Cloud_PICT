# 🔄 FLUXOGRAMA VISUAL - Login Normal

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USUARIO ACESSA /login                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │   Qual método de login?             │
        └──┬────────────────────────────────┬──┘
           │                                │
           ▼                                ▼
    ┌──────────────┐              ┌─────────────────┐
    │  Formulário  │              │  OAuth Microsoft│
    │  (Legacy)    │              │  (Recomendado)  │
    └──────┬───────┘              └────────┬────────┘
           │                               │
           │ ┌─────────────────────────────┘
           │ │
           ▼ ▼
    ┌──────────────────────┐
    │  É usuario de teste? │
    │  (3 especificos)     │
    └──┬──────────────┬────┘
       │ SIM          │ NAO
       │              │
       ▼              ▼
    ┌─────────────┐  ┌────────────────────────┐
    │ TESTE USER  │  │ USUARIO NORMAL         │
    │             │  │                        │
    │ • Qualquer  │  │ Legacy: BLOQUEADO (403)│
    │   senha     │  │ OAuth: PERMITIDO       │
    │ • Bypass de │  │                        │
    │   cadastro  │  └───────────┬────────────┘
    │ • Direto p/ │              │
    │   dashboard │              │ (via OAuth)
    └──────┬──────┘              │
           │                     ▼
           │              ┌──────────────────────┐
           │              │ Microsoft autentica  │
           │              └──────────┬───────────┘
           │                         │
           │                         ▼
           │              ┌──────────────────────┐
           │              │ Backend callback     │
           │              │ Busca no banco:      │
           │              │ email == usuario?    │
           │              └──┬───────────────┬───┘
           │                 │ NAO           │ SIM
           │                 │ EXISTE        │ EXISTE
           │                 ▼               ▼
           │          ┌──────────────┐  ┌──────────────┐
           │          │ CRIAR NOVO   │  │ ENCONTRADO   │
           │          │ USUARIO      │  │              │
           │          │              │  │ Tem todos os │
           │          │ is_new_user  │  │ dados?       │
           │          │ = TRUE       │  └──┬────────┬──┘
           │          └──────┬───────┘     │ NAO    │ SIM
           │                 │             │        │
           │                 │             ▼        ▼
           │                 │      ┌──────────┐ ┌──────────┐
           │                 │      │is_new_   │ │is_new_   │
           │                 │      │user=TRUE │ │user=FALSE│
           │                 │      └────┬─────┘ └────┬─────┘
           │                 │           │            │
           │                 └───────────┴────────────┘
           │                             │
           │                             ▼
           │                  ┌─────────────────────┐
           │                  │ Redireciona p/      │
           │                  │ Frontend c/ token + │
           │                  │ is_new_user flag    │
           │                  └──────────┬──────────┘
           │                             │
           └─────────────────────────────┘
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │ Frontend (AuthCallback) │
                            │ Verifica is_new_user?   │
                            └──┬───────────────────┬──┘
                               │ TRUE              │ FALSE
                               │                   │
                               ▼                   ▼
                      ┌─────────────────┐  ┌──────────────┐
                      │   /cadastro     │  │  /dashboard- │
                      │                 │  │  {tipo}      │
                      │ Usuario         │  │              │
                      │ preenche:       │  │ Usuario ja   │
                      │                 │  │ esta pronto  │
                      │ • CPF           │  │ para usar    │
                      │ • Telefone      │  │ sistema      │
                      │ • Curso (aluno) │  │              │
                      │ • Matricula     │  └──────────────┘
                      │ • Depto (prof)  │
                      │                 │
                      │ Salva no banco  │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Proximo login:  │
                      │ Dashboard direto│
                      └─────────────────┘
```

---

## 📊 DADOS OBRIGATÓRIOS

### Aluno
```
┌─────────────┐
│ CPF         │ ← OBRIGATORIO
│ Telefone    │ ← OBRIGATORIO
│ Curso       │ ← OBRIGATORIO
│ Matricula   │ ← OBRIGATORIO
│ CR          │   opcional
│ Unidade     │   opcional
└─────────────┘
```

### Orientador
```
┌─────────────┐
│ Telefone    │ ← OBRIGATORIO
│ Departamento│ ← OBRIGATORIO
│ Area Pesq.  │   opcional
│ Titulacao   │   opcional
│ Vagas       │   opcional
└─────────────┘
```

### Coordenador
```
┌─────────────┐
│ Telefone    │ ← OBRIGATORIO
│ Departamento│ ← OBRIGATORIO
└─────────────┘
```

---

## 🎯 CENÁRIOS DE USO

### Cenário 1: Desenvolvimento - Usuario de Teste
```
aluno.teste@alunos.ibmec.edu.br
        ↓
    Formulário (qualquer senha)
        ↓
    is_test_user() = TRUE
        ↓
    Bypass verificação
        ↓
    is_new_user = FALSE
        ↓
    /dashboard-aluno
```

### Cenário 2: Usuario Novo (OAuth)
```
maria.silva@alunos.ibmec.edu.br
        ↓
    OAuth Microsoft
        ↓
    Autentica com sucesso
        ↓
    Backend: usuario não existe
        ↓
    Cria usuario (email, nome, tipo=aluno)
        ↓
    Verifica dados: cpf=null, telefone=null, curso=null, matricula=null
        ↓
    is_new_user = TRUE
        ↓
    /cadastro (preenche dados)
        ↓
    Salva no banco
        ↓
    Proximo login: /dashboard-aluno
```

### Cenário 3: Usuario Existente com Dados Incompletos
```
joao.silva@alunos.ibmec.edu.br
        ↓
    OAuth Microsoft
        ↓
    Backend: usuario existe
        ↓
    Verifica dados: cpf=OK, telefone=null ❌, curso=OK, matricula=OK
        ↓
    Falta telefone!
        ↓
    is_new_user = TRUE
        ↓
    /cadastro (preenche telefone)
        ↓
    Proximo login: /dashboard-aluno
```

### Cenário 4: Usuario Existente Completo
```
carlos.santos@alunos.ibmec.edu.br
        ↓
    OAuth Microsoft
        ↓
    Backend: usuario existe
        ↓
    Verifica dados: cpf=OK ✅, telefone=OK ✅, curso=OK ✅, matricula=OK ✅
        ↓
    Tudo preenchido!
        ↓
    is_new_user = FALSE
        ↓
    /dashboard-aluno (direto)
```

---

## 🔄 MATRIZ DE DECISÃO

| Existe no DB? | Dados Completos? | É Teste? | is_new_user | Destino |
|--------------|------------------|----------|-------------|---------|
| ❌ Não       | N/A              | ❌ Não   | ✅ TRUE     | 📝 Cadastro |
| ✅ Sim       | ❌ Não           | ❌ Não   | ✅ TRUE     | 📝 Cadastro |
| ✅ Sim       | ✅ Sim           | ❌ Não   | ❌ FALSE    | 📊 Dashboard |
| ✅ Sim       | ❌ Não           | ✅ Sim   | ❌ FALSE    | 📊 Dashboard |
| ✅ Sim       | ✅ Sim           | ✅ Sim   | ❌ FALSE    | 📊 Dashboard |

**Regra de Ouro:** Usuários de teste SEMPRE vão direto pro dashboard.

---

## 🧪 COMANDOS DE TESTE

```powershell
# Teste completo do fluxo
.\test_fluxo_normal_login.ps1

# Simulacao OAuth
.\test_simulacao_oauth_novo_usuario.ps1

# Ver logs do backend
# (enquanto backend esta rodando)
# Busque por: ⚠️ precisa completar cadastro
```

---

## 📱 INTERFACE DO USUARIO

### Tela de Login
```
┌─────────────────────────────────┐
│  🔐 Login                       │
├─────────────────────────────────┤
│                                 │
│  [🪟 Entrar com Microsoft]      │
│     ← RECOMENDADO               │
│                                 │
│  ────── Ou use o formulário ────│
│                                 │
│  Email: [________________]      │
│  Senha: [________________]      │
│                                 │
│  [Entrar]                       │
│                                 │
│  💡 Para demonstração:          │
│  aluno.teste@alunos.ibmec.edu.br│
│  Senha: qualquer (ex: 123)      │
└─────────────────────────────────┘
```

### Tela de Cadastro (quando is_new_user=true)
```
┌─────────────────────────────────┐
│  📝 Complete seu Cadastro       │
├─────────────────────────────────┤
│  Email: maria.silva@alunos...   │
│  Nome: Maria Silva              │
│                                 │
│  CPF: [___.___.___-__] *        │
│  Telefone: [(__) _____-____] *  │
│  Curso: [▼ Selecione] *         │
│  Matrícula: [__________] *      │
│                                 │
│  [Salvar e Continuar]           │
│                                 │
│  * Campos obrigatórios          │
└─────────────────────────────────┘
```

---

**Versão:** 2.0  
**Data:** 21/11/2024  
**Status:** ✅ Implementado e Testado
