"""
Script para inicializar o banco de dados SQLite com dados iniciais.
Execute este arquivo para criar as tabelas e popular com dados de exemplo.
"""

from database import engine, SessionLocal, Base
from models.database_models import Usuario, Curso, TipoUsuario, StatusUsuario
from datetime import datetime

def init_database():
    """Cria todas as tabelas no banco de dados"""
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tabelas criadas com sucesso!")

def seed_cursos():
    """Popula a tabela de cursos"""
    db = SessionLocal()
    try:
        # Verificar se já existem cursos
        existing = db.query(Curso).first()
        if existing:
            print("✓ Cursos já existem no banco de dados")
            return
        
        cursos = [
            {"nome": "Administração", "codigo": "ADM"},
            {"nome": "Ciência da Computação", "codigo": "CC"},
            {"nome": "Direito", "codigo": "DIR"},
            {"nome": "Economia", "codigo": "ECO"},
            {"nome": "Engenharia de Produção", "codigo": "EP"},
            {"nome": "Jornalismo", "codigo": "JOR"},
            {"nome": "Relações Internacionais", "codigo": "RI"},
            {"nome": "Sistemas de Informação", "codigo": "SI"},
        ]
        
        print("Inserindo cursos...")
        for curso_data in cursos:
            curso = Curso(**curso_data)
            db.add(curso)
        
        db.commit()
        print(f"✓ {len(cursos)} cursos inseridos com sucesso!")
    except Exception as e:
        print(f"✗ Erro ao inserir cursos: {e}")
        db.rollback()
    finally:
        db.close()

def seed_usuarios():
    """Popula a tabela de usuários com exemplos"""
    db = SessionLocal()
    try:
        # Verificar se já existem usuários
        existing = db.query(Usuario).first()
        if existing:
            print("✓ Usuários já existem no banco de dados")
            return
        
        usuarios = [
            {
                "email": "aluno@alunos.ibmec.edu.br",
                "senha": "senha123",  # Em produção, usar hash
                "nome": "João Silva",
                "cpf": "123.456.789-00",
                "telefone": "(11) 98765-4321",
                "tipo": TipoUsuario.aluno,
                "status": StatusUsuario.ativo,
                "curso": "Administração",
                "unidade": "Faria Lima",
                "matricula": "2024001",
                "cr": 8.5,
                "data_cadastro": datetime.now()
            },
            {
                "email": "orientador@orientador.ibmec.edu.br",
                "senha": "senha123",
                "nome": "Prof. Maria Santos",
                "cpf": "987.654.321-00",
                "telefone": "(11) 91234-5678",
                "tipo": TipoUsuario.orientador,
                "status": StatusUsuario.ativo,
                "departamento": "Gestão",
                "area_pesquisa": "Marketing Digital",
                "titulacao": "Doutora",
                "vagas_disponiveis": 3,
                "data_cadastro": datetime.now()
            },
            {
                "email": "coordenador@coordenador.ibmec.edu.br",
                "senha": "senha123",
                "nome": "Prof. Dr. Carlos Oliveira",
                "cpf": "111.222.333-44",
                "telefone": "(11) 99999-8888",
                "tipo": TipoUsuario.coordenador,
                "status": StatusUsuario.ativo,
                "departamento": "Coordenação de Pesquisa",
                "titulacao": "Doutor",
                "data_cadastro": datetime.now()
            }
        ]
        
        print("Inserindo usuários de exemplo...")
        for user_data in usuarios:
            usuario = Usuario(**user_data)
            db.add(usuario)
        
        db.commit()
        print(f"✓ {len(usuarios)} usuários inseridos com sucesso!")
    except Exception as e:
        print(f"✗ Erro ao inserir usuários: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("INICIALIZANDO BANCO DE DADOS SQLITE")
    print("=" * 50)
    
    # Criar tabelas
    init_database()
    
    # Popular com dados iniciais
    seed_cursos()
    seed_usuarios()
    
    print("\n" + "=" * 50)
    print("✓ Banco de dados inicializado com sucesso!")
    print("=" * 50)
    print("\nArquivo do banco: iniciacao_cientifica.db")
    print("Para visualizar o banco, use uma ferramenta como DB Browser for SQLite")
