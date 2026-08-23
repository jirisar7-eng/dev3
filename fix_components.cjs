const fs = require('fs');

// Fix MapaSubjektuView.tsx
let f = fs.readFileSync('src/components/public/MapaSubjektuView.tsx', 'utf8');
if (!f.includes("import { ENTITY_CONFIG } from '../../config/entityConfig';")) {
  f = f.replace("import { SubjektyMap } from './SubjektyMap';", "import { SubjektyMap } from './SubjektyMap';\nimport { ENTITY_CONFIG } from '../../config/entityConfig';");
}
f = f.replace(/const ENTITY_CONFIG: Record<[\s\S]*?};\n/, '');
fs.writeFileSync('src/components/public/MapaSubjektuView.tsx', f);

// Fix RegistrSubjektu.tsx
let r = fs.readFileSync('src/components/public/RegistrSubjektu.tsx', 'utf8');
r = r.replace(/const ENTITY_CONFIG: Record<[\s\S]*?};\n/, '');
fs.writeFileSync('src/components/public/RegistrSubjektu.tsx', r);

