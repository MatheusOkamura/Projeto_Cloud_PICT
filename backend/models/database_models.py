from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enums
class TipoUsuario(str, enum.Enum):
    aluno = "aluno"
    orientador = "orientador"
    coordenador = "coordenador"

class StatusUsuario(str, enum.Enum):
    pendente = "pendente"
    ativo = "ativo"
    inativo = "inativo"

class StatusInscricao(str, enum.Enum):
    pendente_orientador = "pendente_orientador"  # Aguardando aprovação do orientador
    pendente_coordenador = "pendente_coordenador"  # Aprovada pelo orientador, aguardando coordenador
    aprovada = "aprovada"  # Aprovada pelo coordenador
    rejeitada_orientador = "rejeitada_orientador"  # Rejeitada pelo orientador
    rejeitada_coordenador = "rejeitada_coordenador"  # Rejeitada pelo coordenador

class EtapaProjeto(str, enum.Enum):
    inscricao = "inscricao"
    desenvolvimento = "desenvolvimento"
    relatorio_parcial = "relatorio_parcial"
    apresentacao = "apresentacao"
    relatorio_final = "relatorio_final"
    concluido = "concluido"

# Modelos
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    nome = Column(String, nullable=True)
    cpf = Column(String, unique=True, nullable=True)
    telefone = Column(String, nullable=True)
    tipo = Column(SQLEnum(TipoUsuario), nullable=False)
    status = Column(SQLEnum(StatusUsuario), default=StatusUsuario.pendente)
    data_cadastro = Column(DateTime, default=datetime.now)
    
    # Campos específicos para alunos
    curso = Column(String, nullable=True)
    unidade = Column(String, nullable=True)
    matricula = Column(String, unique=True, nullable=True)
    cr = Column(Float, nullable=True)
    documento_cr = Column(String, nullable=True)
    
    # Campos específicos para orientadores
    departamento = Column(String, nullable=True)
    area_pesquisa = Column(String, nullable=True)
    titulacao = Column(String, nullable=True)
    vagas_disponiveis = Column(Integer, default=0)
    
    # Relacionamentos
    inscricoes = relationship("Inscricao", back_populates="usuario", foreign_keys="Inscricao.usuario_id")
    projetos_como_aluno = relationship("Projeto", back_populates="aluno", foreign_keys="Projeto.aluno_id")
    projetos_como_orientador = relationship("Projeto", back_populates="orientador", foreign_keys="Projeto.orientador_id")
    entregas = relationship("Entrega", back_populates="aluno")
    notificacoes = relationship("Notificacao", back_populates="usuario")

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    codigo = Column(String, unique=True, nullable=False)
    ativo = Column(Integer, default=1)

class Inscricao(Base):
    __tablename__ = "inscricoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Dados do aluno (snapshot no momento da inscrição)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False)
    cpf = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    curso = Column(String, nullable=True)
    matricula = Column(String, nullable=True)
    unidade = Column(String, nullable=True)
    cr = Column(Float, nullable=True)
    
    # Dados do projeto
    titulo_projeto = Column(String, nullable=False)
    area_conhecimento = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=True)
    metodologia = Column(Text, nullable=True)
    resultados_esperados = Column(Text, nullable=True)
    arquivo_projeto = Column(String, nullable=True)
    
    # Orientador selecionado
    orientador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    orientador_nome = Column(String, nullable=True)
    
    # Status e datas
    status = Column(SQLEnum(StatusInscricao), default=StatusInscricao.pendente_orientador)
    feedback = Column(Text, nullable=True)
    feedback_orientador = Column(Text, nullable=True)
    feedback_coordenador = Column(Text, nullable=True)
    status_aprovacao_orientador = Column(String, default="pendente")  # pendente, aprovado, rejeitado
    status_aprovacao_coordenador = Column(String, default="pendente")  # pendente, aprovado, rejeitado
    data_submissao = Column(DateTime, default=datetime.now)
    data_avaliacao_orientador = Column(DateTime, nullable=True)
    data_avaliacao_coordenador = Column(DateTime, nullable=True)
    data_avaliacao = Column(DateTime, nullable=True)  # Mantém por compatibilidade
    
    # Relacionamento
    usuario = relationship("Usuario", back_populates="inscricoes", foreign_keys=[usuario_id])

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    orientador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    inscricao_id = Column(Integer, ForeignKey("inscricoes.id"), nullable=True)
    
    titulo = Column(String, nullable=False)
    area_conhecimento = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=True)
    metodologia = Column(Text, nullable=True)
    
    etapa_atual = Column(SQLEnum(EtapaProjeto), default=EtapaProjeto.inscricao)
    data_inicio = Column(DateTime, nullable=True)
    data_conclusao = Column(DateTime, nullable=True)
    
    # Relacionamentos
    aluno = relationship("Usuario", back_populates="projetos_como_aluno", foreign_keys=[aluno_id])
    orientador = relationship("Usuario", back_populates="projetos_como_orientador", foreign_keys=[orientador_id])
    entregas = relationship("Entrega", back_populates="projeto")

class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    tipo = Column(String, nullable=False)  # relatorio_parcial, relatorio_mensal, apresentacao, artigo_final
    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=True)
    arquivo = Column(String, nullable=True)
    
    data_entrega = Column(DateTime, default=datetime.now)
    prazo = Column(DateTime, nullable=True)
    
    # Campos de aprovação
    status_aprovacao_orientador = Column(String, default="pendente")  # pendente, aprovado, rejeitado
    feedback_orientador = Column(Text, nullable=True)
    data_avaliacao_orientador = Column(DateTime, nullable=True)
    
    status_aprovacao_coordenador = Column(String, default="pendente")  # pendente, aprovado, rejeitado
    feedback_coordenador = Column(Text, nullable=True)
    data_avaliacao_coordenador = Column(DateTime, nullable=True)
    
    # Relacionamentos
    projeto = relationship("Projeto", back_populates="entregas")
    aluno = relationship("Usuario", back_populates="entregas")

class Notificacao(Base):
    __tablename__ = "notificacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    titulo = Column(String, nullable=False)
    mensagem = Column(Text, nullable=False)
    tipo = Column(String, nullable=False)  # info, sucesso, aviso, erro
    lida = Column(Integer, default=0)
    
    data_criacao = Column(DateTime, default=datetime.now)
    
    # Relacionamento
    usuario = relationship("Usuario", back_populates="notificacoes")
