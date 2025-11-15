from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from routes import auth, inscricoes, usuarios
from routes import orientadores
from routes import coordenadores
from routes import alunos
from config import settings, unidades
from database import get_db
from models.database_models import Curso, Usuario, TipoUsuario, StatusUsuario
import os
import logging

# Configurar logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API Iniciação Científica Ibmec",
    description="API para gerenciamento do programa de Iniciação Científica",
    version="1.0.3"
)

# Configuração CORS dinâmica baseada em ambiente
allowed_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternativo
    "http://127.0.0.1:5173",
]

# Adicionar origens de produção do Azure
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)
    logger.info(f"Added frontend URL to CORS: {frontend_url}")

# Adicionar domínios Azure Static Web Apps
azure_static_web_app_url = os.getenv("AZURE_STATIC_WEB_APP_URL", "https://icy-sea-0c53d910f.3.azurestaticapps.net")
if azure_static_web_app_url:
    allowed_origins.append(azure_static_web_app_url)
    logger.info(f"Added Azure Static Web App to CORS: {azure_static_web_app_url}")

# Adicionar URL do próprio backend (para docs e redirecionamentos)
backend_url = os.getenv("BACKEND_URL", "")
if backend_url:
    allowed_origins.append(backend_url)

# Em produção, aceitar todos os subdomínios do Azure Static Web Apps
if os.getenv("ENVIRONMENT", "development") == "production":
    allowed_origins.append("https://*.azurestaticapps.net")

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(inscricoes.router, prefix="/api/inscricoes", tags=["Inscrições"])
app.include_router(usuarios.router, prefix="/api", tags=["Usuários"])
app.include_router(orientadores.router, prefix="/api", tags=["Orientadores"])
app.include_router(coordenadores.router, prefix="/api", tags=["Coordenadores"])
app.include_router(alunos.router, prefix="/api", tags=["Alunos"])

@app.get("/")
async def root():
    return {
        "message": "API Iniciação Científica Ibmec",
        "version": "1.0.3",
        "docs": "/docs",
        "status": "production",
        "deploy": "automated"
    }

@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint robusto para monitoramento Azure.
    Verifica conectividade do banco de dados e status da aplicação.
    """
    health_status = {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": "unknown",
        "version": "1.0.0"
    }
    
    try:
        # Testar conexão com banco
        db.execute("SELECT 1")
        health_status["database"] = "connected"
        logger.info("Health check: database connected")
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"
        logger.error(f"Health check failed: database error - {e}")
        return health_status
    
    return health_status

@app.get("/api/cursos")
async def listar_cursos(db: Session = Depends(get_db)):
    """
    Retorna lista de cursos disponíveis no Ibmec.
    """
    cursos = db.query(Curso).filter(Curso.ativo == 1).all()
    cursos_list = [
        {
            "id": curso.id,
            "nome": curso.nome,
            "codigo": curso.codigo
        }
        for curso in cursos
    ]
    return {"cursos": cursos_list}

@app.get("/api/unidades")
async def listar_unidades():
    """
    Retorna lista de unidades do Ibmec.
    """
    return {"unidades": unidades}

@app.get("/api/orientadores")
async def listar_orientadores(db: Session = Depends(get_db)):
    """
    Retorna lista de orientadores ativos disponíveis para orientação.
    """
    orientadores = db.query(Usuario).filter(
        Usuario.tipo == TipoUsuario.orientador,
        Usuario.status == StatusUsuario.ativo
    ).all()
    
    orientadores_list = [
        {
            "id": orientador.id,
            "nome": orientador.nome,
            "email": orientador.email,
            "departamento": orientador.departamento,
            "area_pesquisa": orientador.area_pesquisa,
            "titulacao": orientador.titulacao,
            "vagas_disponiveis": orientador.vagas_disponiveis or 0
        }
        for orientador in orientadores
    ]
    return {"orientadores": orientadores_list}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
