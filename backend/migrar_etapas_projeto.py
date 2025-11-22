"""
Script para migrar as etapas dos projetos para o novo formato.

Etapas antigas -> Etapas novas:
- inscricao -> envio_proposta (renomeada)
- desenvolvimento -> relatorio_mensal_1 (primeira etapa após aprovação)
- relatorio_parcial -> relatorio_parcial (mantém)
- apresentacao -> apresentacao_amostra
- relatorio_final -> artigo_final
- concluido -> concluido (mantém)
"""

from sqlalchemy import create_engine, Column, String, Enum as SQLEnum, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.declarative import declarative_base
import enum

# Configuração do banco de dados
DATABASE_URL = "sqlite:///./iniciacao_cientifica.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Mapeamento de conversão
MAPEAMENTO_ETAPAS = {
    "inscricao": "envio_proposta",
    "desenvolvimento": "relatorio_mensal_1",
    "relatorio_parcial": "relatorio_parcial",
    "apresentacao": "apresentacao_amostra",
    "relatorio_final": "artigo_final",
    "concluido": "concluido"
}

def migrar_etapas():
    db = SessionLocal()
    try:
        # Buscar todos os projetos
        result = db.execute(text("SELECT id, etapa_atual FROM projetos"))
        projetos = result.fetchall()
        
        print(f"Encontrados {len(projetos)} projetos para verificar.")
        
        atualizados = 0
        for projeto_id, etapa_atual in projetos:
            if etapa_atual in MAPEAMENTO_ETAPAS:
                nova_etapa = MAPEAMENTO_ETAPAS[etapa_atual]
                
                if nova_etapa != etapa_atual:
                    print(f"Projeto {projeto_id}: {etapa_atual} -> {nova_etapa}")
                    db.execute(
                        text("UPDATE projetos SET etapa_atual = :nova_etapa WHERE id = :projeto_id"),
                        {"nova_etapa": nova_etapa, "projeto_id": projeto_id}
                    )
                    atualizados += 1
                else:
                    print(f"Projeto {projeto_id}: {etapa_atual} (sem alteração)")
            else:
                print(f"⚠️  Projeto {projeto_id}: etapa desconhecida '{etapa_atual}' - não foi alterada")
        
        db.commit()
        print(f"\n✅ Migração concluída! {atualizados} projetos atualizados.")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Iniciando migração das etapas dos projetos ===\n")
    migrar_etapas()
