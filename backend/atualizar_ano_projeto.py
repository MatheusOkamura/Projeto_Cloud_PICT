"""
Script para atualizar o ano de um projeto específico.
Útil para testes e demonstrações.
"""

from database import SessionLocal
from models.database_models import Projeto

def atualizar_ano_projeto(projeto_id: int, novo_ano: int):
    """Atualiza o ano de um projeto específico."""
    db = SessionLocal()
    try:
        projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
        
        if not projeto:
            print(f"❌ Projeto com ID {projeto_id} não encontrado!")
            return
        
        ano_antigo = projeto.ano
        projeto.ano = novo_ano
        db.commit()
        
        print(f"✅ Projeto '{projeto.titulo}' atualizado:")
        print(f"   Ano anterior: {ano_antigo}")
        print(f"   Novo ano: {novo_ano}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao atualizar projeto: {e}")
    finally:
        db.close()

def listar_projetos():
    """Lista todos os projetos com seus anos."""
    db = SessionLocal()
    try:
        projetos = db.query(Projeto).all()
        print("\n📋 Projetos existentes:")
        print("-" * 60)
        for p in projetos:
            print(f"ID: {p.id} | Ano: {p.ano} | Título: {p.titulo}")
        print("-" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("📋 Uso:")
        print("   python atualizar_ano_projeto.py listar")
        print("   python atualizar_ano_projeto.py <projeto_id> <novo_ano>")
        print("\nExemplos:")
        print("   python atualizar_ano_projeto.py listar")
        print("   python atualizar_ano_projeto.py 1 2026")
        sys.exit(1)
    
    if sys.argv[1] == "listar":
        listar_projetos()
    else:
        try:
            projeto_id = int(sys.argv[1])
            novo_ano = int(sys.argv[2])
            atualizar_ano_projeto(projeto_id, novo_ano)
        except ValueError:
            print("❌ Erro: projeto_id e novo_ano devem ser números inteiros")
        except IndexError:
            print("❌ Erro: Forneça o ID do projeto e o novo ano")
