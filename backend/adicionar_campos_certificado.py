import sqlite3
from datetime import datetime

def adicionar_campos_certificado():
    """Adiciona campos para certificado de conclusão na tabela projetos"""
    
    conn = sqlite3.connect('iniciacao_cientifica.db')
    cursor = conn.cursor()
    
    try:
        # Adicionar campo certificado_arquivo
        cursor.execute("""
            ALTER TABLE projetos 
            ADD COLUMN certificado_arquivo VARCHAR
        """)
        print("✅ Campo certificado_arquivo adicionado com sucesso!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️ Campo certificado_arquivo já existe")
        else:
            print(f"❌ Erro ao adicionar certificado_arquivo: {e}")
    
    try:
        # Adicionar campo certificado_data_emissao
        cursor.execute("""
            ALTER TABLE projetos 
            ADD COLUMN certificado_data_emissao DATETIME
        """)
        print("✅ Campo certificado_data_emissao adicionado com sucesso!")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️ Campo certificado_data_emissao já existe")
        else:
            print(f"❌ Erro ao adicionar certificado_data_emissao: {e}")
    
    conn.commit()
    conn.close()
    print("\n✅ Migração concluída!")

if __name__ == "__main__":
    adicionar_campos_certificado()
