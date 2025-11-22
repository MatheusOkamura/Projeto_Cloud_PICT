"""
Script para refazer o cadastro do orientador (deletar e recriar)
"""
import sys
sys.path.append('.')
from database import SessionLocal
from models.database_models import Usuario, TipoUsuario, StatusUsuario
import hashlib

# Usar hash simples para evitar problemas com bcrypt
def hash_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

db = SessionLocal()

try:
    # 1. Deletar o orientador existente (Patricia Pereira)
    orientador_antigo = db.query(Usuario).filter(
        Usuario.email == "professor.teste@orientador.ibmec.edu.br"
    ).first()
    
    if orientador_antigo:
        print(f"🗑️  Deletando orientador: {orientador_antigo.nome}")
        db.delete(orientador_antigo)
        db.commit()
        print("✅ Orientador deletado!")
    else:
        print("⚠️  Orientador não encontrado com esse email")
    
    # 2. Criar novo orientador com dados completos
    print("\n📝 Criando novo orientador...")
    
    novo_orientador = Usuario(
        email="professor.teste@orientador.ibmec.edu.br",
        senha=hash_senha("senha123"),
        nome="Patricia Pereira",
        cpf="12345678901",
        telefone="(11) 99999-9999",
        tipo=TipoUsuario.orientador,
        status=StatusUsuario.ativo,
        departamento="Ciência da Computação",
        area_pesquisa="Inteligência Artificial e Machine Learning",
        titulacao="Doutora",
        vagas_disponiveis=5
    )
    
    db.add(novo_orientador)
    db.commit()
    
    print("\n" + "="*60)
    print("✅ Orientador recriado com sucesso!")
    print("="*60)
    print(f"Nome: {novo_orientador.nome}")
    print(f"Email: {novo_orientador.email}")
    print(f"Senha: senha123")
    print(f"Departamento: {novo_orientador.departamento}")
    print(f"Área de Pesquisa: {novo_orientador.area_pesquisa}")
    print(f"Titulação: {novo_orientador.titulacao}")
    print(f"Vagas Disponíveis: {novo_orientador.vagas_disponiveis}")
    print("="*60)
    
except Exception as e:
    print(f"❌ Erro: {e}")
    db.rollback()
finally:
    db.close()
