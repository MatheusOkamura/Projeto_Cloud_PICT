"""
Script para adicionar campo 'ano' na tabela configuracoes_sistema
e criar configuração específica para o ano ativo das inscrições.
"""
from database import SessionLocal, engine
from models.database_models import ConfiguracaoSistema
from sqlalchemy import text
from datetime import datetime

def adicionar_campo_ano():
    db = SessionLocal()
    try:
        print("🔧 Adicionando campo 'ano' na tabela configuracoes_sistema...")
        
        # Adicionar coluna 'ano' se não existir
        try:
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE configuracoes_sistema ADD COLUMN ano INTEGER"
                ))
                conn.commit()
            print("✅ Coluna 'ano' adicionada com sucesso!")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("ℹ️  Coluna 'ano' já existe.")
            else:
                raise e
        
        # Atualizar configuração existente 'inscricoes_abertas' para ter ano
        config_existente = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'inscricoes_abertas'
        ).first()
        
        if config_existente and not hasattr(config_existente, 'ano'):
            # Se a configuração existe mas não tem ano, adicionar ano atual
            db.execute(text(
                "UPDATE configuracoes_sistema SET ano = :ano WHERE chave = 'inscricoes_abertas'"
            ), {"ano": datetime.now().year})
            db.commit()
            print(f"✅ Ano {datetime.now().year} atribuído à configuração existente!")
        
        # Criar configuração para 'ano_ativo_inscricoes' se não existir
        config_ano_ativo = db.query(ConfiguracaoSistema).filter(
            ConfiguracaoSistema.chave == 'ano_ativo_inscricoes'
        ).first()
        
        if not config_ano_ativo:
            nova_config = ConfiguracaoSistema(
                chave='ano_ativo_inscricoes',
                valor=str(datetime.now().year),
                descricao='Ano ativo para as inscrições de iniciação científica',
                data_atualizacao=datetime.now()
            )
            db.add(nova_config)
            db.commit()
            print(f"✅ Configuração 'ano_ativo_inscricoes' criada com ano {datetime.now().year}!")
        else:
            print(f"ℹ️  Configuração 'ano_ativo_inscricoes' já existe (ano: {config_ano_ativo.valor}).")
        
        print("✅ Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    adicionar_campo_ano()
