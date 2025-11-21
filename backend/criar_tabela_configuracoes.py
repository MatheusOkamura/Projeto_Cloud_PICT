"""
Script para criar a tabela de configurações do sistema.
Esta tabela armazena configurações gerais como status das inscrições.
"""

from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Importar do database e models existentes
from database import Base, engine, SessionLocal
from models.database_models import ConfiguracaoSistema

def criar_tabela_configuracoes():
    """
    Cria a tabela de configurações se ela não existir.
    """
    print("🔧 Criando tabela de configurações do sistema...")
    
    try:
        # Criar todas as tabelas (incluindo a nova)
        Base.metadata.create_all(bind=engine)
        print("✅ Tabela 'configuracoes_sistema' criada com sucesso!")
        
        # Adicionar configuração padrão de inscrições abertas
        db = SessionLocal()
        try:
            # Verificar se já existe a configuração
            config_existente = db.query(ConfiguracaoSistema).filter(
                ConfiguracaoSistema.chave == 'inscricoes_abertas'
            ).first()
            
            if not config_existente:
                config = ConfiguracaoSistema(
                    chave='inscricoes_abertas',
                    valor='true',
                    descricao='Define se as inscrições para iniciação científica estão abertas',
                    data_atualizacao=datetime.now()
                )
                db.add(config)
                db.commit()
                print("✅ Configuração padrão 'inscricoes_abertas' criada!")
            else:
                print(f"ℹ️ Configuração 'inscricoes_abertas' já existe: {config_existente.valor}")
        
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")
        raise

if __name__ == "__main__":
    criar_tabela_configuracoes()
    print("\n✅ Processo concluído!")
