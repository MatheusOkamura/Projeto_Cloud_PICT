// Script Node.js para atualizar URLs
const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/DashboardOrientador.jsx',
  'src/pages/DashboardAluno.jsx',
  'src/pages/DashboardCoordenador.jsx',
  'src/pages/EnviarRelatorioParcial.jsx',
  'src/pages/EnviarArtigoFinal.jsx',
  'src/pages/EnviarApresentacaoAmostra.jsx',
  'src/pages/AuthCallback.jsx',
  'src/pages/CoordenadorStatus.jsx',
  'src/pages/Cadastro.jsx'
];

const oldUrl = 'http://localhost:8000/api';
const importLine = "import API_BASE_URL from '../config/api';";

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Adicionar import se não existir
  if (!content.includes("import API_BASE_URL")) {
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
      modified = true;
      console.log(`✓ Import adicionado em: ${file}`);
    }
  }

  // Substituir URLs
  if (content.includes(oldUrl)) {
    // Substituir em strings simples
    content = content.replace(new RegExp(`'${oldUrl}/`, 'g'), '`${API_BASE_URL}/');
    content = content.replace(new RegExp(`"${oldUrl}/`, 'g'), '`${API_BASE_URL}/');
    
    // Corrigir fechamento de template strings
    content = content.replace(/`\$\{API_BASE_URL\}\/([^`]+)'/g, '`${API_BASE_URL}/$1`');
    content = content.replace(/`\$\{API_BASE_URL\}\/([^`]+)"/g, '`${API_BASE_URL}/$1`');
    
    modified = true;
    console.log(`✓ URLs atualizadas em: ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Salvo: ${file}\n`);
  } else {
    console.log(`⚪ Sem alterações: ${file}\n`);
  }
});

console.log('✅ Concluído!');
