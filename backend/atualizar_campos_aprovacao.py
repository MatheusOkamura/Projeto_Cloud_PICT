"""
Script para atualizar campos de aprovação nas inscrições existentes
"""

from database import SessionLocal
from models.database_models import Inscricao, StatusInscricao

def atualizar_campos_aprovacao():
    """Atualiza os campos status_aprovacao_orientador e status_aprovacao_coordenador"""
    db = SessionLocal()
    try:
        # Buscar todas as inscrições
        inscricoes = db.query(Inscricao).all()
        
        print(f"📋 Encontradas {len(inscricoes)} inscrições")
        
        for inscricao in inscricoes:
            # Se tem feedback do orientador mas não tem status_aprovacao_orientador
            if inscricao.feedback_orientador and (not inscricao.status_aprovacao_orientador or inscricao.status_aprovacao_orientador == "pendente"):
                if inscricao.status == StatusInscricao.pendente_coordenador or inscricao.status == StatusInscricao.aprovada:
                    inscricao.status_aprovacao_orientador = "aprovado"
                    print(f"  ✅ Inscrição {inscricao.id}: orientador definido como 'aprovado'")
                elif inscricao.status == StatusInscricao.rejeitada_orientador:
                    inscricao.status_aprovacao_orientador = "rejeitado"
                    print(f"  ❌ Inscrição {inscricao.id}: orientador definido como 'rejeitado'")
            
            # Se tem feedback do coordenador mas não tem status_aprovacao_coordenador
            if inscricao.feedback_coordenador and (not inscricao.status_aprovacao_coordenador or inscricao.status_aprovacao_coordenador == "pendente"):
                if inscricao.status == StatusInscricao.aprovada:
                    inscricao.status_aprovacao_coordenador = "aprovado"
                    print(f"  ✅ Inscrição {inscricao.id}: coordenador definido como 'aprovado'")
                elif inscricao.status == StatusInscricao.rejeitada_coordenador:
                    inscricao.status_aprovacao_coordenador = "rejeitado"
                    print(f"  ❌ Inscrição {inscricao.id}: coordenador definido como 'rejeitado'")
        
        db.commit()
        print("\n✅ Campos de aprovação atualizados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao atualizar campos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("ATUALIZANDO CAMPOS DE APROVAÇÃO")
    print("=" * 60)
    atualizar_campos_aprovacao()
    print("=" * 60)
