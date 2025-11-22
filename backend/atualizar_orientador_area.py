import sys
sys.path.append('.')
from database import SessionLocal
from models.database_models import Usuario, TipoUsuario

db = SessionLocal()

# Atualizar Patricia Pereira com área de pesquisa
orientador = db.query(Usuario).filter_by(nome='Patricia Pereira').first()

if orientador:
    print(f"Atualizando orientador: {orientador.nome}")
    print(f"Area Pesquisa atual: {orientador.area_pesquisa}")
    
    # Atualizar campos
    orientador.area_pesquisa = "Ciência de Dados, Inteligência Artificial e Machine Learning"
    orientador.titulacao = "Doutora"
    orientador.vagas_disponiveis = 5
    
    db.commit()
    
    print(f"\nArea Pesquisa atualizada: {orientador.area_pesquisa}")
    print(f"Titulacao: {orientador.titulacao}")
    print(f"Vagas Disponiveis: {orientador.vagas_disponiveis}")
    print("\n✅ Orientador atualizado com sucesso!")
else:
    print("❌ Orientador nao encontrado")

db.close()
