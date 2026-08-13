const fs = require('fs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes("import { legalDocumentsContent }")) {
    content = "import { legalDocumentsContent } from '../data/legalDocuments';\n" + content;
  }
  
  content = content.replace(/content: \`Podmínky užívání portálu[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.terms,\n    ");
  content = content.replace(/content: \`Zásady ochrany osobních[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.gdpr,\n    ");
  content = content.replace(/content: \`Zásady používání souborů cookie[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.cookies,\n    ");
  content = content.replace(/content: \`Právní výhrada k vygenerovaným dokumentům[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.legal,\n    ");
  content = content.replace(/content: \`DOBROVOLNICKÝ KODEX[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.volunteer_code,\n    ");
  content = content.replace(/content: \`PROHLÁŠENÍ O VYUŽITÍ UMĚLÉ INTELIGENCE[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.ai_statement,\n    ");
  content = content.replace(/content: \`DOHODA O DOBROVOLNÉ SPOLUPRÁCI[^]*?(?=\`,|version:)/g, "content: legalDocumentsContent.volunteer_agreement,\n    ");
  
  // Try matching with backticks directly if not matched
  // Since we replaced the matched group, the trailing backtick might still be there for some
  content = content.replace(/content: legalDocumentsContent\.(\w+),\n    \`,/g, "content: legalDocumentsContent.$1,");

  fs.writeFileSync(filePath, content);
  console.log("Updated", filePath);
}

updateFile('src/services/dbStore.ts');
updateFile('src/services/seedService.ts');
