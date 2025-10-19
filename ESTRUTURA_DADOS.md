# 🗄️ Estrutura de Dados e Modelos

## Visão Geral

Este documento descreve os modelos de dados utilizados no sistema, incluindo estruturas simuladas atuais e recomendações para implementação com banco de dados.

## 📊 Diagrama ER (Entidade-Relacionamento)

```
┌─────────────────┐         ┌──────────────────┐
│    USUARIO      │         │    INSCRICAO     │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │────┐    │ id (PK)          │
│ nome            │    │    │ usuario_id (FK)  │
│ email (UNIQUE)  │    └────│ titulo_projeto   │
│ senha_hash      │         │ descricao        │
│ cpf (UNIQUE)    │         │ area_conhecimento│
│ tipo            │         │ status           │
│ curso           │         │ arquivo_projeto  │
│ departamento    │         │ feedback         │
│ telefone        │         │ data_submissao   │
│ status          │         │ orientador_id(FK)│
│ data_cadastro   │         └──────────────────┘
└─────────────────┘                │
                                   │
                    ┌──────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   ORIENTACAO     │
         ├──────────────────┤
         │ id (PK)          │
         │ orientador_id(FK)│
         │ aluno_id (FK)    │
         │ inscricao_id(FK) │
         │ status           │
         │ data_inicio      │
         │ progresso        │
         └──────────────────┘
```

## 🎯 Modelos de Dados

### 1. Usuário (Usuario)

**Descrição**: Representa todos os usuários do sistema (alunos, orientadores, coordenadores)

```python
{
    "id": 1,
    "nome": "João Silva",
    "email": "joao.silva@ibmec.edu.br",
    "senha_hash": "$2b$12$...",  # Hash bcrypt
    "cpf": "123.456.789-00",
    "tipo": "aluno",  # aluno | orientador | coordenador
    "curso": "Administração",  # Para alunos
    "departamento": "Gestão",  # Para orientadores/coordenadores
    "telefone": "(21) 99999-9999",
    "status": "ativo",  # ativo | inativo | suspenso
    "data_cadastro": "2025-03-15T10:30:00"
}
```

**Validações**:
- Email: formato válido e único (@ibmec.edu.br)
- CPF: formato válido (###.###.###-##) e único
- Tipo: enum ['aluno', 'orientador', 'coordenador']
- Nome: mínimo 3 caracteres, máximo 200
- Telefone: formato brasileiro

**Índices**:
- PRIMARY KEY: id
- UNIQUE: email, cpf
- INDEX: tipo, status

---

### 2. Inscrição (Inscricao)

**Descrição**: Representa uma inscrição no programa de iniciação científica

```python
{
    "id": 1,
    "usuario_id": 1,
    "titulo_projeto": "Análise de Mercado Digital no E-commerce",
    "descricao": "Estudo sobre comportamento do consumidor...",
    "area_conhecimento": "Administração",
    "status": "em_analise",  # pendente | em_analise | aprovado | rejeitado
    "arquivo_projeto": "https://s3.../projeto-123.pdf",
    "feedback": "Projeto interessante, mas precisa de ajustes...",
    "data_submissao": "2025-03-15T14:20:00",
    "data_avaliacao": "2025-03-20T10:15:00",
    "avaliado_por": 3,  # ID do coordenador
    "orientador_id": 2  # ID do orientador atribuído
}
```

**Validações**:
- Título: mínimo 10 caracteres, máximo 200
- Descrição: mínimo 50 caracteres
- Status: enum ['pendente', 'em_analise', 'aprovado', 'rejeitado']
- Arquivo: formato PDF, máximo 5MB

**Relacionamentos**:
- FOREIGN KEY: usuario_id → usuarios.id
- FOREIGN KEY: orientador_id → usuarios.id (tipo='orientador')
- FOREIGN KEY: avaliado_por → usuarios.id (tipo='coordenador')

**Índices**:
- PRIMARY KEY: id
- INDEX: usuario_id, status, orientador_id

---

### 3. Orientação (Orientacao)

**Descrição**: Relacionamento entre orientador e aluno

```python
{
    "id": 1,
    "orientador_id": 2,
    "aluno_id": 1,
    "inscricao_id": 1,
    "status": "ativa",  # ativa | concluida | cancelada
    "data_inicio": "2025-06-01T00:00:00",
    "data_conclusao": null,
    "progresso": 65,  # Porcentagem 0-100
    "notas": "Aluno demonstra bom progresso..."
}
```

**Validações**:
- Progresso: integer entre 0 e 100
- Status: enum ['ativa', 'concluida', 'cancelada']

**Relacionamentos**:
- FOREIGN KEY: orientador_id → usuarios.id
- FOREIGN KEY: aluno_id → usuarios.id
- FOREIGN KEY: inscricao_id → inscricoes.id

---

### 4. Feedback/Mensagem (Mensagem)

**Descrição**: Mensagens trocadas entre orientador e aluno

```python
{
    "id": 1,
    "orientacao_id": 1,
    "remetente_id": 2,
    "destinatario_id": 1,
    "assunto": "Revisão do Capítulo 1",
    "mensagem": "Olá João, revisei o capítulo 1...",
    "lida": false,
    "data_envio": "2025-03-20T15:30:00",
    "data_leitura": null
}
```

**Relacionamentos**:
- FOREIGN KEY: orientacao_id → orientacoes.id
- FOREIGN KEY: remetente_id → usuarios.id
- FOREIGN KEY: destinatario_id → usuarios.id

---

### 5. Documento (Documento)

**Descrição**: Documentos e arquivos relacionados ao projeto

```python
{
    "id": 1,
    "inscricao_id": 1,
    "tipo": "proposta",  # proposta | relatorio_parcial | relatorio_final | artigo
    "titulo": "Proposta de Projeto - IC 2025",
    "arquivo_url": "https://s3.../documento-456.pdf",
    "versao": 1,
    "data_upload": "2025-03-15T14:20:00",
    "uploaded_by": 1
}
```

**Validações**:
- Tipo: enum ['proposta', 'relatorio_parcial', 'relatorio_final', 'artigo']
- Arquivo: formatos permitidos ['.pdf', '.doc', '.docx']

---

## 📝 Queries SQL Importantes

### Listar inscrições pendentes para coordenador
```sql
SELECT 
    i.id,
    u.nome as aluno_nome,
    u.email as aluno_email,
    i.titulo_projeto,
    i.data_submissao
FROM inscricoes i
JOIN usuarios u ON i.usuario_id = u.id
WHERE i.status = 'pendente'
ORDER BY i.data_submissao DESC;
```

### Listar alunos de um orientador
```sql
SELECT 
    u.nome as aluno_nome,
    i.titulo_projeto,
    o.progresso,
    o.status
FROM orientacoes o
JOIN usuarios u ON o.aluno_id = u.id
JOIN inscricoes i ON o.inscricao_id = i.id
WHERE o.orientador_id = ?
AND o.status = 'ativa'
ORDER BY u.nome;
```

### Estatísticas gerais
```sql
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'aprovado' THEN 1 ELSE 0 END) as aprovados,
    SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
    SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END) as rejeitados
FROM inscricoes;
```

## 🔄 Migrations (Alembic)

### Setup inicial
```bash
# Instalar Alembic
pip install alembic

# Inicializar
alembic init alembic

# Criar migration
alembic revision --autogenerate -m "create tables"

# Aplicar migrations
alembic upgrade head
```

### Exemplo de migration
```python
# alembic/versions/001_create_tables.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(200), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('senha_hash', sa.String(255), nullable=False),
        sa.Column('cpf', sa.String(14), nullable=True),
        sa.Column('tipo', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), server_default='ativo'),
        sa.Column('data_cadastro', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('cpf')
    )

def downgrade():
    op.drop_table('usuarios')
```

## 🎯 Dados de Teste (Seeds)

```python
# backend/seeds/seed_data.py
from models.database import Usuario, Inscricao, session

def seed_usuarios():
    usuarios = [
        Usuario(
            nome="João Silva",
            email="joao.silva@ibmec.edu.br",
            senha_hash=get_password_hash("senha123"),
            cpf="123.456.789-00",
            tipo="aluno",
            curso="Administração"
        ),
        Usuario(
            nome="Prof. Maria Santos",
            email="maria.santos@ibmec.edu.br",
            senha_hash=get_password_hash("senha123"),
            cpf="234.567.890-11",
            tipo="orientador",
            departamento="Gestão"
        )
    ]
    
    session.bulk_save_objects(usuarios)
    session.commit()

if __name__ == "__main__":
    seed_usuarios()
    print("✅ Dados de teste inseridos!")
```

## 🔐 Backup e Restore

### Backup PostgreSQL
```bash
pg_dump -U user -d ibmec_ic > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U user -d ibmec_ic < backup_20250315.sql
```

---

**Importante**: Esta estrutura é uma base. Adapte conforme as necessidades específicas do projeto!
