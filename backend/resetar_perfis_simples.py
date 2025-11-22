"""
Script simples para resetar perfis de teste (aluno e coordenador).
Remove os dados de cadastro para que seja necessário completar o cadastro novamente no próximo login.
"""

from database import SessionLocal
from models.database_models import Usuario, TipoUsuario

def resetar_perfis_teste():
    """Remove dados de cadastro dos perfis de teste"""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("RESETANDO PERFIS DE TESTE")
        print("=" * 60)
        
        # Emails dos perfis de teste que serão resetados
        emails_teste = [
            "aluno@alunos.ibmec.edu.br",
            "coordenador@coordenador.ibmec.edu.br"
        ]
        
        perfis_resetados = []
        
        for email in emails_teste:
            usuario = db.query(Usuario).filter(Usuario.email == email).first()
            
            if not usuario:
                print(f"\n⚠️  Usuário {email} não encontrado")
                continue
            
            print(f"\n📋 Resetando: {email}")
            print(f"   Tipo: {usuario.tipo.value}")
            print(f"   Nome atual: {usuario.nome or '(não preenchido)'}")
            
            # Campos mantidos (autenticação básica)
            # - email
            # - senha 
            # - tipo
            # - status
            
            # Resetar campos comuns
            usuario.nome = None
            usuario.cpf = None
            usuario.telefone = None
            
            # Resetar campos específicos de aluno
            if usuario.tipo == TipoUsuario.aluno:
                usuario.curso = None
                usuario.unidade = None
                usuario.matricula = None
                usuario.cr = None
                usuario.comprovante_cr = None
                print("   ✓ Dados de aluno resetados")
            
            # Resetar campos específicos de orientador/coordenador
            elif usuario.tipo in [TipoUsuario.orientador, TipoUsuario.coordenador]:
                usuario.departamento = None
                usuario.area_pesquisa = None
                usuario.titulacao = None
                usuario.vagas_disponiveis = None
                print("   ✓ Dados de orientador/coordenador resetados")
            
            perfis_resetados.append({
                'email': email,
                'tipo': usuario.tipo.value
            })
        
        if perfis_resetados:
            db.commit()
            print("\n" + "=" * 60)
            print("✅ PERFIS RESETADOS COM SUCESSO!")
            print("=" * 60)
            print("\n📝 Resumo:")
            for perfil in perfis_resetados:
                print(f"   • {perfil['email']} ({perfil['tipo']})")
            print("\n💡 Os usuários precisarão completar o cadastro no próximo login.")
        else:
            print("\n⚠️  Nenhum perfil foi resetado.")
            
    except Exception as e:
        print(f"\n❌ Erro ao resetar perfis: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("\n🔧 SCRIPT DE RESET DE PERFIS DE TESTE")
    print("\nEste script remove os dados de cadastro dos perfis de teste,")
    print("forçando-os a completar o cadastro novamente no próximo login.\n")
    
    resetar_perfis_teste()
    
    print("\n✨ Script finalizado!\n")
