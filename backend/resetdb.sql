-- Script para limpar completamente o banco de dados SQL Server e reinserir dados seed

-- Desabilitar checagem de chaves estrangeiras temporariamente
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

-- Limpar todas as tabelas (na ordem correta devido aos relacionamentos)
DELETE FROM mensagens_relatorios;
DELETE FROM relatorios_mensais;
DELETE FROM entregas;
DELETE FROM notificacoes;
DELETE FROM projetos;
DELETE FROM inscricoes;
DELETE FROM usuarios;
DELETE FROM cursos;
DELETE FROM configuracoes_sistema;

-- Resetar identity de todas as tabelas
DBCC CHECKIDENT ('mensagens_relatorios', RESEED, 0);
DBCC CHECKIDENT ('relatorios_mensais', RESEED, 0);
DBCC CHECKIDENT ('entregas', RESEED, 0);
DBCC CHECKIDENT ('notificacoes', RESEED, 0);
DBCC CHECKIDENT ('projetos', RESEED, 0);
DBCC CHECKIDENT ('inscricoes', RESEED, 0);
DBCC CHECKIDENT ('usuarios', RESEED, 0);
DBCC CHECKIDENT ('cursos', RESEED, 0);
DBCC CHECKIDENT ('configuracoes_sistema', RESEED, 0);

-- Reabilitar checagem de chaves estrangeiras
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';

-- Inserir cursos
INSERT INTO cursos (nome, codigo, ativo) VALUES
('Administração', 'ADM', 1),
('Ciência de Dados e Inteligência Artificial', 'CDIA', 1),
('Ciências Econômicas', 'ECO', 1),
('Ciências Contábeis', 'CONT', 1),
('Engenharia da Computação', 'ECOMP', 1),
('Engenharia de Software', 'ESOFT', 1),
('Engenharia da Produção', 'EPROD', 1),
('Relações Internacionais', 'RI', 1),
('Direito', 'DIR', 1);

-- Inserir usuários de exemplo
INSERT INTO usuarios (email, senha, nome, cpf, telefone, tipo, status, curso, unidade, matricula, cr, data_cadastro) 
VALUES ('aluno@alunos.ibmec.edu.br', 'senha123', 'João Silva', '123.456.789-00', '(11) 98765-4321', 'aluno', 'ativo', 'Administração', 'Faria Lima', '2024001', 8.5, GETDATE());

INSERT INTO usuarios (email, senha, nome, cpf, telefone, tipo, status, departamento, area_pesquisa, titulacao, vagas_disponiveis, data_cadastro) 
VALUES ('orientador@orientador.ibmec.edu.br', 'senha123', 'Prof. Maria Santos', '987.654.321-00', '(11) 91234-5678', 'orientador', 'ativo', 'Gestão', 'Marketing Digital', 'Doutora', 3, GETDATE());

INSERT INTO usuarios (email, senha, nome, cpf, telefone, tipo, status, departamento, titulacao, data_cadastro) 
VALUES ('coordenador@coordenador.ibmec.edu.br', 'senha123', 'Prof. Dr. Carlos Oliveira', '111.222.333-44', '(11) 99999-8888', 'coordenador', 'ativo', 'Coordenação de Pesquisa', 'Doutor', GETDATE());

-- Inserir configurações do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao, ano, data_atualizacao) VALUES
('ano_vigente', '2025', 'Ano letivo vigente para inscrições', 2025, GETDATE()),
('inscricoes_abertas', 'true', 'Indica se as inscrições estão abertas', 2025, GETDATE()),
('data_inicio_inscricoes', '2025-01-15', 'Data de início das inscrições', 2025, GETDATE()),
('data_fim_inscricoes', '2025-03-31', 'Data de término das inscrições', 2025, GETDATE());

-- Verificar dados inseridos
SELECT 'Cursos inseridos:' AS resultado, COUNT(*) AS total FROM cursos;
SELECT 'Usuários inseridos:' AS resultado, COUNT(*) AS total FROM usuarios;
SELECT 'Configurações inseridas:' AS resultado, COUNT(*) AS total FROM configuracoes_sistema;

PRINT 'Banco de dados limpo e reinicializado com sucesso!';