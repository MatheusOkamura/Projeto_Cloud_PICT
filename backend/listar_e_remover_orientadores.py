import sqlite3

def listar_e_remover_orientadores():
    conn = sqlite3.connect('iniciacao_cientifica.db')
    cursor = conn.cursor()
    
    # Listar todos os orientadores
    cursor.execute("SELECT id, nome, email FROM usuarios WHERE tipo = 'orientador'")
    orientadores = cursor.fetchall()
    
    print("\n📋 Orientadores encontrados:")
    print("-" * 60)
    for orientador in orientadores:
        print(f"ID: {orientador[0]}, Nome: {orientador[1]}, Email: {orientador[2]}")
    
    # Remover orientadores que não são Patricia Pereira
    # Patricia tem o nome "Patricia Pereira"
    cursor.execute("""
        DELETE FROM usuarios 
        WHERE tipo = 'orientador' 
        AND nome != 'Patricia Pereira'
    """)
    
    removidos = cursor.rowcount
    conn.commit()
    
    print(f"\n✅ {removidos} orientador(es) removido(s)")
    
    # Listar orientadores restantes
    cursor.execute("SELECT id, nome, email FROM usuarios WHERE tipo = 'orientador'")
    orientadores_restantes = cursor.fetchall()
    
    print("\n📋 Orientadores restantes:")
    print("-" * 60)
    for orientador in orientadores_restantes:
        print(f"ID: {orientador[0]}, Nome: {orientador[1]}, Email: {orientador[2]}")
    
    conn.close()
    print("\n✅ Operação concluída!")

if __name__ == "__main__":
    listar_e_remover_orientadores()
