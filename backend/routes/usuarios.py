from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from models.schemas import Usuario, UsuarioCreate, MessageResponse
from models.database_models import Usuario as DBUsuario, TipoUsuario, Inscricao as InscricaoModel
from database import get_db
from typing import List, Optional

router = APIRouter()

@router.get("/usuarios", response_model=List[dict])
async def listar_usuarios(tipo: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Listar todos os usuários.
    Filtrar por tipo se especificado.
    """
    query = db.query(DBUsuario)
    
    if tipo:
        try:
            tipo_enum = TipoUsuario(tipo)
            query = query.filter(DBUsuario.tipo == tipo_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Use: aluno, orientador, coordenador"
            )
    
    usuarios = query.all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "nome": u.nome,
            "cpf": u.cpf,
            "telefone": u.telefone,
            "tipo": u.tipo.value,
            "status": u.status.value,
            "curso": u.curso,
            "unidade": u.unidade,
            "matricula": u.matricula,
            "departamento": u.departamento,
            "area_pesquisa": u.area_pesquisa,
            "titulacao": u.titulacao,
            "vagas_disponiveis": u.vagas_disponiveis
        }
        for u in usuarios
    ]

@router.get("/estatisticas")
async def obter_estatisticas(db: Session = Depends(get_db)):
    """
    Obter estatísticas gerais do sistema.
    Apenas para coordenadores (implementar verificação em produção).
    """
    total_usuarios = db.query(DBUsuario).count()
    total_alunos = db.query(DBUsuario).filter(DBUsuario.tipo == TipoUsuario.aluno).count()
    total_orientadores = db.query(DBUsuario).filter(DBUsuario.tipo == TipoUsuario.orientador).count()
    total_coordenadores = db.query(DBUsuario).filter(DBUsuario.tipo == TipoUsuario.coordenador).count()
    total_inscricoes = db.query(InscricaoModel).count()
    
    return {
        "total_usuarios": total_usuarios,
        "total_alunos": total_alunos,
        "total_orientadores": total_orientadores,
        "total_coordenadores": total_coordenadores,
        "total_inscricoes": total_inscricoes
    }

@router.get("/usuarios/{usuario_id}")
async def obter_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Obter informações de um usuário específico.
    """
    usuario = db.query(DBUsuario).filter(DBUsuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return {
        "id": usuario.id,
        "email": usuario.email,
        "nome": usuario.nome,
        "cpf": usuario.cpf,
        "telefone": usuario.telefone,
        "tipo": usuario.tipo.value,
        "status": usuario.status.value,
        "curso": usuario.curso,
        "unidade": usuario.unidade,
        "matricula": usuario.matricula,
        "cr": usuario.cr,
        "documento_cr": usuario.documento_cr,
        "departamento": usuario.departamento,
        "area_pesquisa": usuario.area_pesquisa,
        "titulacao": usuario.titulacao,
        "vagas_disponiveis": usuario.vagas_disponiveis,
        "data_cadastro": usuario.data_cadastro.isoformat() if usuario.data_cadastro else None
    }

@router.put("/usuarios/{usuario_id}")
async def atualizar_usuario(usuario_id: int, usuario_data: dict, db: Session = Depends(get_db)):
    """
    Atualizar informações de um usuário.
    """
    usuario = db.query(DBUsuario).filter(DBUsuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar campos permitidos
    campos_permitidos = {
        "nome", "telefone", "curso", "unidade", "matricula", "cr",
        "departamento", "area_pesquisa", "titulacao", "vagas_disponiveis"
    }
    
    for campo in campos_permitidos:
        if campo in usuario_data:
            setattr(usuario, campo, usuario_data[campo])
    
    db.commit()
    db.refresh(usuario)
    
    return {
        "message": "Usuário atualizado com sucesso",
        "usuario_id": usuario_id
    }

@router.get("/usuarios/{usuario_id}/inscricoes")
async def listar_inscricoes_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """
    Listar todas as inscrições de um usuário.
    """
    # Verificar se o usuário existe
    usuario = db.query(DBUsuario).filter(DBUsuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Buscar inscrições
    inscricoes = db.query(InscricaoModel).filter(InscricaoModel.usuario_id == usuario_id).all()
    
    return {
        "usuario_id": usuario_id,
        "inscricoes": [
            {
                "id": i.id,
                "titulo_projeto": i.titulo_projeto,
                "area_conhecimento": i.area_conhecimento,
                "status": i.status.value,
                "data_submissao": i.data_submissao.isoformat() if i.data_submissao else None,
                "orientador_nome": i.orientador_nome
            }
            for i in inscricoes
        ]
    }
