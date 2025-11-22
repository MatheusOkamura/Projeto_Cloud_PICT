"""
Script para adicionar o campo apresentacao_sala na tabela projetos
"""

from database import engine
from sqlalchemy import text

def adicionar_campo_sala():
    with engine.connect() as conn:
        try:
            # Para SQLite, tentamos adicionar diretamente
            # Se a coluna já existir, vai dar erro e capturamos
            conn.execute(text("ALTER TABLE projetos ADD COLUMN apresentacao_sala VARCHAR"))
            conn.commit()
            print("✅ Coluna 'apresentacao_sala' adicionada com sucesso!")
            
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("✅ Coluna 'apresentacao_sala' já existe!")
            else:
                print(f"❌ Erro ao adicionar coluna: {e}")

if __name__ == "__main__":
    adicionar_campo_sala()
