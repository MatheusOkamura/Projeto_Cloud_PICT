from sqlalchemy import inspect
from database import engine

inspector = inspect(engine)
tables = inspector.get_table_names()

print('=' * 60)
print('ESTRUTURA DO BANCO DE DADOS')
print('=' * 60)

for table in tables:
    print(f'\n📊 Tabela: {table.upper()}')
    print('-' * 60)
    columns = inspector.get_columns(table)
    for col in columns:
        nullable = 'NULL' if col.get('nullable', True) else 'NOT NULL'
        primary = ' [PK]' if col.get('primary_key', False) else ''
        print(f"  • {col['name']:<25} {str(col['type']):<20} {nullable}{primary}")
    
    # Verificar foreign keys
    fks = inspector.get_foreign_keys(table)
    if fks:
        print('\n  🔗 Foreign Keys:')
        for fk in fks:
            print(f"    - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")

print('\n' + '=' * 60)
print(f'✅ Total de {len(tables)} tabelas verificadas')
print('=' * 60)
