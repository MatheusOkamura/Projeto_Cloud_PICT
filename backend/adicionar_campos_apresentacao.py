"""
Script para adicionar campos de apresentação à tabela de projetos
"""
from database import SessionLocal, engine
from sqlalchemy import text

def adicionar_campos_apresentacao():
    db = SessionLocal()
    try:
        # Adicionar campos de apresentação
        campos = [
            "ALTER TABLE projetos ADD COLUMN apresentacao_data TEXT",
            "ALTER TABLE projetos ADD COLUMN apresentacao_hora TEXT",
            "ALTER TABLE projetos ADD COLUMN apresentacao_campus TEXT",
        ]
        
        for comando in campos:
            try:
                db.execute(text(comando))
                print(f"✓ Executado: {comando}")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print(f"⚠ Campo já existe: {comando}")
                else:
                    print(f"✗ Erro: {comando} - {e}")
        
        db.commit()
        print("\n✅ Campos de apresentação adicionados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao adicionar campos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    adicionar_campos_apresentacao()
