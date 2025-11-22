"""
Script para atualizar a lista de cursos no banco de dados.
"""

from database import SessionLocal
from models.database_models import Curso

def atualizar_cursos():
    """Atualiza a tabela de cursos com a nova lista"""
    db = SessionLocal()
    try:
        print("Atualizando cursos no banco de dados...")
        
        # Desativar todos os cursos antigos
        db.query(Curso).update({"ativo": 0})
        
        # Nova lista de cursos
        novos_cursos = [
            {"nome": "Administração", "codigo": "ADM"},
            {"nome": "Ciência de Dados e Inteligência Artificial", "codigo": "CDIA"},
            {"nome": "Ciências Econômicas", "codigo": "ECO"},
            {"nome": "Ciências Contábeis", "codigo": "CONT"},
            {"nome": "Engenharia da Computação", "codigo": "ECOMP"},
            {"nome": "Engenharia de Software", "codigo": "ESOFT"},
            {"nome": "Engenharia da Produção", "codigo": "EPROD"},
            {"nome": "Relações Internacionais", "codigo": "RI"},
            {"nome": "Direito", "codigo": "DIR"},
        ]
        
        # Inserir ou atualizar cada curso
        for curso_data in novos_cursos:
            # Verificar se o curso já existe
            curso_existente = db.query(Curso).filter(
                Curso.codigo == curso_data["codigo"]
            ).first()
            
            if curso_existente:
                # Atualizar curso existente
                curso_existente.nome = curso_data["nome"]
                curso_existente.ativo = 1
                print(f"✓ Curso atualizado: {curso_data['nome']}")
            else:
                # Criar novo curso
                novo_curso = Curso(**curso_data, ativo=1)
                db.add(novo_curso)
                print(f"✓ Curso criado: {curso_data['nome']}")
        
        db.commit()
        print(f"\n✓ {len(novos_cursos)} cursos atualizados com sucesso!")
        
        # Listar cursos ativos
        print("\n📋 Cursos ativos no sistema:")
        cursos_ativos = db.query(Curso).filter(Curso.ativo == 1).order_by(Curso.nome).all()
        for i, curso in enumerate(cursos_ativos, 1):
            print(f"  {i}. {curso.nome} ({curso.codigo})")
            
    except Exception as e:
        print(f"✗ Erro ao atualizar cursos: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("ATUALIZANDO LISTA DE CURSOS")
    print("=" * 60)
    
    atualizar_cursos()
    
    print("\n" + "=" * 60)
    print("✓ Atualização concluída!")
    print("=" * 60)
