"""
Script para testar a conexão com o banco de dados PostgreSQL no Azure
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def test_connection():
    """Testa a conexão com o banco de dados"""
    
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        print("   Configure a variável DATABASE_URL no arquivo .env")
        return False
    
    print("🔍 Testando conexão com o banco de dados...")
    print(f"   URL: {database_url.split('@')[1] if '@' in database_url else 'local'}")
    print()
    
    try:
        # Criar engine
        engine = create_engine(database_url)
        
        # Testar conexão
        with engine.connect() as connection:
            # Testar query simples
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            
            print("✅ Conexão estabelecida com sucesso!")
            print(f"   Versão do PostgreSQL: {version.split(',')[0]}")
            
            # Verificar tabelas existentes
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            
            tables = result.fetchall()
            
            if tables:
                print(f"\n📊 Tabelas encontradas ({len(tables)}):")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("\n⚠️  Nenhuma tabela encontrada")
                print("   Execute 'python init_db.py' para criar as tabelas")
            
            return True
            
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados:")
        print(f"   {str(e)}")
        print()
        print("🔧 Verifique:")
        print("   1. A variável DATABASE_URL está correta no .env")
        print("   2. O servidor PostgreSQL está rodando")
        print("   3. As regras de firewall permitem sua conexão")
        print("   4. O usuário e senha estão corretos")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
