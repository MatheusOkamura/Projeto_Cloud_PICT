from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, inscricoes, usuarios
from routes import orientadores
from routes import coordenadores
from config import settings

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api", tags=["Autenticação"])
app.include_router(inscricoes.router, prefix="/api", tags=["Inscrições"])
app.include_router(usuarios.router, prefix="/api", tags=["Usuários"])
app.include_router(orientadores.router, prefix="/api", tags=["Orientadores"])
app.include_router(coordenadores.router, prefix="/api", tags=["Coordenadores"])

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
