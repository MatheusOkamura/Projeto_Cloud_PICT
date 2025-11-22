"""
Script para resetar completamente os perfis de teste (aluno e coordenador).
Remove TODOS os dados de cadastro, forçando novo cadastro no próximo login.
"""

from database import SessionLocal
from models.database_models import Usuario, Inscricao, Projeto, TipoUsuario

def resetar_perfis_teste():
    """Remove dados de cadastro dos perfis de teste"""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("RESETANDO PERFIS DE TESTE")
        print("=" * 60)
        
        # Buscar todos os usuários com 'teste' no email
        usuarios_teste = db.query(Usuario).filter(
            Usuario.email.contains('teste')
        ).all()
        
        if not usuarios_teste:
            print("\n⚠️  Nenhum perfil de teste encontrado")
            return
        
        perfis_resetados = []
        
        for usuario in usuarios_teste:
            print(f"\n📋 Resetando: {usuario.email}")
            print(f"   Tipo: {usuario.tipo.value}")
            print(f"   Nome atual: {usuario.nome or 'Sem nome'}")
            
            # Se for aluno, deletar suas inscrições e projetos
            if usuario.tipo == TipoUsuario.aluno:
                inscricoes = db.query(Inscricao).filter(Inscricao.usuario_id == usuario.id).all()
                if inscricoes:
                    for insc in inscricoes:
                        # Deletar projetos relacionados
                        projetos = db.query(Projeto).filter(Projeto.inscricao_id == insc.id).all()
                        for proj in projetos:
                            db.delete(proj)
                            print(f"     • Projeto #{proj.id} deletado")
                        
                        db.delete(insc)
                        print(f"     • Inscrição #{insc.id} deletada")
            
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
                usuario.documento_cr = None
                print("   ✓ Dados de aluno resetados")
            
            # Resetar campos específicos de orientador/coordenador
            elif usuario.tipo in [TipoUsuario.orientador, TipoUsuario.coordenador]:
                usuario.departamento = None
                usuario.area_pesquisa = None
                usuario.titulacao = None
                usuario.vagas_disponiveis = None
                print("   ✓ Dados de orientador/coordenador resetados")
            
            perfis_resetados.append({
                'email': usuario.email,
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
            print("   1. Faça logout se estiver logado")
            print("   2. Faça login novamente")
            print("   3. Será redirecionado para completar cadastro")
        
    except Exception as e:
        print(f"\n❌ Erro ao resetar perfis: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    resetar_perfis_teste()
