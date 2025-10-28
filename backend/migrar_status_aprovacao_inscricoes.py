"""
Script para adicionar campos status_aprovacao à tabela inscricoes
"""

import sqlite3
from pathlib import Path

def migrar_campos_aprovacao_inscricoes():
    """Adiciona campos status_aprovacao_orientador e status_aprovacao_coordenador na tabela inscricoes"""
    
    db_path = Path("iniciacao_cientifica.db")
    if not db_path.exists():
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("🔍 Verificando estrutura da tabela inscricoes...")
        
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(inscricoes)")
        colunas = [info[1] for info in cursor.fetchall()]
        
        alteracoes = []
        
        # Adicionar status_aprovacao_orientador se não existir
        if "status_aprovacao_orientador" not in colunas:
            print("➕ Adicionando coluna status_aprovacao_orientador...")
            cursor.execute("""
                ALTER TABLE inscricoes 
                ADD COLUMN status_aprovacao_orientador TEXT DEFAULT 'pendente'
            """)
            alteracoes.append("status_aprovacao_orientador")
        else:
            print("✅ Coluna status_aprovacao_orientador já existe")
        
        # Adicionar status_aprovacao_coordenador se não existir
        if "status_aprovacao_coordenador" not in colunas:
            print("➕ Adicionando coluna status_aprovacao_coordenador...")
            cursor.execute("""
                ALTER TABLE inscricoes 
                ADD COLUMN status_aprovacao_coordenador TEXT DEFAULT 'pendente'
            """)
            alteracoes.append("status_aprovacao_coordenador")
        else:
            print("✅ Coluna status_aprovacao_coordenador já existe")
        
        if alteracoes:
            conn.commit()
            print(f"\n✅ Migração concluída com sucesso! {len(alteracoes)} alterações feitas:")
            for alt in alteracoes:
                print(f"   - {alt}")
        else:
            print("\n✅ Nenhuma alteração necessária. Tabela já está atualizada!")
        
    except sqlite3.Error as e:
        print(f"❌ Erro SQLite: {e}")
        conn.rollback()
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("MIGRAÇÃO: Adicionar campos status_aprovacao à tabela inscricoes")
    print("=" * 60)
    migrar_campos_aprovacao_inscricoes()
    print("=" * 60)
