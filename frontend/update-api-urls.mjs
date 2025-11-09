// Script para atualizar todas as URLs da API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToUpdate = [
  'src/pages/DashboardOrientador.jsx',
  'src/pages/EnviarRelatorioParcial.jsx',
  'src/pages/EnviarArtigoFinal.jsx',
  'src/pages/EnviarApresentacaoAmostra.jsx',
  'src/pages/DashboardAluno.jsx',
  'src/pages/DashboardCoordenador.jsx',
  'src/pages/CompletarCadastro.jsx',
  'src/pages/AuthCallback.jsx'
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;

  // Adicionar import se não existir
  if (!content.includes("import API_BASE_URL from '../config/api'")) {
    // Encontrar a última linha de import
    const importLines = content.match(/^import .+;$/gm) || [];
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, `${lastImport}\nimport API_BASE_URL from '../config/api';`);
      updated = true;
    }
  }

  // Substituir URLs hardcoded
  const urlPattern = /'http:\/\/localhost:8000\/api/g;
  if (urlPattern.test(content)) {
    content = content.replace(urlPattern, '`${API_BASE_URL}');
    // Corrigir o fechamento das strings template
    content = content.replace(/`\$\{API_BASE_URL\}\/([^']+)'/g, '`${API_BASE_URL}/$1`');
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Atualizado: ${filePath}`);
  } else {
    console.log(`- Sem mudanças: ${filePath}`);
  }
}

console.log('Atualizando URLs da API...\n');
filesToUpdate.forEach(updateFile);
console.log('\nConcluído!');
