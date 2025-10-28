"""
Script para adicionar campos de aprovação na tabela de entregas
"""
import sqlite3
from pathlib import Path

# Caminho do banco de dados
db_path = Path("backend/iniciacao_cientifica.db")

if not db_path.exists():
    print(f"❌ Banco de dados não encontrado: {db_path}")
    exit(1)

print(f"📂 Conectando ao banco: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Verificar se as colunas já existem
    cursor.execute("PRAGMA table_info(entregas)")
    columns = [col[1] for col in cursor.fetchall()]
    
    alteracoes_necessarias = []
    
    # Adicionar status_aprovacao_orientador se não existir
    if 'status_aprovacao_orientador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN status_aprovacao_orientador TEXT DEFAULT 'pendente'"
        )
    
    # Adicionar feedback_orientador se não existir
    if 'feedback_orientador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN feedback_orientador TEXT"
        )
    
    # Adicionar data_avaliacao_orientador se não existir
    if 'data_avaliacao_orientador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN data_avaliacao_orientador DATETIME"
        )
    
    # Adicionar status_aprovacao_coordenador se não existir
    if 'status_aprovacao_coordenador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN status_aprovacao_coordenador TEXT DEFAULT 'pendente'"
        )
    
    # Adicionar feedback_coordenador se não existir
    if 'feedback_coordenador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN feedback_coordenador TEXT"
        )
    
    # Adicionar data_avaliacao_coordenador se não existir
    if 'data_avaliacao_coordenador' not in columns:
        alteracoes_necessarias.append(
            "ALTER TABLE entregas ADD COLUMN data_avaliacao_coordenador DATETIME"
        )
    
    if not alteracoes_necessarias:
        print("✅ Tabela já está atualizada!")
    else:
        print(f"🔧 Executando {len(alteracoes_necessarias)} alterações...")
        for sql in alteracoes_necessarias:
            print(f"   Executando: {sql}")
            cursor.execute(sql)
        
        conn.commit()
        print("✅ Migração concluída com sucesso!")
        
        # Mostrar estrutura atualizada
        cursor.execute("PRAGMA table_info(entregas)")
        print("\n📋 Estrutura atualizada da tabela 'entregas':")
        for col in cursor.fetchall():
            print(f"   - {col[1]} ({col[2]})")

except Exception as e:
    print(f"❌ Erro durante a migração: {e}")
    conn.rollback()
finally:
    conn.close()
    print("\n🔒 Conexão fechada")
