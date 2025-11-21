"""
Microsoft OAuth 2.0 Authentication Service

Este módulo implementa autenticação via Microsoft OAuth 2.0 (fluxo Authorization Code).
Suporta tanto validação de email institucional quanto autenticação completa com login interativo.

Modos de operação:
1. Validação de Email: Verifica se email existe no Azure AD usando Client Credentials
2. OAuth Login: Autentica usuário com login Microsoft interativo

Para configurar:
1. Registre um aplicativo no Azure Portal (portal.azure.com)
2. Obtenha: Tenant ID, Client ID, Client Secret
3. Configure Redirect URI: http://localhost:8000/api/auth/callback
4. Configure as permissões necessárias:
   - Application: User.Read.All (para validação de email)
   - Delegated: User.Read, openid, profile, email (para OAuth login)
5. Adicione as credenciais no arquivo .env
"""

import requests
import urllib.parse
import uuid
from typing import Optional, Dict
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class MicrosoftOAuth:
    """
    Classe para autenticação Microsoft OAuth 2.0 e validação de emails.
    Implementa dois fluxos:
    1. Client Credentials Flow - Para validação de email (aplicação age sozinha)
    2. Authorization Code Flow - Para login interativo do usuário
    """
    
    def __init__(self):
        # Detectar ambiente
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.is_development = self.environment == "development"
        
        # Usuários de teste permitidos em desenvolvimento
        self.test_users = [
            "aluno.teste@alunos.ibmec.edu.br",
            "professor.teste@orientador.ibmec.edu.br",
            "coordenador.teste@coordenador.ibmec.edu.br"
        ]
        
        self.tenant_id = os.getenv("MICROSOFT_TENANT_ID", "")
        self.client_id = os.getenv("MICROSOFT_CLIENT_ID", "")
        self.client_secret = os.getenv("MICROSOFT_CLIENT_SECRET", "")
        
        # Redirect URI dinâmico baseado no ambiente
        self.redirect_uri = os.getenv(
            "MICROSOFT_REDIRECT_URI",
            os.getenv("BACKEND_URL", "http://localhost:8000") + "/api/auth/callback"
        )
        
        # Frontend URL para redirecionamento após login
        self.frontend_url = os.getenv(
            "FRONTEND_URL",
            os.getenv("AZURE_STATIC_WEB_APP_URL", "http://localhost:5173")
        )
        
        # Log configuração (sem expor secrets)
        logger.info(f"Microsoft OAuth initialized:")
        logger.info(f"  Environment: {self.environment}")
        logger.info(f"  Tenant ID: {self.tenant_id[:8]}..." if self.tenant_id else "  Tenant ID: NOT SET (Dev mode enabled)")
        logger.info(f"  Client ID: {self.client_id[:8]}..." if self.client_id else "  Client ID: NOT SET (Dev mode enabled)")
        logger.info(f"  Redirect URI: {self.redirect_uri}")
        logger.info(f"  Frontend URL: {self.frontend_url}")
        
        # Endpoints Microsoft
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.auth_endpoint = f"{self.authority}/oauth2/v2.0/authorize"
        self.token_endpoint = f"{self.authority}/oauth2/v2.0/token"
        self.graph_endpoint = "https://graph.microsoft.com/v1.0"
        
        # Scopes necessários para o fluxo OAuth
        self.scopes = ["User.Read", "openid", "profile", "email"]
        
        self.token_cache = None
        self.is_configured = all([self.tenant_id, self.client_id, self.client_secret])
        
        # Validar configuração
        if not self.is_configured:
            if self.is_development:
                logger.info("✅ Running in DEVELOPMENT MODE")
                logger.info("   Test users enabled: aluno.teste, professor.teste, coordenador.teste")
                logger.warning("⚠️ Microsoft OAuth NOT configured - real users will fail to login")
            else:
                logger.warning("⚠️ Microsoft OAuth credentials not fully configured!")
                logger.warning("  Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET")
        else:
            logger.info("✅ Microsoft OAuth configured and ready")
    
    def get_authorization_url(self) -> Dict[str, str]:
        """
        Gera URL para redirecionar usuário para login Microsoft (OAuth 2.0 Authorization Code Flow).
        
        Returns:
            Dict com authorization_url e state para CSRF protection
        """
        if not all([self.tenant_id, self.client_id]):
            raise ValueError("Credenciais Microsoft não configuradas")
        
        # Gerar state para proteção CSRF
        state = str(uuid.uuid4())
        
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "response_mode": "query",
            "scope": " ".join(self.scopes),
            "state": state,
            "prompt": "select_account"  # Força seleção de conta
        }
        
        auth_url = f"{self.auth_endpoint}?{urllib.parse.urlencode(params)}"
        
        return {
            "authorization_url": auth_url,
            "state": state
        }
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """
        Troca código de autorização por tokens de acesso (OAuth 2.0 Authorization Code Flow).
        
        Args:
            code: Código de autorização retornado pela Microsoft
            
        Returns:
            Dict com access_token, refresh_token, expires_in, etc.
        """
        token_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
            "scope": " ".join(self.scopes)
        }
        
        try:
            response = requests.post(self.token_endpoint, data=token_data)
            response.raise_for_status()
            
            token_response = response.json()
            print(f"✅ Token obtido com sucesso")
            
            return token_response
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao trocar código por token: {e}")
            if hasattr(e.response, 'text'):
                print(f"Detalhes: {e.response.text}")
            raise
    
    async def get_user_info_from_token(self, access_token: str) -> Dict:
        """
        Obtém informações do usuário autenticado usando access token.
        
        Args:
            access_token: Token de acesso obtido do fluxo OAuth
            
        Returns:
            Dict com informações do usuário (displayName, mail, userPrincipalName, etc.)
        """
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            response = requests.get(f"{self.graph_endpoint}/me", headers=headers)
            response.raise_for_status()
            
            user_info = response.json()
            print(f"✅ Informações do usuário obtidas: {user_info.get('displayName')}")
            
            return user_info
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao obter informações do usuário: {e}")
            raise
    
    def _get_access_token_client_credentials(self) -> Optional[str]:
        """
        Obtém token de acesso usando Client Credentials Flow (para validação de email).
        Este é um fluxo diferente do OAuth interativo - a aplicação age sozinha.
        
        Returns:
            Token de acesso ou None se falhar
        """
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            print("⚠️ Credenciais Microsoft não configuradas para validação de email.")
            return None
        
        if self.token_cache:
            return self.token_cache
        
        token_url = f"{self.authority}/oauth2/v2.0/token"
        
        payload = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials'
        }
        
        try:
            response = requests.post(token_url, data=payload)
            response.raise_for_status()
            
            token_data = response.json()
            self.token_cache = token_data.get('access_token')
            
            return self.token_cache
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao obter token de aplicação: {e}")
            return None
    
    def validate_institutional_email(self, email: str) -> Dict[str, any]:
        """
        Valida se um email institucional existe no Azure AD (Client Credentials Flow).
        Este método NÃO requer login do usuário.
        Em modo desenvolvimento, aceita qualquer email @ibmec.edu.br sem validar no Azure.
        
        Args:
            email: Email institucional a ser validado
            
        Returns:
            Dicionário com resultado da validação
        """
        result = {
            'valid': False,
            'exists': False,
            'user_data': None,
            'error': None
        }
        
        if not email or '@' not in email:
            result['error'] = 'Formato de email inválido'
            return result
        
        domain = email.split('@')[1].lower()
        if 'ibmec.edu.br' not in domain:
            result['error'] = 'Email não é institucional do Ibmec'
            return result
        
        # Em modo desenvolvimento, aceitar APENAS usuários de teste
        if self.is_development and email.lower() in [u.lower() for u in self.test_users]:
            logger.info(f"✅ Test user in development mode: {email}")
            
            # Extrair nome do email
            username = email.split('@')[0]
            name_parts = username.replace('.', ' ').split()
            display_name = ' '.join(word.capitalize() for word in name_parts)
            
            result['valid'] = True
            result['exists'] = True
            result['user_data'] = {
                'display_name': display_name,
                'given_name': name_parts[0].capitalize() if name_parts else username,
                'surname': name_parts[-1].capitalize() if len(name_parts) > 1 else '',
                'mail': email,
                'user_principal_name': email,
                'job_title': None,
                'department': None
            }
            return result
        
        access_token = self._get_access_token_client_credentials()
        
        if not access_token:
            result['valid'] = True
            result['exists'] = True
            result['error'] = 'Validação Microsoft indisponível (modo desenvolvimento)'
            return result
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        user_url = f"{self.graph_endpoint}/users/{email}"
        
        try:
            response = requests.get(user_url, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                result['valid'] = True
                result['exists'] = True
                result['user_data'] = {
                    'display_name': user_data.get('displayName'),
                    'given_name': user_data.get('givenName'),
                    'surname': user_data.get('surname'),
                    'mail': user_data.get('mail'),
                    'user_principal_name': user_data.get('userPrincipalName'),
                    'job_title': user_data.get('jobTitle'),
                    'department': user_data.get('department')
                }
                print(f"✅ Email validado via Microsoft: {email}")
                
            elif response.status_code == 404:
                result['error'] = 'Email institucional não encontrado no sistema'
                print(f"❌ Email não existe no Azure AD: {email}")
                
            else:
                result['error'] = f'Erro ao validar email (código {response.status_code})'
                print(f"⚠️ Erro Microsoft Graph: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            result['error'] = f'Erro de conexão com Microsoft: {str(e)}'
            print(f"❌ Erro ao conectar com Microsoft Graph: {e}")
        
        return result
    
    def is_test_user(self, email: str) -> bool:
        """
        Verifica se é um usuário de teste permitido em desenvolvimento.
        
        Args:
            email: Email do usuário
            
        Returns:
            True se é usuário de teste, False caso contrário
        """
        return email.lower() in [u.lower() for u in self.test_users]
    
    def is_oauth_available(self) -> bool:
        """
        Verifica se OAuth está configurado e disponível.
        
        Returns:
            True se OAuth está configurado, False caso contrário
        """
        return self.is_configured
    
    @staticmethod
    def determine_user_role(email: str) -> str:
        """
        Determina o tipo de usuário baseado no email.
        
        Args:
            email: Email do usuário
            
        Returns:
            Tipo de usuário: 'aluno', 'orientador' ou 'coordenador'
        """
        email_lower = email.lower()
        
        if "@alunos" in email_lower:
            return "aluno"
        elif "@orientador" in email_lower or "@professor" in email_lower:
            return "orientador"
        elif "@coordenador" in email_lower:
            return "coordenador"
        else:
            return "aluno"  # Default


# Instância global
microsoft_oauth = MicrosoftOAuth()


# Funções helper para compatibilidade com código existente
def validate_email(email: str) -> Dict[str, any]:
    """Função helper para validar email institucional"""
    return microsoft_oauth.validate_institutional_email(email)


def get_user_info(email: str) -> Optional[Dict]:
    """Função helper para obter informações do usuário"""
    validation = microsoft_oauth.validate_institutional_email(email)
    
    if validation['valid'] and validation['exists']:
        return validation['user_data']
    
    return None
