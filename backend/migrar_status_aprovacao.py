"""
Script para migrar o banco de dados para o novo sistema de aprovação em duas etapas.
Adiciona novas colunas e atualiza status existentes.
"""
from sqlalchemy import text
from database import SessionLocal, engine
from models.database_models import Inscricao, StatusInscricao
import sys

def migrar_banco():
    """Adiciona as novas colunas ao banco de dados"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("   MIGRAÇÃO: Sistema de Aprovação em Duas Etapas")
        print("="*70 + "\n")
        
        # Adicionar novas colunas se não existirem
        print("📝 Adicionando novas colunas...")
        
        colunas_novas = [
            ("feedback_orientador", "TEXT"),
            ("feedback_coordenador", "TEXT"),
            ("data_avaliacao_orientador", "TIMESTAMP"),
            ("data_avaliacao_coordenador", "TIMESTAMP")
        ]
        
        for coluna, tipo in colunas_novas:
            try:
                db.execute(text(f"ALTER TABLE inscricoes ADD COLUMN {coluna} {tipo}"))
                print(f"   ✅ Coluna '{coluna}' adicionada")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print(f"   ℹ️  Coluna '{coluna}' já existe")
                else:
                    print(f"   ⚠️  Erro ao adicionar coluna '{coluna}': {str(e)}")
        
        db.commit()
        
        # Atualizar status existentes
        print("\n🔄 Atualizando status das inscrições existentes...")
        
        inscricoes = db.query(Inscricao).all()
        total = len(inscricoes)
        
        if total == 0:
            print("   ℹ️  Não há inscrições para migrar")
        else:
            print(f"   Encontradas {total} inscrição(ões)\n")
            
            for inscricao in inscricoes:
                status_antigo = inscricao.status.value if hasattr(inscricao.status, 'value') else str(inscricao.status)
                
                # Mapear status antigos para novos
                if status_antigo == "pendente":
                    inscricao.status = StatusInscricao.pendente_orientador
                    print(f"   ID {inscricao.id}: pendente → pendente_orientador")
                
                elif status_antigo == "aprovada":
                    # Propostas já aprovadas permanecem aprovadas
                    inscricao.status = StatusInscricao.aprovada
                    print(f"   ID {inscricao.id}: aprovada (mantido)")
                
                elif status_antigo == "rejeitada":
                    # Propostas rejeitadas migram para rejeitada_coordenador (decisão final)
                    inscricao.status = StatusInscricao.rejeitada_coordenador
                    print(f"   ID {inscricao.id}: rejeitada → rejeitada_coordenador")
            
            db.commit()
            print(f"\n   ✅ {total} inscrição(ões) migrada(s) com sucesso!")
        
        print("\n" + "="*70)
        print("   ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*70 + "\n")
        
        print("📋 Novo fluxo de aprovação:")
        print("   1. Aluno submete proposta → status: pendente_orientador")
        print("   2. Orientador aprova → status: pendente_coordenador")
        print("   3. Coordenador aprova → status: aprovada (projeto criado)")
        print("\n   Em caso de rejeição:")
        print("   - Orientador rejeita → status: rejeitada_orientador")
        print("   - Coordenador rejeita → status: rejeitada_coordenador\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante a migração: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

def verificar_status():
    """Verifica o status atual das inscrições"""
    db = SessionLocal()
    try:
        inscricoes = db.query(Inscricao).all()
        
        if not inscricoes:
            print("ℹ️  Não há inscrições no banco de dados")
            return
        
        print(f"\n📊 Status das inscrições ({len(inscricoes)} total):\n")
        
        status_count = {}
        for inscricao in inscricoes:
            status = inscricao.status.value
            status_count[status] = status_count.get(status, 0) + 1
        
        for status, count in status_count.items():
            print(f"   {status}: {count}")
        
        print()
        
    except Exception as e:
        print(f"❌ Erro ao verificar status: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\nEscolha uma opção:")
    print("1 - Executar migração")
    print("2 - Verificar status das inscrições")
    print("0 - Sair")
    
    opcao = input("\nOpção: ")
    
    if opcao == "1":
        confirmacao = input("\n⚠️  Isso vai modificar o banco de dados. Continuar? (s/N): ")
        if confirmacao.lower() == 's':
            migrar_banco()
        else:
            print("❌ Migração cancelada")
    elif opcao == "2":
        verificar_status()
    else:
        print("Saindo...")
