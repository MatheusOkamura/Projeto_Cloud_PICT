"""
Script para adicionar campos de apresentação na amostra ao modelo Projeto
"""
from database import engine, SessionLocal
from sqlalchemy import text

def adicionar_campos_amostra():
    """Adiciona os campos de apresentação na amostra na tabela projetos"""
    db = SessionLocal()
    
    try:
        print("🔧 Adicionando campos de apresentação na amostra...")
        
        # Lista de campos a adicionar
        campos = [
            ("amostra_data", "VARCHAR", None),
            ("amostra_hora", "VARCHAR", None),
            ("amostra_campus", "VARCHAR", None),
            ("amostra_sala", "VARCHAR", None),
            ("status_amostra", "VARCHAR", "'pendente'"),
        ]
        
        for campo, tipo, default in campos:
            try:
                # Verifica se o campo já existe
                check_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='projetos' AND column_name='{campo}'
                """)
                result = db.execute(check_query).fetchone()
                
                if result:
                    print(f"  ✓ Campo '{campo}' já existe")
                else:
                    # Adiciona o campo
                    if default:
                        alter_query = text(f"ALTER TABLE projetos ADD COLUMN {campo} {tipo} DEFAULT {default}")
                    else:
                        alter_query = text(f"ALTER TABLE projetos ADD COLUMN {campo} {tipo}")
                    
                    db.execute(alter_query)
                    db.commit()
                    print(f"  ✓ Campo '{campo}' adicionado com sucesso")
                    
            except Exception as e:
                print(f"  ⚠ Erro ao adicionar campo '{campo}': {str(e)}")
                db.rollback()
                continue
        
        print("✅ Migração concluída!")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar campos de apresentação na amostra")
    print("=" * 60)
    adicionar_campos_amostra()
