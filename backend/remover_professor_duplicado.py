"""
Script para remover professor duplicado (Professor Novo Teste)
"""

from database import SessionLocal
from models.database_models import Usuario

def remover_professor_duplicado():
    """Remove Professor Novo Teste (duplicado do Lucas Nauer)"""
    db = SessionLocal()
    try:
        # Buscar e remover Professor Novo Teste
        prof_novo = db.query(Usuario).filter(Usuario.nome == "Professor Novo Teste").first()
        if prof_novo:
            print(f"Removendo: {prof_novo.nome} (ID: {prof_novo.id}, Email: {prof_novo.email})")
            db.delete(prof_novo)
            db.commit()
            print("\n✅ Professor duplicado removido com sucesso!")
        else:
            print("Professor Novo Teste não encontrado")
        
        # Listar orientadores restantes
        print("\n📋 Orientadores restantes no sistema:")
        orientadores = db.query(Usuario).filter(Usuario.tipo == "orientador").all()
        for ori in orientadores:
            print(f"  - {ori.nome} ({ori.email}) - Vagas: {ori.vagas_disponiveis or 0}")
            
    except Exception as e:
        print(f"❌ Erro ao remover professor: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("REMOVENDO PROFESSOR DUPLICADO")
    print("=" * 60)
    remover_professor_duplicado()
    print("=" * 60)
