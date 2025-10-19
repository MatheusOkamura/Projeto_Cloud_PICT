from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from pathlib import Path

router = APIRouter()

# ...existing code...

# Endpoint para aluno enviar entrega de etapa diretamente
@router.post("/alunos/{aluno_id}/entrega-etapa", status_code=status.HTTP_201_CREATED)
async def aluno_enviar_entrega_etapa(
    aluno_id: int,
    etapa: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...)
):
    # Encontrar projeto e etapa atual
    for orientador_id, alunos in orientadores_alunos_db.items():
        projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
        if projeto:
            etapa_ativa = etapa or projeto.get("etapa", "proposta")
            if etapa_ativa not in ETAPA_TIPO_MAP:
                raise HTTPException(status_code=400, detail="Etapa inválida para entrega")
            uploads_dir = Path("uploads/entregas")
            uploads_dir.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_name = f"entrega_{etapa_ativa}_aluno{aluno_id}_{timestamp}_{arquivo.filename}"
            path = uploads_dir / safe_name
            with open(path, "wb") as f:
                f.write(await arquivo.read())
            lista = entregas_db.setdefault(projeto["projeto_id"], [])
            novo_id = (max([e.get("id", 0) for e in lista]) + 1) if lista else 1
            lista.append({
                "id": novo_id,
                "tipo": ETAPA_TIPO_MAP[etapa_ativa],
                "data": datetime.now().isoformat(),
                "status": "pendente",
                "arquivo": safe_name,
                "descricao": descricao or ""
            })
            return {"message": "Entrega registrada com sucesso", "projeto_id": projeto["projeto_id"], "entrega_id": novo_id}
    raise HTTPException(status_code=404, detail="Aluno não encontrado em nenhum projeto")
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from pathlib import Path

router = APIRouter()

# Simulação de vínculo orientador -> alunos e projetos
orientadores_alunos_db = {
    2: [  # orientador id=2
        {
            "aluno_id": 1,
            "nome": "João Silva",
            "curso": "Administração",
            "projeto_id": 101,
            "projeto_titulo": "Análise de Mercado Digital",
            "status": "ativo",
            "progresso": 65,
            "etapa": "proposta"
        },
        {
            "aluno_id": 6,
            "nome": "Maria Oliveira",
            "curso": "Economia",
            "projeto_id": 102,
            "projeto_titulo": "Impacto da Inflação no Consumo",
            "status": "ativo",
            "progresso": 40,
            "etapa": "relatorio_parcial"
        },
    ]
}

# Simulação de entregas dos alunos (por projeto)
entregas_db = {
    101: [
        {"id": 1, "tipo": "Relatório Parcial", "data": datetime(2025, 3, 10), "status": "entregue"},
        {"id": 2, "tipo": "Plano de Trabalho", "data": datetime(2025, 2, 15), "status": "aprovado"},
    ],
    102: [
        {"id": 3, "tipo": "Relatório Parcial", "data": datetime(2025, 3, 5), "status": "em revisão"},
    ]
}

# Relatórios mensais enviados pelo orientador por aluno
UPLOAD_DIR = Path("uploads/relatorios")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
relatorios_mensais_db = {
    # chave: (orientador_id, aluno_id)
    # valor: lista de relatórios
}

# Mapeamento das etapas válidas
ETAPAS_VALIDAS = [
    "proposta",               # Envio e apresentação da proposta
    "relatorio_parcial",      # Envio do relatório parcial
    "apresentacao_amostra",   # Apresentação de amostra
    "artigo_final",           # Envio do artigo final
    "finalizado"              # Finalizado
]

# Mapeia etapas para os tipos de entrega visíveis
ETAPA_TIPO_MAP = {
    "proposta": "Proposta",
    "relatorio_parcial": "Relatório Parcial",
    "apresentacao_amostra": "Apresentação de Amostra",
    "artigo_final": "Artigo Final",
}

@router.get("/orientadores/{orientador_id}/alunos")
async def listar_alunos_orientador(orientador_id: int):
    alunos = orientadores_alunos_db.get(orientador_id, [])
    return {"orientador_id": orientador_id, "alunos": alunos}

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/entregas")
async def listar_entregas_aluno(orientador_id: int, aluno_id: int):
    # encontrar projeto do aluno
    alunos = orientadores_alunos_db.get(orientador_id, [])
    projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado para este orientador")
    entregas = entregas_db.get(projeto["projeto_id"], [])
    # serializar datas
    entregas_serial = [
        {**e, "data": e["data"].isoformat()} for e in entregas
    ]
    return {"aluno_id": aluno_id, "projeto_id": projeto["projeto_id"], "entregas": entregas_serial}

@router.post("/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais", status_code=status.HTTP_201_CREATED)
async def enviar_relatorio_mensal(
    orientador_id: int,
    aluno_id: int,
    mes: str = Form(...),  # formato AAAA-MM
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...)
):
    # validação básica do mês
    try:
        datetime.strptime(mes + "-01", "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de mês inválido. Use AAAA-MM")

    # salvar arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"orientador{orientador_id}_aluno{aluno_id}_{mes}_{timestamp}_{arquivo.filename}"
    path = UPLOAD_DIR / safe_name
    with open(path, "wb") as f:
        f.write(await arquivo.read())

    key = (orientador_id, aluno_id)
    relatorios_mensais_db.setdefault(key, []).append({
        "id": len(relatorios_mensais_db.get(key, [])) + 1,
        "mes": mes,
        "descricao": descricao,
        "arquivo": safe_name,
        "data_envio": datetime.now().isoformat()
    })

    return {"message": "Relatório mensal enviado com sucesso", "arquivo": safe_name}

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/relatorios-mensais")
async def listar_relatorios_mensais(orientador_id: int, aluno_id: int):
    key = (orientador_id, aluno_id)
    return {"orientador_id": orientador_id, "aluno_id": aluno_id, "relatorios": relatorios_mensais_db.get(key, [])}

@router.post("/orientadores/{orientador_id}/alunos/{aluno_id}/entrega-etapa", status_code=status.HTTP_201_CREATED)
async def enviar_entrega_etapa(
    orientador_id: int,
    aluno_id: int,
    etapa: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    arquivo: UploadFile = File(...)
):
    # Encontrar projeto e etapa atual
    alunos = orientadores_alunos_db.get(orientador_id, [])
    projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado para este orientador")
    etapa_ativa = etapa or projeto.get("etapa", "proposta")
    if etapa_ativa not in ETAPA_TIPO_MAP:
        raise HTTPException(status_code=400, detail="Etapa inválida para entrega")

    # salvar arquivo
    uploads_dir = Path("uploads/entregas")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = f"entrega_{etapa_ativa}_orientador{orientador_id}_aluno{aluno_id}_{timestamp}_{arquivo.filename}"
    path = uploads_dir / safe_name
    with open(path, "wb") as f:
        f.write(await arquivo.read())

    lista = entregas_db.setdefault(projeto["projeto_id"], [])
    novo_id = (max([e.get("id", 0) for e in lista]) + 1) if lista else 1
    lista.append({
        "id": novo_id,
        "tipo": ETAPA_TIPO_MAP[etapa_ativa],
        "data": datetime.now().isoformat(),
        "status": "pendente",
        "arquivo": safe_name,
        "descricao": descricao or ""
    })

    return {"message": "Entrega registrada com sucesso", "projeto_id": projeto["projeto_id"], "entrega_id": novo_id}

@router.get("/orientadores/{orientador_id}/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa(orientador_id: int, aluno_id: int):
    alunos = orientadores_alunos_db.get(orientador_id, [])
    projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Aluno não encontrado para este orientador")
    return {"aluno_id": aluno_id, "etapa": projeto.get("etapa", "proposta"), "etapas_validas": ETAPAS_VALIDAS}

# PATCH de status-etapa removido: somente coordenadores podem alterar a etapa.

@router.get("/projetos/alunos/{aluno_id}/status-etapa")
async def obter_status_etapa_por_aluno(aluno_id: int):
    # Procura o aluno em qualquer orientador
    for orientador_id, alunos in orientadores_alunos_db.items():
        projeto = next((a for a in alunos if a["aluno_id"] == aluno_id), None)
        if projeto:
            return {"aluno_id": aluno_id, "orientador_id": orientador_id, "etapa": projeto.get("etapa", "proposta"), "etapas_validas": ETAPAS_VALIDAS}
    raise HTTPException(status_code=404, detail="Aluno não encontrado em nenhum projeto")
