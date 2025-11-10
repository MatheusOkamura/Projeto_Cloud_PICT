"""
Script para criar a tabela de relatórios mensais no banco de dados.
"""
from database import SessionLocal, engine
from models.database_models import Base, RelatorioMensal, MensagemRelatorio
from sqlalchemy import inspect

def criar_tabelas_relatorios():
    """Cria as tabelas de relatórios mensais e mensagens se não existirem"""
    inspector = inspect(engine)
    tabelas_existentes = inspector.get_table_names()
    
    print("📦 Verificando tabelas necessárias...\n")
    
    # Verificar e criar tabela relatorios_mensais
    if 'relatorios_mensais' in tabelas_existentes:
        print("✅ Tabela 'relatorios_mensais' já existe")
    else:
        print("📦 Criando tabela 'relatorios_mensais'...")
        RelatorioMensal.__table__.create(engine)
        print("✅ Tabela 'relatorios_mensais' criada com sucesso!")
        print("\nEstrutura da tabela:")
        print("- id: Integer (Primary Key)")
        print("- projeto_id: Integer (Foreign Key -> projetos.id)")
        print("- mes: String (formato: YYYY-MM)")
        print("- descricao: Text")
        print("- arquivo: String (caminho do arquivo)")
        print("- data_envio: DateTime")
    
    # Verificar e criar tabela mensagens_relatorios
    if 'mensagens_relatorios' in tabelas_existentes:
        print("\n✅ Tabela 'mensagens_relatorios' já existe")
    else:
        print("\n📦 Criando tabela 'mensagens_relatorios'...")
        MensagemRelatorio.__table__.create(engine)
        print("✅ Tabela 'mensagens_relatorios' criada com sucesso!")
        print("\nEstrutura da tabela:")
        print("- id: Integer (Primary Key)")
        print("- relatorio_id: Integer (Foreign Key -> relatorios_mensais.id)")
        print("- remetente_id: Integer (Foreign Key -> usuarios.id)")
        print("- remetente_tipo: String (orientador/coordenador)")
        print("- mensagem: Text")
        print("- data_envio: DateTime")
    
    print("\n✅ Todas as tabelas verificadas/criadas com sucesso!")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   CRIAÇÃO DE TABELAS - RELATÓRIOS MENSAIS")
    print("="*60 + "\n")
    criar_tabelas_relatorios()
