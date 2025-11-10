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

app = FastAPI(
    title="API Iniciação Científica Ibmec",
    description="API para gerenciamento do programa de Iniciação Científica",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternativo
        "https://icy-sea-0c53d910f.3.azurestaticapps.net",  # Azure Static Web App
        "https://*.azurestaticapps.net",  # Outros ambientes do Azure
        "https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net",  # Backend URL (para testes)
    ],
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
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

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
