const fs = require('fs');
let code = fs.readFileSync('src/pages/MyCasePage.tsx', 'utf8');
if (!code.includes('XCircle')) {
  code = code.replace(/import \{([^}]+)\}\ from 'lucide-react';/, (match, group1) => {
    return `import {${group1}, XCircle } from 'lucide-react';`;
  });
}
fs.writeFileSync('src/pages/MyCasePage.tsx', code);
