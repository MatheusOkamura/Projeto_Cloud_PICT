"""
Script para testar a linha temporal do dashboard do aluno
Define diferentes etapas para ver como a timeline se comporta
"""

from database import SessionLocal
from models.database_models import Projeto

def listar_projetos():
    """Lista todos os projetos e suas etapas"""
    db = SessionLocal()
    try:
        projetos = db.query(Projeto).all()
        print("\n📊 PROJETOS E SUAS ETAPAS:")
        print("="*60)
        
        if not projetos:
            print("❌ Nenhum projeto encontrado")
            return
        
        for p in projetos:
            print(f"\n🔬 Projeto ID: {p.id}")
            print(f"   Título: {p.titulo}")
            print(f"   Aluno ID: {p.aluno_id}")
            print(f"   Etapa Atual: {p.etapa_atual.value if p.etapa_atual else 'Nenhuma'}")
        
        print("\n" + "="*60)
        
    finally:
        db.close()

def definir_etapa(projeto_id: int, etapa: str):
    """
    Define a etapa atual de um projeto
    
    Etapas válidas:
    - 'relatorio_parcial'
    - 'apresentacao_amostra'
    - 'artigo_final'
    - None (nenhuma etapa ativa)
    """
    db = SessionLocal()
    try:
        projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()
        
        if not projeto:
            print(f"❌ Projeto {projeto_id} não encontrado")
            return
        
        projeto.etapa_atual = etapa
        db.commit()
        
        print(f"\n✅ Etapa atualizada com sucesso!")
        print(f"   Projeto: {projeto.titulo}")
        print(f"   Nova Etapa: {etapa or 'Nenhuma'}")
        
    except Exception as e:
        print(f"❌ Erro ao definir etapa: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n🔧 GERENCIADOR DE ETAPAS DO PROJETO")
    print("="*60)
    
    # Listar projetos existentes
    listar_projetos()
    
    print("\n💡 EXEMPLOS DE USO:")
    print("   Para definir etapa: definir_etapa(projeto_id, 'relatorio_parcial')")
    print("   Para limpar etapa: definir_etapa(projeto_id, None)")
    print("\n📌 Etapas disponíveis:")
    print("   - relatorio_parcial")
    print("   - apresentacao_amostra")
    print("   - artigo_final")
    print("\n" + "="*60)
    
    # Exemplo: Se houver projeto, define primeira etapa
    db = SessionLocal()
    projeto = db.query(Projeto).first()
    db.close()
    
    if projeto:
        print(f"\n🎯 Para testar a timeline, execute:")
        print(f"   definir_etapa({projeto.id}, 'relatorio_parcial')")
