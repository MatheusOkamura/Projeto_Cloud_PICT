"""
Script para adicionar o campo 'ano' nas tabelas principais do banco de dados.
Este campo será usado para filtrar dados por ano acadêmico da iniciação científica.
"""

import sqlite3
from datetime import datetime
from sqlalchemy import text
from database import engine, SessionLocal
import os

def adicionar_campo_ano_sqlite():
    """Adiciona o campo ano nas tabelas SQLite"""
    db_path = "iniciacao_cientifica.db"
    
    if not os.path.exists(db_path):
        print(f"✗ Banco de dados {db_path} não encontrado!")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    ano_atual = datetime.now().year
    
    try:
        print("\n" + "=" * 60)
        print("ADICIONANDO CAMPO 'ANO' NAS TABELAS")
        print("=" * 60)
        
        # Lista de tabelas e suas respectivas alterações
        tabelas = [
            {
                "nome": "inscricoes",
                "descricao": "Inscrições/Propostas de alunos",
            },
            {
                "nome": "projetos",
                "descricao": "Projetos de iniciação científica",
            },
            {
                "nome": "entregas",
                "descricao": "Entregas dos alunos (relatórios, artigos, etc)",
            },
            {
                "nome": "relatorios_mensais",
                "descricao": "Relatórios mensais dos orientadores",
            }
        ]
        
        for tabela in tabelas:
            nome_tabela = tabela["nome"]
            descricao = tabela["descricao"]
            
            print(f"\n📋 Tabela: {nome_tabela}")
            print(f"   Descrição: {descricao}")
            
            # Verificar se a coluna já existe
            cursor.execute(f"PRAGMA table_info({nome_tabela})")
            colunas = [col[1] for col in cursor.fetchall()]
            
            if "ano" in colunas:
                print(f"   ✓ Campo 'ano' já existe em {nome_tabela}")
                continue
            
            try:
                # Adicionar coluna ano com valor padrão do ano atual
                cursor.execute(f"""
                    ALTER TABLE {nome_tabela}
                    ADD COLUMN ano INTEGER DEFAULT {ano_atual}
                """)
                print(f"   ✓ Campo 'ano' adicionado em {nome_tabela}")
                
                # Atualizar registros existentes com o ano atual
                cursor.execute(f"""
                    UPDATE {nome_tabela}
                    SET ano = {ano_atual}
                    WHERE ano IS NULL
                """)
                registros_atualizados = cursor.rowcount
                print(f"   ✓ {registros_atualizados} registros atualizados com ano={ano_atual}")
                
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"   ✓ Campo 'ano' já existe em {nome_tabela}")
                else:
                    print(f"   ✗ Erro ao adicionar campo em {nome_tabela}: {e}")
        
        conn.commit()
        print("\n" + "=" * 60)
        print("✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print(f"\nAno padrão definido: {ano_atual}")
        print("Todos os registros existentes foram marcados com o ano atual.")
        print("\nAs seguintes tabelas agora possuem o campo 'ano':")
        for tabela in tabelas:
            print(f"  • {tabela['nome']}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Erro durante a migração: {e}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

def adicionar_campo_ano_postgres():
    """Adiciona o campo ano nas tabelas PostgreSQL"""
    db = SessionLocal()
    ano_atual = datetime.now().year
    
    try:
        print("\n" + "=" * 60)
        print("ADICIONANDO CAMPO 'ANO' NAS TABELAS (PostgreSQL)")
        print("=" * 60)
        
        tabelas = [
            {
                "nome": "inscricoes",
                "descricao": "Inscrições/Propostas de alunos",
            },
            {
                "nome": "projetos",
                "descricao": "Projetos de iniciação científica",
            },
            {
                "nome": "entregas",
                "descricao": "Entregas dos alunos (relatórios, artigos, etc)",
            },
            {
                "nome": "relatorios_mensais",
                "descricao": "Relatórios mensais dos orientadores",
            }
        ]
        
        for tabela in tabelas:
            nome_tabela = tabela["nome"]
            descricao = tabela["descricao"]
            
            print(f"\n📋 Tabela: {nome_tabela}")
            print(f"   Descrição: {descricao}")
            
            try:
                # Tentar adicionar a coluna
                db.execute(text(f"""
                    ALTER TABLE {nome_tabela}
                    ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT {ano_atual}
                """))
                
                print(f"   ✓ Campo 'ano' processado em {nome_tabela}")
                
                # Atualizar registros existentes
                result = db.execute(text(f"""
                    UPDATE {nome_tabela}
                    SET ano = {ano_atual}
                    WHERE ano IS NULL
                """))
                
                print(f"   ✓ {result.rowcount} registros atualizados com ano={ano_atual}")
                
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"   ✓ Campo 'ano' já existe em {nome_tabela}")
                else:
                    print(f"   ⚠ Aviso em {nome_tabela}: {e}")
        
        db.commit()
        print("\n" + "=" * 60)
        print("✓ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print(f"\nAno padrão definido: {ano_atual}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Erro durante a migração: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def verificar_tipo_banco():
    """Verifica qual tipo de banco está sendo usado"""
    database_url = os.getenv("DATABASE_URL", "sqlite:///./iniciacao_cientifica.db")
    
    if database_url.startswith("postgresql"):
        return "postgresql"
    else:
        return "sqlite"

if __name__ == "__main__":
    print("=" * 60)
    print("SCRIPT DE MIGRAÇÃO - ADICIONAR CAMPO ANO")
    print("=" * 60)
    print("\nEste script adiciona o campo 'ano' nas seguintes tabelas:")
    print("  • inscricoes")
    print("  • projetos")
    print("  • entregas")
    print("  • relatorios_mensais")
    print("\nO campo 'ano' será usado para filtrar dados por ano acadêmico.")
    print("\nTodos os registros existentes serão marcados com o ano atual.")
    print("=" * 60)
    
    tipo_banco = verificar_tipo_banco()
    print(f"\nTipo de banco detectado: {tipo_banco.upper()}")
    
    resposta = input("\nDeseja continuar? (s/n): ")
    
    if resposta.lower() == 's':
        if tipo_banco == "sqlite":
            sucesso = adicionar_campo_ano_sqlite()
        else:
            sucesso = adicionar_campo_ano_postgres()
        
        if sucesso:
            print("\n✓ Migração concluída! O campo 'ano' está disponível.")
            print("\nPróximos passos:")
            print("1. Atualize os models em database_models.py para incluir o campo 'ano'")
            print("2. Modifique as rotas da API para filtrar por ano quando necessário")
            print("3. Atualize o frontend para passar o ano selecionado nas requisições")
        else:
            print("\n✗ Migração falhou. Verifique os erros acima.")
    else:
        print("\nMigração cancelada pelo usuário.")
