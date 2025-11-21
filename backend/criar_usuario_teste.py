"""
Script para criar usuários de teste no banco de dados local
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.database_models import Base, Usuario, TipoUsuario, StatusUsuario
from passlib.context import CryptContext

# Configurar hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def criar_usuario_teste():
    """Cria usuários de teste para desenvolvimento local"""
    
    # Criar tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar se já existe um coordenador
        coordenador_existe = db.query(Usuario).filter(
            Usuario.tipo == TipoUsuario.coordenador
        ).first()
        
        if coordenador_existe:
            print("✅ Coordenador já existe no banco de dados")
            print(f"   Email: {coordenador_existe.email}")
        else:
            # Criar coordenador de teste
            coordenador = Usuario(
                email="coordenador@ibmec.edu.br",
                senha=pwd_context.hash("senha123"),
                nome="Coordenador Teste",
                cpf="00000000000",
                telefone="(11) 00000-0000",
                tipo=TipoUsuario.coordenador,
                status=StatusUsuario.ativo
            )
            db.add(coordenador)
            print("✅ Coordenador criado!")
            print("   Email: coordenador@ibmec.edu.br")
            print("   Senha: senha123")
        
        # Verificar se já existe um orientador
        orientador_existe = db.query(Usuario).filter(
            Usuario.tipo == TipoUsuario.orientador
        ).first()
        
        if orientador_existe:
            print("✅ Orientador já existe no banco de dados")
            print(f"   Email: {orientador_existe.email}")
        else:
            # Criar orientador de teste
            orientador = Usuario(
                email="orientador@ibmec.edu.br",
                senha=pwd_context.hash("senha123"),
                nome="Prof. Orientador Teste",
                cpf="11111111111",
                telefone="(11) 11111-1111",
                tipo=TipoUsuario.orientador,
                status=StatusUsuario.ativo,
                departamento="Ciência da Computação",
                area_pesquisa="Inteligência Artificial",
                titulacao="Doutor",
                vagas_disponiveis=5
            )
            db.add(orientador)
            print("✅ Orientador criado!")
            print("   Email: orientador@ibmec.edu.br")
            print("   Senha: senha123")
        
        # Verificar se já existe um aluno
        aluno_existe = db.query(Usuario).filter(
            Usuario.tipo == TipoUsuario.aluno
        ).first()
        
        if aluno_existe:
            print("✅ Aluno já existe no banco de dados")
            print(f"   Email: {aluno_existe.email}")
        else:
            # Criar aluno de teste
            aluno = Usuario(
                email="aluno@alunos.ibmec.edu.br",
                senha=pwd_context.hash("senha123"),
                nome="Aluno Teste",
                cpf="22222222222",
                telefone="(11) 22222-2222",
                tipo=TipoUsuario.aluno,
                status=StatusUsuario.ativo,
                curso="Ciência da Computação",
                unidade="Faria Lima",
                matricula="2024001",
                cr=8.5
            )
            db.add(aluno)
            print("✅ Aluno criado!")
            print("   Email: aluno@alunos.ibmec.edu.br")
            print("   Senha: senha123")
        
        db.commit()
        
        print("\n" + "="*50)
        print("🎉 Usuários de teste criados com sucesso!")
        print("="*50)
        print("\n📝 Credenciais para login:")
        print("\nCoordenador:")
        print("  Email: coordenador@ibmec.edu.br")
        print("  Senha: senha123")
        print("\nOrientador:")
        print("  Email: orientador@ibmec.edu.br")
        print("  Senha: senha123")
        print("\nAluno:")
        print("  Email: aluno@alunos.ibmec.edu.br")
        print("  Senha: senha123")
        print("\n⚠️  Nota: Como o OAuth Microsoft não está configurado,")
        print("use o endpoint de login legado: POST /api/auth/legacy-login")
        print("ou implemente um formulário de login simples no frontend.")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    criar_usuario_teste()
