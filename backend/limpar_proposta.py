"""
Script para limpar propostas de teste do banco de dados
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine
from models.database_models import Inscricao, Usuario, Projeto, Entrega, RelatorioMensal, MensagemRelatorio
import sys

def limpar_proposta_aluno_teste():
    """Remove a proposta do aluno teste"""
    db = SessionLocal()
    try:
        # Buscar o aluno teste
        aluno_teste = db.query(Usuario).filter(
            Usuario.email == "aluno.teste@alunos.ibmec.edu.br"
        ).first()
        
        if not aluno_teste:
            print("❌ Aluno teste não encontrado no banco de dados")
            return
        
        print(f"✅ Aluno teste encontrado: {aluno_teste.nome} (ID: {aluno_teste.id})")
        
        # Buscar inscrições do aluno
        inscricoes = db.query(Inscricao).filter(
            Inscricao.usuario_id == aluno_teste.id
        ).all()
        
        if not inscricoes:
            print("ℹ️  Aluno teste não possui inscrições/propostas")
            return
        
        print(f"📋 Encontradas {len(inscricoes)} inscrição(ões)")
        
        # Deletar inscrições
        for inscricao in inscricoes:
            print(f"   - Deletando inscrição ID {inscricao.id}: {inscricao.titulo_projeto}")
            
            # Verificar se há projetos vinculados
            projetos = db.query(Projeto).filter(
                Projeto.inscricao_id == inscricao.id
            ).all()
            
            if projetos:
                print(f"   ⚠️  Encontrados {len(projetos)} projeto(s) vinculado(s)")
                for projeto in projetos:
                    projeto_id = projeto.id
                    
                    # Deletar relatórios mensais e suas mensagens usando SQL direto
                    try:
                        # Deletar mensagens
                        result = db.execute(text(
                            "DELETE FROM mensagens_relatorios WHERE relatorio_id IN "
                            "(SELECT id FROM relatorios_mensais WHERE projeto_id = :projeto_id)"
                        ), {"projeto_id": projeto_id})
                        
                        # Deletar relatórios
                        result = db.execute(text(
                            "DELETE FROM relatorios_mensais WHERE projeto_id = :projeto_id"
                        ), {"projeto_id": projeto_id})
                        
                        if result.rowcount > 0:
                            print(f"      - Deletados relatórios mensais do projeto")
                    except Exception as e:
                        print(f"      ⚠️  Aviso ao deletar relatórios mensais: {e}")
                    
                    # Deletar entregas do projeto
                    entregas = db.query(Entrega).filter(
                        Entrega.projeto_id == projeto_id
                    ).all()
                    if entregas:
                        print(f"      - Deletando {len(entregas)} entrega(s)")
                        for entrega in entregas:
                            db.delete(entrega)
                    
                    # Deletar projeto
                    print(f"      - Deletando projeto ID {projeto_id}")
                    db.delete(projeto)
            
            # Deletar inscrição
            db.delete(inscricao)
        
        db.commit()
        print("\n✅ Proposta(s) deletada(s) com sucesso!")
        print("   O aluno teste agora pode submeter uma nova proposta")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao deletar proposta: {str(e)}")
    finally:
        db.close()

def limpar_todas_inscricoes():
    """Remove TODAS as inscrições do banco (cuidado!)"""
    db = SessionLocal()
    try:
        # Contar inscrições
        total_inscricoes = db.query(Inscricao).count()
        
        if total_inscricoes == 0:
            print("ℹ️  Não há inscrições no banco de dados")
            return
        
        print(f"⚠️  ATENÇÃO: Você está prestes a deletar {total_inscricoes} inscrição(ões)")
        confirmacao = input("   Digite 'SIM' para confirmar: ")
        
        if confirmacao != "SIM":
            print("❌ Operação cancelada")
            return
        
        # Usar SQL direto para evitar problemas com relacionamentos
        try:
            # Deletar mensagens de relatórios mensais
            db.execute(text("DELETE FROM mensagens_relatorios WHERE relatorio_id IN (SELECT id FROM relatorios_mensais)"))
            print("✓ Mensagens de relatórios deletadas")
        except Exception as e:
            print(f"⚠️  Aviso ao deletar mensagens: {e}")
        
        try:
            # Deletar relatórios mensais
            db.execute(text("DELETE FROM relatorios_mensais"))
            print("✓ Relatórios mensais deletados")
        except Exception as e:
            print(f"⚠️  Aviso ao deletar relatórios mensais: {e}")
        
        # Deletar entregas
        db.execute(text("DELETE FROM entregas"))
        print("✓ Entregas deletadas")
        
        # Deletar projetos
        db.execute(text("DELETE FROM projetos"))
        print("✓ Projetos deletados")
        
        # Deletar inscrições
        db.execute(text("DELETE FROM inscricoes"))
        print("✓ Inscrições deletadas")
        
        db.commit()
        print("\n✅ Todas as inscrições foram deletadas!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao deletar inscrições: {str(e)}")
    finally:
        db.close()

def listar_inscricoes():
    """Lista todas as inscrições no banco"""
    db = SessionLocal()
    try:
        inscricoes = db.query(Inscricao).all()
        
        if not inscricoes:
            print("ℹ️  Não há inscrições no banco de dados")
            return
        
        print(f"\n📋 Total de {len(inscricoes)} inscrição(ões):\n")
        for insc in inscricoes:
            usuario = db.query(Usuario).filter(Usuario.id == insc.usuario_id).first()
            print(f"ID: {insc.id}")
            print(f"   Aluno: {insc.nome} ({usuario.email if usuario else 'N/A'})")
            print(f"   Título: {insc.titulo_projeto}")
            print(f"   Status: {insc.status.value}")
            print(f"   Data: {insc.data_submissao}")
            print()
        
    except Exception as e:
        print(f"❌ Erro ao listar inscrições: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   SCRIPT DE LIMPEZA DE PROPOSTAS")
    print("="*60 + "\n")
    
    if len(sys.argv) > 1:
        opcao = sys.argv[1]
    else:
        print("Escolha uma opção:")
        print("1 - Deletar proposta do aluno teste")
        print("2 - Deletar TODAS as inscrições (cuidado!)")
        print("3 - Listar inscrições")
        print("0 - Sair")
        opcao = input("\nOpção: ")
    
    if opcao == "1":
        limpar_proposta_aluno_teste()
    elif opcao == "2":
        limpar_todas_inscricoes()
    elif opcao == "3":
        listar_inscricoes()
    else:
        print("Saindo...")
