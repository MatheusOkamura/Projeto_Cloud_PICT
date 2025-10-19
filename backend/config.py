import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API
    API_TITLE = "Iniciação Científica Ibmec API"
    API_VERSION = "1.0.0"
    
    # Database (para futura implementação)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/ibmec_ic")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-segura-aqui-mude-em-producao")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas
    
    # File Upload
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"]
    UPLOAD_DIR = "uploads"

settings = Settings()
