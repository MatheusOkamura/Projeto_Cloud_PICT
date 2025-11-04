"""
Script para criar a tabela de mensagens de relatório no banco de dados.
Este script cria a tabela MensagemRelatorio para o sistema de threading de mensagens.
"""
from database import SessionLocal, engine
from models.database_models import Base, MensagemRelatorio
from sqlalchemy import inspect

def criar_tabela_mensagens():
    """Cria a tabela de mensagens se ela não existir"""
    inspector = inspect(engine)
    
    # Verificar se a tabela já existe
    if 'mensagem_relatorio' in inspector.get_table_names():
        print("✅ Tabela 'mensagem_relatorio' já existe")
        return
    
    print("📦 Criando tabela 'mensagem_relatorio'...")
    
    # Criar apenas a tabela MensagemRelatorio
    MensagemRelatorio.__table__.create(engine)
    
    print("✅ Tabela 'mensagem_relatorio' criada com sucesso!")
    print("\nEstrutura da tabela:")
    print("- id: Integer (Primary Key)")
    print("- entrega_id: Integer (Foreign Key -> entregas.id)")
    print("- usuario_id: Integer (Foreign Key -> usuarios.id)")
    print("- mensagem: Text")
    print("- tipo_usuario: String (coordenador/orientador)")
    print("- data_criacao: DateTime")

if __name__ == "__main__":
    criar_tabela_mensagens()
