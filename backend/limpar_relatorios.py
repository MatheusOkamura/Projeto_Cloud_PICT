"""
Script para limpar relatórios mensais e mensagens do banco de dados
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine
from models.database_models import Entrega, MensagemRelatorio, RelatorioMensal
import sys

def limpar_relatorios_mensais():
    """Remove todos os relatórios mensais (tipo entrega e tabela específica)"""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("   LIMPEZA DE RELATÓRIOS MENSAIS")
        print("="*60 + "\n")
        
        # Contar relatórios tipo entrega
        entregas_mensais = db.query(Entrega).filter(Entrega.tipo == "relatorio_mensal").count()
        
        # Contar mensagens de relatórios
        mensagens_count = db.query(MensagemRelatorio).count()
        
        # Contar relatórios na tabela relatorios_mensais
        try:
            relatorios_count = db.query(RelatorioMensal).count()
        except:
            relatorios_count = 0
        
        total = entregas_mensais + mensagens_count + relatorios_count
        
        if total == 0:
            print("ℹ️  Não há relatórios mensais no banco de dados")
            return
        
        print(f"📊 Dados encontrados:")
        print(f"   - Entregas de relatórios mensais: {entregas_mensais}")
        print(f"   - Mensagens de relatórios: {mensagens_count}")
        print(f"   - Relatórios mensais (tabela específica): {relatorios_count}")
        print(f"   TOTAL: {total} registro(s)\n")
        
        confirmacao = input("⚠️  Confirma a exclusão? Digite 'SIM': ")
        
        if confirmacao != "SIM":
            print("❌ Operação cancelada")
            return
        
        # 1. Deletar mensagens de relatórios
        if mensagens_count > 0:
            db.execute(text("DELETE FROM mensagens_relatorios"))
            print(f"✓ {mensagens_count} mensagem(ns) deletada(s)")
        
        # 2. Deletar relatórios mensais da tabela específica
        if relatorios_count > 0:
            try:
                db.execute(text("DELETE FROM relatorios_mensais"))
                print(f"✓ {relatorios_count} relatório(s) mensal(is) deletado(s) da tabela específica")
            except Exception as e:
                print(f"⚠️  Aviso ao deletar relatórios mensais: {e}")
        
        # 3. Deletar entregas do tipo relatorio_mensal
        if entregas_mensais > 0:
            db.execute(text("DELETE FROM entregas WHERE tipo = 'relatorio_mensal'"))
            print(f"✓ {entregas_mensais} entrega(s) de relatório mensal deletada(s)")
        
        db.commit()
        print("\n✅ Limpeza concluída com sucesso!")
        print("   O sistema agora está pronto para novos relatórios mensais")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao limpar relatórios: {str(e)}")
    finally:
        db.close()

def listar_relatorios():
    """Lista todos os relatórios mensais no banco"""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("   RELATÓRIOS MENSAIS NO SISTEMA")
        print("="*60 + "\n")
        
        # Listar entregas de relatórios mensais
        entregas = db.query(Entrega).filter(Entrega.tipo == "relatorio_mensal").all()
        
        if entregas:
            print(f"📄 Entregas de Relatórios Mensais: {len(entregas)}\n")
            for e in entregas:
                print(f"ID: {e.id}")
                print(f"   Projeto: {e.projeto_id}")
                print(f"   Título: {e.titulo}")
                print(f"   Data: {e.data_entrega}")
                print(f"   Descrição: {e.descricao[:50] if e.descricao else 'N/A'}...")
                print()
        else:
            print("ℹ️  Nenhuma entrega de relatório mensal encontrada")
        
        # Listar mensagens
        mensagens = db.query(MensagemRelatorio).all()
        if mensagens:
            print(f"\n💬 Mensagens de Relatórios: {len(mensagens)}\n")
            for m in mensagens[:5]:  # Mostrar apenas as 5 primeiras
                print(f"ID: {m.id}")
                print(f"   Entrega: {m.entrega_id}")
                print(f"   Tipo: {m.tipo_usuario}")
                print(f"   Mensagem: {m.mensagem[:50]}...")
                print()
            if len(mensagens) > 5:
                print(f"   ... e mais {len(mensagens) - 5} mensagem(ns)")
        else:
            print("\nℹ️  Nenhuma mensagem encontrada")
        
        # Listar relatórios da tabela específica
        try:
            relatorios = db.query(RelatorioMensal).all()
            if relatorios:
                print(f"\n📊 Relatórios Mensais (Tabela Específica): {len(relatorios)}\n")
                for r in relatorios:
                    print(f"ID: {r.id}")
                    print(f"   Projeto: {r.projeto_id}")
                    print(f"   Mês: {r.mes}")
                    print(f"   Data: {r.data_envio}")
                    print()
            else:
                print("\nℹ️  Nenhum relatório mensal encontrado na tabela específica")
        except Exception as e:
            print(f"\n⚠️  Tabela relatorios_mensais não existe ou erro: {e}")
        
    except Exception as e:
        print(f"❌ Erro ao listar relatórios: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   GERENCIAMENTO DE RELATÓRIOS MENSAIS")
    print("="*60 + "\n")
    
    if len(sys.argv) > 1:
        opcao = sys.argv[1]
    else:
        print("Escolha uma opção:")
        print("1 - Listar relatórios mensais")
        print("2 - Deletar TODOS os relatórios mensais")
        print("0 - Sair")
        opcao = input("\nOpção: ")
    
    if opcao == "1":
        listar_relatorios()
    elif opcao == "2":
        limpar_relatorios_mensais()
    else:
        print("Saindo...")
