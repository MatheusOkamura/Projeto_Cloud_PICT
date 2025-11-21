"""
Script de teste para autenticação local
Testa o login tradicional sem necessidade de configuração Microsoft
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_login(email: str, senha: str = "123456"):
    """Testa login com email e senha"""
    
    print(f"\n{'='*60}")
    print(f"🔐 Testando login para: {email}")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/api/auth/legacy-login"
    payload = {
        "email": email,
        "senha": senha
    }
    
    try:
        print(f"\n📤 Enviando requisição para {url}")
        print(f"📋 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        
        print(f"\n📥 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Login realizado com sucesso!")
            print(f"\n👤 Dados do usuário:")
            print(f"   ID: {data['user']['id']}")
            print(f"   Nome: {data['user']['nome']}")
            print(f"   Email: {data['user']['email']}")
            print(f"   Tipo: {data['user']['tipo']}")
            print(f"   Status: {data['user']['status']}")
            print(f"   Novo usuário: {data['is_new_user']}")
            print(f"\n🔑 Token (primeiros 50 caracteres): {data['access_token'][:50]}...")
            
            return data
        else:
            print(f"\n❌ Erro no login!")
            print(f"   Detalhes: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Erro: Não foi possível conectar ao backend!")
        print(f"   Certifique-se que o backend está rodando em {BASE_URL}")
        return None
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        return None

def test_health():
    """Testa health check"""
    print(f"\n🏥 Testando health check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend está rodando!")
            print(f"   Status: {data['status']}")
            print(f"   Ambiente: {data['environment']}")
            print(f"   Database: {data['database']}")
            return True
        else:
            print(f"❌ Backend retornou status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Backend não está respondendo em {BASE_URL}")
        print(f"\n💡 Para iniciar o backend:")
        print(f"   cd backend")
        print(f"   .\\venv\\Scripts\\Activate.ps1")
        print(f"   uvicorn main:app --reload")
        return False

def main():
    """Função principal"""
    print("="*60)
    print("🧪 TESTE DE AUTENTICAÇÃO LOCAL")
    print("="*60)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar se backend está rodando
    if not test_health():
        return
    
    # Testes com diferentes tipos de usuários
    testes = [
        {
            "email": "joao.silva@alunos.ibmec.edu.br",
            "tipo": "Aluno",
            "senha": "123456"
        },
        {
            "email": "maria.santos@orientador.ibmec.edu.br",
            "tipo": "Orientador",
            "senha": "senha123"
        },
        {
            "email": "carlos.coordenador@coordenador.ibmec.edu.br",
            "tipo": "Coordenador",
            "senha": "abc123"
        }
    ]
    
    resultados = []
    
    for teste in testes:
        print(f"\n{'─'*60}")
        print(f"📝 Teste: {teste['tipo']}")
        resultado = test_login(teste["email"], teste["senha"])
        resultados.append({
            "tipo": teste["tipo"],
            "email": teste["email"],
            "sucesso": resultado is not None
        })
    
    # Resumo
    print(f"\n{'='*60}")
    print("📊 RESUMO DOS TESTES")
    print(f"{'='*60}")
    
    for r in resultados:
        status = "✅" if r["sucesso"] else "❌"
        print(f"{status} {r['tipo']}: {r['email']}")
    
    total = len(resultados)
    sucessos = sum(1 for r in resultados if r["sucesso"])
    
    print(f"\n📈 Taxa de sucesso: {sucessos}/{total} ({(sucessos/total)*100:.0f}%)")
    
    if sucessos == total:
        print("\n🎉 Todos os testes passaram!")
    else:
        print("\n⚠️ Alguns testes falharam.")

if __name__ == "__main__":
    main()
