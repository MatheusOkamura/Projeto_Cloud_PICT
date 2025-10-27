"""
Microsoft Graph API integration for validating institutional emails.

Este módulo fornece funcionalidades para validar emails institucionais
usando a Microsoft Graph API do Azure AD.

Para configurar:
1. Registre um aplicativo no Azure Portal (portal.azure.com)
2. Obtenha: Tenant ID, Client ID, Client Secret
3. Configure as permissões necessárias: User.Read.All
4. Adicione as credenciais no arquivo .env
"""

import requests
from typing import Optional, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class MicrosoftAuthValidator:
    """
    Classe para validar emails institucionais usando Microsoft Graph API.
    """
    
    def __init__(self):
        self.tenant_id = os.getenv("MICROSOFT_TENANT_ID", "")
        self.client_id = os.getenv("MICROSOFT_CLIENT_ID", "")
        self.client_secret = os.getenv("MICROSOFT_CLIENT_SECRET", "")
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        self.graph_endpoint = "https://graph.microsoft.com/v1.0"
        self.token_cache = None
    
    def _get_access_token(self) -> Optional[str]:
        """
        Obtém token de acesso da Microsoft usando Client Credentials Flow.
        
        Returns:
            Token de acesso ou None se falhar
        """
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            print("⚠️ Credenciais Microsoft não configuradas. Validação desabilitada.")
            return None
        
        # Verificar se já temos token em cache
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
            print(f"❌ Erro ao obter token Microsoft: {e}")
            return None
    
    def validate_institutional_email(self, email: str) -> Dict[str, any]:
        """
        Valida se um email institucional existe no Azure AD.
        
        Args:
            email: Email institucional a ser validado
            
        Returns:
            Dicionário com resultado da validação:
            {
                'valid': bool,
                'exists': bool,
                'user_data': dict or None,
                'error': str or None
            }
        """
        result = {
            'valid': False,
            'exists': False,
            'user_data': None,
            'error': None
        }
        
        # Validação básica de formato
        if not email or '@' not in email:
            result['error'] = 'Formato de email inválido'
            return result
        
        # Verificar se é email institucional
        domain = email.split('@')[1].lower()
        if 'ibmec.edu.br' not in domain:
            result['error'] = 'Email não é institucional do Ibmec'
            return result
        
        # Obter token de acesso
        access_token = self._get_access_token()
        
        if not access_token:
            # Se não conseguiu token, retornar como válido (modo fallback)
            print(f"⚠️ Validação Microsoft desabilitada. Aceitando email: {email}")
            result['valid'] = True
            result['exists'] = True
            result['error'] = 'Validação Microsoft indisponível (modo desenvolvimento)'
            return result
        
        # Fazer requisição à Microsoft Graph API
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Tentar obter informações do usuário
        user_url = f"{self.graph_endpoint}/users/{email}"
        
        try:
            response = requests.get(user_url, headers=headers)
            
            if response.status_code == 200:
                # Usuário existe no Azure AD
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
                # Usuário não encontrado no Azure AD
                result['error'] = 'Email institucional não encontrado no sistema'
                print(f"❌ Email não existe no Azure AD: {email}")
                
            else:
                # Outro erro
                result['error'] = f'Erro ao validar email (código {response.status_code})'
                print(f"⚠️ Erro Microsoft Graph: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            result['error'] = f'Erro de conexão com Microsoft: {str(e)}'
            print(f"❌ Erro ao conectar com Microsoft Graph: {e}")
        
        return result
    
    def get_user_info(self, email: str) -> Optional[Dict]:
        """
        Obtém informações detalhadas de um usuário do Azure AD.
        
        Args:
            email: Email do usuário
            
        Returns:
            Dicionário com dados do usuário ou None
        """
        validation = self.validate_institutional_email(email)
        
        if validation['valid'] and validation['exists']:
            return validation['user_data']
        
        return None


# Instância global do validador
microsoft_validator = MicrosoftAuthValidator()


def validate_email(email: str) -> Dict[str, any]:
    """
    Função helper para validar email institucional.
    
    Args:
        email: Email a ser validado
        
    Returns:
        Dicionário com resultado da validação
    """
    return microsoft_validator.validate_institutional_email(email)


def get_user_info(email: str) -> Optional[Dict]:
    """
    Função helper para obter informações do usuário.
    
    Args:
        email: Email do usuário
        
    Returns:
        Dicionário com dados do usuário ou None
    """
    return microsoft_validator.get_user_info(email)
