import sys
sys.path.append('.')
from database import SessionLocal
from models.database_models import Usuario, TipoUsuario

db = SessionLocal()

# Buscar Patricia Pereira
orientador = db.query(Usuario).filter_by(nome='Patricia Pereira').first()

if orientador:
    print(f"Nome: {orientador.nome}")
    print(f"Email: {orientador.email}")
    print(f"Area Pesquisa: {orientador.area_pesquisa}")
    print(f"Departamento: {orientador.departamento}")
    print(f"Titulacao: {orientador.titulacao}")
    print(f"Vagas Disponiveis: {orientador.vagas_disponiveis}")
else:
    print("Orientador nao encontrado")

# Listar todos os orientadores
print("\n--- Todos os orientadores ---")
orientadores = db.query(Usuario).filter_by(tipo=TipoUsuario.orientador).all()
for o in orientadores:
    print(f"ID: {o.id}, Nome: {o.nome}, Area: {o.area_pesquisa}")

db.close()
