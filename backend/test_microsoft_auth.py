"""
Script de teste para validação Microsoft Graph API

Use este script para testar se a integração com Microsoft está funcionando corretamente.
"""

from microsoft_auth import validate_email, get_user_info
import json
import sys

def test_validation(email: str):
    """Testa a validação de um email"""
    print("=" * 80)
    print(f"🔍 Testando validação para: {email}")
    print("=" * 80)
    
    result = validate_email(email)
    
    print("\n📊 Resultado da Validação:")
    print("-" * 80)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("-" * 80)
    
    if result['valid'] and result['exists']:
        print("\n✅ Email VÁLIDO - Usuário encontrado no Azure AD")
        if result['user_data']:
            print("\n👤 Dados do Usuário:")
            for key, value in result['user_data'].items():
                print(f"  • {key}: {value}")
    elif result['valid'] and 'desenvolvimento' in str(result.get('error', '')):
        print("\n⚠️ MODO DESENVOLVIMENTO - Validação Microsoft desabilitada")
        print("  Configure as credenciais no arquivo .env para habilitar validação")
    else:
        print(f"\n❌ Email INVÁLIDO - {result.get('error', 'Erro desconhecido')}")
    
    print("\n" + "=" * 80)

def test_multiple_emails():
    """Testa múltiplos emails"""
    emails_teste = [
        "202301098068@alunos.ibmec.edu.br",  # Exemplo de email de aluno
        "professor@orientador.ibmec.edu.br",  # Exemplo de email de professor
        "coordenador@coordenador.ibmec.edu.br",  # Exemplo de email de coordenador
        "invalido@gmail.com",  # Email não institucional
    ]
    
    print("\n" + "🧪 TESTE DE MÚLTIPLOS EMAILS ".center(80, "="))
    print()
    
    for email in emails_teste:
        test_validation(email)
        print("\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Testar email específico passado como argumento
        email = sys.argv[1]
        test_validation(email)
    else:
        # Testar múltiplos emails
        print("\n" + "TESTE DE VALIDAÇÃO MICROSOFT GRAPH API ".center(80, "🔐"))
        print("\nUso:")
        print("  python test_microsoft_auth.py [email]")
        print("\nExemplos:")
        print("  python test_microsoft_auth.py usuario@alunos.ibmec.edu.br")
        print("  python test_microsoft_auth.py professor@orientador.ibmec.edu.br")
        print("\n" + "=" * 80 + "\n")
        
        test_multiple_emails()
