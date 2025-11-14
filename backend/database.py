import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Obter URL do banco de dados do ambiente
# Se DATABASE_URL não estiver definida, usa SQLite como fallback
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./iniciacao_cientifica.db"
)

# Log da conexão (sem expor senha)
db_type = SQLALCHEMY_DATABASE_URL.split("://")[0]
logger.info(f"Database type: {db_type}")

# Configurar connect_args baseado no tipo de banco
connect_args = {}
pool_settings = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}  # Necessário apenas para SQLite
    logger.info("Using SQLite database")
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Configurações de pool para PostgreSQL no Azure
    pool_settings = {
        "pool_size": 5,  # Número de conexões mantidas
        "max_overflow": 10,  # Conexões extras quando necessário
        "pool_timeout": 30,  # Timeout para obter conexão
        "pool_recycle": 3600,  # Reciclar conexões após 1 hora
        "pool_pre_ping": True,  # Verificar conexão antes de usar
    }
    
    # SSL para Azure PostgreSQL
    if "azure" in SQLALCHEMY_DATABASE_URL.lower() or "sslmode" not in SQLALCHEMY_DATABASE_URL:
        # Azure PostgreSQL requer SSL
        if "?" in SQLALCHEMY_DATABASE_URL:
            if "sslmode" not in SQLALCHEMY_DATABASE_URL:
                SQLALCHEMY_DATABASE_URL += "&sslmode=require"
        else:
            SQLALCHEMY_DATABASE_URL += "?sslmode=require"
        logger.info("SSL mode enabled for Azure PostgreSQL")
    
    logger.info("Using PostgreSQL database with connection pooling")

try:
    # Criar engine com configurações apropriadas
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args=connect_args,
        echo=False,  # Mude para True para debug SQL
        **pool_settings
    )
    
    # Testar conexão inicial
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database engine created and connection verified")
    
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# Session local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Dependency para obter a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
