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
    pendente_orientador = "pendente_orientador"
    pendente_coordenador = "pendente_coordenador"
    pendente_apresentacao = "pendente_apresentacao"
    aprovada = "aprovada"
    rejeitada_orientador = "rejeitada_orientador"
    rejeitada_coordenador = "rejeitada_coordenador"
    rejeitada_apresentacao = "rejeitada_apresentacao"

class EtapaProjeto(str, enum.Enum):
    envio_proposta = "envio_proposta"
    apresentacao_proposta = "apresentacao_proposta"
    validacao = "validacao"
    relatorio_mensal_1 = "relatorio_mensal_1"
    relatorio_mensal_2 = "relatorio_mensal_2"
    relatorio_mensal_3 = "relatorio_mensal_3"
    relatorio_mensal_4 = "relatorio_mensal_4"
    relatorio_parcial = "relatorio_parcial"
    relatorio_mensal_5 = "relatorio_mensal_5"
    apresentacao_amostra = "apresentacao_amostra"
    artigo_final = "artigo_final"
    concluido = "concluido"

# Modelos
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha = Column(String(255), nullable=False)
    nome = Column(String(255), nullable=True)
    cpf = Column(String(14), nullable=True, index=True)  # ❌ Removido unique=True
    telefone = Column(String(20), nullable=True)
    tipo = Column(SQLEnum(TipoUsuario), nullable=False)
    status = Column(SQLEnum(StatusUsuario), default=StatusUsuario.pendente)
    data_cadastro = Column(DateTime, default=datetime.now)
    
    # Campos específicos para alunos
    curso = Column(String(255), nullable=True)
    unidade = Column(String(100), nullable=True)
    matricula = Column(String(50), nullable=True, index=True)  # ❌ Removido unique=True
    cr = Column(Float, nullable=True)
    documento_cr = Column(String(500), nullable=True)
    
    # Campos específicos para orientadores
    departamento = Column(String(255), nullable=True)
    area_pesquisa = Column(Text, nullable=True)
    titulacao = Column(String(100), nullable=True)
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
    nome = Column(String(255), unique=True, nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    ativo = Column(Integer, default=1)

class Inscricao(Base):
    __tablename__ = "inscricoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    ano = Column(Integer, default=lambda: datetime.now().year, nullable=False, index=True)
    
    # Dados do aluno (snapshot no momento da inscrição)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    cpf = Column(String(14), nullable=True)
    telefone = Column(String(20), nullable=True)
    curso = Column(String(255), nullable=True)
    matricula = Column(String(50), nullable=True)
    unidade = Column(String(100), nullable=True)
    cr = Column(Float, nullable=True)
    
    # Dados do projeto
    titulo_projeto = Column(String(500), nullable=False)
    area_conhecimento = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=True)
    metodologia = Column(Text, nullable=True)
    resultados_esperados = Column(Text, nullable=True)
    arquivo_projeto = Column(String(500), nullable=True)
    
    # Orientador selecionado
    orientador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    orientador_nome = Column(String(255), nullable=True)
    
    # Status e datas
    status = Column(SQLEnum(StatusInscricao), default=StatusInscricao.pendente_orientador)
    feedback = Column(Text, nullable=True)
    feedback_orientador = Column(Text, nullable=True)
    feedback_coordenador = Column(Text, nullable=True)
    status_aprovacao_orientador = Column(String(20), default="pendente")
    status_aprovacao_coordenador = Column(String(20), default="pendente")
    data_submissao = Column(DateTime, default=datetime.now)
    data_avaliacao_orientador = Column(DateTime, nullable=True)
    data_avaliacao_coordenador = Column(DateTime, nullable=True)
    data_avaliacao = Column(DateTime, nullable=True)
    
    # Relacionamento
    usuario = relationship("Usuario", back_populates="inscricoes", foreign_keys=[usuario_id])

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    orientador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    inscricao_id = Column(Integer, ForeignKey("inscricoes.id"), nullable=True)
    ano = Column(Integer, default=lambda: datetime.now().year, nullable=False, index=True)
    
    titulo = Column(String(500), nullable=False)
    area_conhecimento = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    objetivos = Column(Text, nullable=True)
    metodologia = Column(Text, nullable=True)
    
    etapa_atual = Column(SQLEnum(EtapaProjeto), default=EtapaProjeto.envio_proposta)
    data_inicio = Column(DateTime, nullable=True)
    data_conclusao = Column(DateTime, nullable=True)
    
    # Dados da apresentação (proposta inicial)
    apresentacao_data = Column(String(10), nullable=True)
    apresentacao_hora = Column(String(5), nullable=True)
    apresentacao_campus = Column(String(100), nullable=True)
    apresentacao_sala = Column(String(50), nullable=True)
    status_apresentacao = Column(String(20), default="pendente")
    feedback_apresentacao = Column(Text, nullable=True)
    data_avaliacao_apresentacao = Column(DateTime, nullable=True)
    
    # Dados da apresentação na amostra científica
    amostra_data = Column(String(10), nullable=True)
    amostra_hora = Column(String(5), nullable=True)
    amostra_campus = Column(String(100), nullable=True)
    amostra_sala = Column(String(50), nullable=True)
    status_amostra = Column(String(20), default="pendente")
    
    # Certificado de conclusão
    certificado_arquivo = Column(String(500), nullable=True)
    certificado_data_emissao = Column(DateTime, nullable=True)
    
    # Relacionamentos
    aluno = relationship("Usuario", back_populates="projetos_como_aluno", foreign_keys=[aluno_id])
    orientador = relationship("Usuario", back_populates="projetos_como_orientador", foreign_keys=[orientador_id])
    entregas = relationship("Entrega", back_populates="projeto")
    relatorios_mensais = relationship("RelatorioMensal", back_populates="projeto")

class RelatorioMensal(Base):
    __tablename__ = "relatorios_mensais"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    ano = Column(Integer, default=lambda: datetime.now().year, nullable=False, index=True)
    
    mes = Column(String(7), nullable=False)
    descricao = Column(Text, nullable=True)
    arquivo = Column(String(500), nullable=True)
    
    data_envio = Column(DateTime, default=datetime.now)
    
    # Relacionamento
    projeto = relationship("Projeto", back_populates="relatorios_mensais")

class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    ano = Column(Integer, default=lambda: datetime.now().year, nullable=False, index=True)
    
    tipo = Column(String(50), nullable=False)
    titulo = Column(String(500), nullable=False)
    descricao = Column(Text, nullable=True)
    arquivo = Column(String(500), nullable=True)
    
    data_entrega = Column(DateTime, default=datetime.now)
    prazo = Column(DateTime, nullable=True)
    
    # Campos de aprovação
    status_aprovacao_orientador = Column(String(20), default="pendente")
    feedback_orientador = Column(Text, nullable=True)
    data_avaliacao_orientador = Column(DateTime, nullable=True)
    
    status_aprovacao_coordenador = Column(String(20), default="pendente")
    feedback_coordenador = Column(Text, nullable=True)
    data_avaliacao_coordenador = Column(DateTime, nullable=True)
    
    # Relacionamentos
    projeto = relationship("Projeto", back_populates="entregas")
    aluno = relationship("Usuario", back_populates="entregas")

class Notificacao(Base):
    __tablename__ = "notificacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    titulo = Column(String(255), nullable=False)
    mensagem = Column(Text, nullable=False)
    tipo = Column(String(20), nullable=False)
    lida = Column(Integer, default=0)
    
    data_criacao = Column(DateTime, default=datetime.now)
    
    # Relacionamento
    usuario = relationship("Usuario", back_populates="notificacoes")

class MensagemRelatorio(Base):
    __tablename__ = "mensagens_relatorios"

    id = Column(Integer, primary_key=True, index=True)
    entrega_id = Column(Integer, ForeignKey("entregas.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    mensagem = Column(Text, nullable=False)
    tipo_usuario = Column(String(20), nullable=False)
    
    data_criacao = Column(DateTime, default=datetime.now)
    
    # Relacionamentos
    entrega = relationship("Entrega", foreign_keys=[entrega_id])
    usuario = relationship("Usuario", foreign_keys=[usuario_id])

class ConfiguracaoSistema(Base):
    __tablename__ = "configuracoes_sistema"

    id = Column(Integer, primary_key=True, index=True)
    chave = Column(String(100), unique=True, nullable=False, index=True)
    valor = Column(String(500), nullable=False)
    descricao = Column(Text, nullable=True)
    ano = Column(Integer, nullable=True)
    data_atualizacao = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    atualizado_por = Column(Integer, nullable=True)