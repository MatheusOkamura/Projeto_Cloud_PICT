import os
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class Settings:
    # API
    API_TITLE = "Iniciação Científica Ibmec API"
    API_VERSION = "1.0.0"
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./iniciacao_cientifica.db"
    )
    
    # JWT
    SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui-mude-em-producao")
    )
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas
    
    # Microsoft OAuth
    MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "")
    MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
    MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
    
    # URLs
    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        os.getenv("AZURE_STATIC_WEB_APP_URL", "http://localhost:5173")
    )
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    # File Upload
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"]
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    
    def __init__(self):
        """Log configurações ao inicializar"""
        logger.info(f"Settings initialized for environment: {self.ENVIRONMENT}")
        logger.info(f"Frontend URL: {self.FRONTEND_URL}")
        logger.info(f"Backend URL: {self.BACKEND_URL}")
        logger.info(f"Database: {self.DATABASE_URL.split('://')[0]}")
        
        # Avisar se credenciais críticas não estão configuradas
        if self.ENVIRONMENT == "production":
            if not self.MICROSOFT_CLIENT_ID:
                logger.warning("⚠️ MICROSOFT_CLIENT_ID not set in production!")
            if self.SECRET_KEY == "sua-chave-secreta-super-segura-aqui-mude-em-producao":
                logger.error("🚨 SECRET_KEY not changed from default in production!")

# Banco de Dados Mock
cursos_db = [
    {"id": 1, "nome": "Administração"},
    {"id": 2, "nome": "Ciência da Computação"},
    {"id": 3, "nome": "Direito"},
    {"id": 4, "nome": "Economia"},
    {"id": 5, "nome": "Engenharia de Produção"},
    {"id": 6, "nome": "Jornalismo"},
    {"id": 7, "nome": "Relações Internacionais"},
    {"id": 8, "nome": "Sistemas de Informação"},
]

unidades = ["Faria Lima", "Paulista"]

settings = Settings()
