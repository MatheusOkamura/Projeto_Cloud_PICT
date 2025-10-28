"""
Script para verificar o fluxo de aprovação de propostas
"""
from database import SessionLocal
from models.database_models import Inscricao, StatusInscricao
import sys

def verificar_fluxo():
    db = SessionLocal()
    try:
        inscricoes = db.query(Inscricao).all()
        
        print("\n" + "="*70)
        print("   VERIFICAÇÃO DO FLUXO DE APROVAÇÃO")
        print("="*70 + "\n")
        
        if not inscricoes:
            print("ℹ️  Não há inscrições no banco de dados\n")
            print("💡 Execute: .\\test_criar_proposta.ps1 para criar uma proposta de teste\n")
            return
        
        print(f"📊 Total de inscrições: {len(inscricoes)}\n")
        
        # Agrupar por status
        por_status = {}
        for insc in inscricoes:
            status = insc.status.value
            if status not in por_status:
                por_status[status] = []
            por_status[status].append(insc)
        
        # Mostrar estatísticas
        print("📈 Status das propostas:")
        for status, lista in por_status.items():
            emoji = {
                'pendente_orientador': '⏳',
                'pendente_coordenador': '🔄',
                'aprovada': '✅',
                'rejeitada_orientador': '❌',
                'rejeitada_coordenador': '❌'
            }.get(status, '❓')
            print(f"   {emoji} {status}: {len(lista)}")
        
        print("\n" + "-"*70 + "\n")
        
        # Detalhes de cada proposta
        print("📋 Detalhes das propostas:\n")
        for insc in inscricoes:
            print(f"ID: {insc.id}")
            print(f"   Título: {insc.titulo_projeto}")
            print(f"   Aluno: {insc.nome}")
            print(f"   Orientador: {insc.orientador_nome} (ID: {insc.orientador_id})")
            print(f"   Status: {insc.status.value}")
            
            if insc.data_submissao:
                print(f"   📅 Submetida: {insc.data_submissao.strftime('%d/%m/%Y %H:%M')}")
            
            if insc.data_avaliacao_orientador:
                print(f"   📅 Avaliada pelo orientador: {insc.data_avaliacao_orientador.strftime('%d/%m/%Y %H:%M')}")
                if insc.feedback_orientador:
                    print(f"   💬 Feedback orientador: {insc.feedback_orientador[:100]}...")
            
            if insc.data_avaliacao_coordenador:
                print(f"   📅 Avaliada pelo coordenador: {insc.data_avaliacao_coordenador.strftime('%d/%m/%Y %H:%M')}")
                if insc.feedback_coordenador:
                    print(f"   💬 Feedback coordenador: {insc.feedback_coordenador[:100]}...")
            
            print()
        
        # Verificar fluxo
        print("="*70)
        print("   VALIDAÇÃO DO FLUXO")
        print("="*70 + "\n")
        
        pendente_orientador = len([i for i in inscricoes if i.status == StatusInscricao.pendente_orientador])
        pendente_coordenador = len([i for i in inscricoes if i.status == StatusInscricao.pendente_coordenador])
        aprovadas = len([i for i in inscricoes if i.status == StatusInscricao.aprovada])
        rejeitadas = len([i for i in inscricoes if i.status == StatusInscricao.rejeitada_orientador or i.status == StatusInscricao.rejeitada_coordenador])
        
        print(f"✅ Fluxo esperado:")
        print(f"   1. Aluno submete → pendente_orientador")
        print(f"   2. Orientador aprova → pendente_coordenador")
        print(f"   3. Coordenador aprova → aprovada (cria projeto)")
        print(f"   4. Rejeições: rejeitada_orientador OU rejeitada_coordenador\n")
        
        print(f"📊 Status atual do sistema:")
        print(f"   - Aguardando orientador: {pendente_orientador}")
        print(f"   - Aguardando coordenador: {pendente_coordenador}")
        print(f"   - Aprovadas (finalizadas): {aprovadas}")
        print(f"   - Rejeitadas (finalizadas): {rejeitadas}\n")
        
        if pendente_coordenador > 0:
            print("✅ FLUXO CORRETO: Há propostas aguardando o coordenador!")
            print("   Isso significa que o orientador já aprovou.\n")
        elif pendente_orientador > 0:
            print("⏳ Há propostas aguardando aprovação do orientador.")
            print("   Faça login como orientador para avaliar.\n")
        elif aprovadas > 0:
            print("✅ Sistema funcionando! Há propostas aprovadas.")
            print("   O fluxo completo foi concluído.\n")
        else:
            print("ℹ️  Não há propostas ativas no momento.\n")
        
    except Exception as e:
        print(f"\n❌ Erro ao verificar fluxo: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verificar_fluxo()
