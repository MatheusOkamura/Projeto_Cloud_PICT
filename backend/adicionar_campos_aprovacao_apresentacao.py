"""
Script para adicionar campos de aprovação de apresentação na tabela projetos
"""

from database import engine
from sqlalchemy import text

def adicionar_campos_aprovacao_apresentacao():
    with engine.connect() as conn:
        try:
            # Adicionar campo status_apresentacao
            try:
                conn.execute(text("ALTER TABLE projetos ADD COLUMN status_apresentacao VARCHAR DEFAULT 'pendente'"))
                print("✅ Coluna 'status_apresentacao' adicionada com sucesso!")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print("✅ Coluna 'status_apresentacao' já existe!")
                else:
                    raise e
            
            # Adicionar campo feedback_apresentacao
            try:
                conn.execute(text("ALTER TABLE projetos ADD COLUMN feedback_apresentacao TEXT"))
                print("✅ Coluna 'feedback_apresentacao' adicionada com sucesso!")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print("✅ Coluna 'feedback_apresentacao' já existe!")
                else:
                    raise e
            
            # Adicionar campo data_avaliacao_apresentacao
            try:
                conn.execute(text("ALTER TABLE projetos ADD COLUMN data_avaliacao_apresentacao DATETIME"))
                print("✅ Coluna 'data_avaliacao_apresentacao' adicionada com sucesso!")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print("✅ Coluna 'data_avaliacao_apresentacao' já existe!")
                else:
                    raise e
            
            conn.commit()
            print("\n🎉 Todas as colunas foram processadas com sucesso!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Erro ao adicionar colunas: {e}")

if __name__ == "__main__":
    adicionar_campos_aprovacao_apresentacao()
