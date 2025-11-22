"""
Script para verificar os dados dos perfis de teste
"""

from database import SessionLocal
from models.database_models import Usuario

def verificar_perfis():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("VERIFICANDO PERFIS DE TESTE")
        print("=" * 60)
        
        # Buscar aluno teste
        aluno = db.query(Usuario).filter(Usuario.email.contains('aluno')).filter(Usuario.email.contains('teste')).first()
        
        if aluno:
            print("\n🎓 ALUNO TESTE:")
            print(f"  Email: {aluno.email}")
            print(f"  Nome: {aluno.nome or 'NÃO CADASTRADO'}")
            print(f"  CPF: {aluno.cpf or 'NÃO CADASTRADO'}")
            print(f"  Telefone: {aluno.telefone or 'NÃO CADASTRADO'}")
            print(f"  Curso: {aluno.curso or 'NÃO CADASTRADO'}")
            print(f"  Matrícula: {aluno.matricula or 'NÃO CADASTRADO'}")
            print(f"  Unidade: {aluno.unidade or 'NÃO CADASTRADO'}")
            print(f"  CR: {aluno.cr or 'NÃO CADASTRADO'}")
        else:
            print("\n❌ Aluno teste não encontrado")
        
        # Buscar coordenador teste
        coord = db.query(Usuario).filter(Usuario.email.contains('coordenador')).filter(Usuario.email.contains('teste')).first()
        
        if coord:
            print("\n👨‍💼 COORDENADOR TESTE:")
            print(f"  Email: {coord.email}")
            print(f"  Nome: {coord.nome or 'NÃO CADASTRADO'}")
            print(f"  CPF: {coord.cpf or 'NÃO CADASTRADO'}")
            print(f"  Telefone: {coord.telefone or 'NÃO CADASTRADO'}")
            print(f"  Departamento: {coord.departamento or 'NÃO CADASTRADO'}")
        else:
            print("\n❌ Coordenador teste não encontrado")
            
    finally:
        db.close()

if __name__ == "__main__":
    verificar_perfis()
