"""
Script para remover orientador.teste do banco de dados
"""

from database import SessionLocal
from models.database_models import Usuario

def remover_orientador_teste():
    """Remove orientador.teste"""
    db = SessionLocal()
    try:
        # Buscar e remover orientador.teste
        orientador = db.query(Usuario).filter(Usuario.nome == "orientador.teste").first()
        if orientador:
            print(f"Removendo: {orientador.nome} (ID: {orientador.id}, Email: {orientador.email})")
            db.delete(orientador)
            db.commit()
            print("\n✅ Orientador removido com sucesso!")
        else:
            print("orientador.teste não encontrado")
        
        # Listar orientadores restantes
        print("\n📋 Orientadores restantes no sistema:")
        orientadores = db.query(Usuario).filter(Usuario.tipo == "orientador").all()
        if orientadores:
            for ori in orientadores:
                print(f"  - {ori.nome} ({ori.email}) - Vagas: {ori.vagas_disponiveis or 0}")
        else:
            print("  Nenhum orientador no sistema")
            
    except Exception as e:
        print(f"❌ Erro ao remover orientador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("REMOVENDO ORIENTADOR.TESTE")
    print("=" * 60)
    remover_orientador_teste()
    print("=" * 60)
