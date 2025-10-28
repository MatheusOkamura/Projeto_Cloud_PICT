"""
Script para remover professores específicos do banco de dados
"""

from database import SessionLocal
from models.database_models import Usuario

def remover_professores():
    """Remove Prof. Maria Santos e Professor Teste da Silva"""
    db = SessionLocal()
    try:
        # Buscar e remover Prof. Maria Santos
        maria = db.query(Usuario).filter(Usuario.nome == "Prof. Maria Santos").first()
        if maria:
            print(f"Removendo: {maria.nome} (ID: {maria.id})")
            db.delete(maria)
        else:
            print("Prof. Maria Santos não encontrada")
        
        # Buscar e remover Professor Teste da Silva
        teste_silva = db.query(Usuario).filter(Usuario.nome == "Professor Teste da Silva").first()
        if teste_silva:
            print(f"Removendo: {teste_silva.nome} (ID: {teste_silva.id})")
            db.delete(teste_silva)
        else:
            print("Professor Teste da Silva não encontrado")
        
        db.commit()
        print("\n✅ Professores removidos com sucesso!")
        
        # Listar orientadores restantes
        print("\n📋 Orientadores restantes no sistema:")
        orientadores = db.query(Usuario).filter(Usuario.tipo == "orientador").all()
        for ori in orientadores:
            print(f"  - {ori.nome} ({ori.email}) - Vagas: {ori.vagas_disponiveis or 0}")
            
    except Exception as e:
        print(f"❌ Erro ao remover professores: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("REMOVENDO PROFESSORES DO BANCO DE DADOS")
    print("=" * 60)
    remover_professores()
    print("=" * 60)
