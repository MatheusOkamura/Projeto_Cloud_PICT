from database import SessionLocal
from models.database_models import Inscricao, Projeto

db = SessionLocal()

print("=== INSCRIÇÕES ===")
inscricoes = db.query(Inscricao).all()
print(f"Total: {len(inscricoes)}\n")

for i in inscricoes:
    print(f"ID: {i.id}")
    print(f"  Nome: {i.nome}")
    print(f"  Status: {i.status}")
    print(f"  Usuario ID: {i.usuario_id}")
    print(f"  Projeto Título: {i.titulo_projeto}")
    print()

print("\n=== PROJETOS ===")
projetos = db.query(Projeto).all()
print(f"Total: {len(projetos)}\n")

for p in projetos:
    print(f"ID: {p.id}")
    print(f"  Aluno ID: {p.aluno_id}")
    print(f"  Inscricao ID: {p.inscricao_id}")
    print(f"  Etapa Atual: {p.etapa_atual}")
    print(f"  Título: {p.titulo}")
    print()

db.close()
