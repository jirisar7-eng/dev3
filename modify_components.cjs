const fs = require('fs');
const path = require('path');

// --- 1. Modify SubjektyMap.tsx ---
const subjektyMapPath = path.join('src', 'components', 'public', 'SubjektyMap.tsx');
let subjektyMap = fs.readFileSync(subjektyMapPath, 'utf8');

// Import ENTITY_CONFIG
if (!subjektyMap.includes('ENTITY_CONFIG')) {
  subjektyMap = subjektyMap.replace(
    /import { Subjekt, EntityType } from '\.\.\/\.\.\/types\/index';/,
    "import { Subjekt, EntityType } from '../../types/index';\nimport { ENTITY_CONFIG } from '../../config/entityConfig';"
  );
}

// Remove getEntityPinColor
subjektyMap = subjektyMap.replace(/const getEntityPinColor = \[\s\S]*?};\n\n/, '');

// Replace createCustomPinIcon
const createCustomPinIconReplacement = `const createCustomPinIcon = (type: EntityType | string, isSelected: boolean, name?: string) => {
  const config = (type in ENTITY_CONFIG) ? ENTITY_CONFIG[type as EntityType] : null;
  const color = config ? config.pinColorHex : '#334155';
  const size = isSelected ? 42 : 32;
  const strokeColor = isSelected ? '#fbbf24' : '#ffffff';
  const svgPath = config ? config.svgPath : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
  const ariaLabel = name ? \`\${config ? config.badgeText : type} - \${name}\` : (config ? config.badgeText : type);

  return L.divIcon({
    className: 'custom-subjekt-marker-pin',
    html: \`
      <div style="position: relative; width: \${size}px; height: \${size}px; display: flex; align-items: center; justify-content: center;" aria-label="\${ariaLabel}" title="\${ariaLabel}">
        \${isSelected ? \`<span style="position: absolute; inset: -8px; border-radius: 9999px; background-color: \${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>\` : ''}
        <div style="
          width: \${size}px;
          height: \${size}px;
          border-radius: 9999px;
          background-color: \${color};
          border: 3px solid \${strokeColor};
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transform: \${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease-in-out;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="\${isSelected ? '20' : '15'}" height="\${isSelected ? '20' : '15'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            \${svgPath}
          </svg>
        </div>
      </div>
    \`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
};`;

subjektyMap = subjektyMap.replace(/const createCustomPinIcon = \[\s\S]*?popupAnchor: \[0, -\(size \/ 2 \+ 6\)\],\n  }\);\n};/, createCustomPinIconReplacement);

// Fix call to createCustomPinIcon inside SubjektMarker component
subjektyMap = subjektyMap.replace(
  /const customIcon = useMemo\(\n    \(\) => createCustomPinIcon\(subjekt\.type, isSelected\),\n    \[subjekt\.type, isSelected\]\n  \);/,
  `const customIcon = useMemo(
    () => createCustomPinIcon(subjekt.type, isSelected, subjekt.name),
    [subjekt.type, isSelected, subjekt.name]
  );`
);

// Replace formatEntityType and getEntityPinColor calls in Popup
subjektyMap = subjektyMap.replace(/getEntityPinColor\(subjekt\.type\)/g, '(subjekt.type in ENTITY_CONFIG ? ENTITY_CONFIG[subjekt.type as EntityType].pinColorHex : "#334155")');
subjektyMap = subjektyMap.replace(/formatEntityType\(subjekt\.type\)/g, '(subjekt.type in ENTITY_CONFIG ? ENTITY_CONFIG[subjekt.type as EntityType].badgeText : String(subjekt.type))');

// Remove formatEntityType function definition
subjektyMap = subjektyMap.replace(/export function formatEntityType\([\s\S]*?}\n}\n/, '');

// Delete getEntityPinColor function from the file entirely if still present
if (subjektyMap.includes('const getEntityPinColor')) {
    subjektyMap = subjektyMap.replace(/const getEntityPinColor = \([\s\S]*?};\n/, '');
}

fs.writeFileSync(subjektyMapPath, subjektyMap);
console.log('Modified SubjektyMap.tsx');


// --- 2. Modify RegistrSubjektu.tsx ---
const registrSubjektuPath = path.join('src', 'components', 'public', 'RegistrSubjektu.tsx');
let registrSubjektu = fs.readFileSync(registrSubjektuPath, 'utf8');

if (!registrSubjektu.includes('ENTITY_CONFIG } from \'../../config/entityConfig\'')) {
  registrSubjektu = registrSubjektu.replace(
    /import { SubjektyMap } from '\.\/SubjektyMap';/,
    "import { SubjektyMap } from './SubjektyMap';\nimport { ENTITY_CONFIG } from '../../config/entityConfig';"
  );
}

// Remove local ENTITY_CONFIG
registrSubjektu = registrSubjektu.replace(/const ENTITY_CONFIG: Record<EntityType, \{ [\s\S]*?} = {[\s\S]*?PORADNA_CHARITA: {[\s\S]*?},\n};\n/g, '');

// Fix 'Všechny subjekty' icon
registrSubjektu = registrSubjektu.replace(
  /<Building2 className="w-4 h-4 text-indigo-400" \/>\n\s*<span>Všechny subjekty<\/span>/g,
  `<MapPin className="w-4 h-4 text-indigo-400" />
          <span>Všechny subjekty</span>`
);

fs.writeFileSync(registrSubjektuPath, registrSubjektu);
console.log('Modified RegistrSubjektu.tsx');


// --- 3. Modify MapaSubjektuView.tsx ---
const mapaSubjektuViewPath = path.join('src', 'components', 'public', 'MapaSubjektuView.tsx');
let mapaSubjektuView = fs.readFileSync(mapaSubjektuViewPath, 'utf8');

if (!mapaSubjektuView.includes('ENTITY_CONFIG } from \'../../config/entityConfig\'')) {
  mapaSubjektuView = mapaSubjektuView.replace(
    /import { SubjektyMap, formatEntityType } from '\.\/SubjektyMap';/,
    "import { SubjektyMap } from './SubjektyMap';\nimport { ENTITY_CONFIG } from '../../config/entityConfig';"
  );
}

// Remove local ENTITY_CONFIG
mapaSubjektuView = mapaSubjektuView.replace(/const ENTITY_CONFIG: Record<\s*EntityType,[\s\S]*?> = {[\s\S]*?PORADNA_CHARITA: {[\s\S]*?},\n};/g, '');

// Fix 'Všechny subjekty' icon
mapaSubjektuView = mapaSubjektuView.replace(
  /<Building2 className="w-4 h-4 text-slate-500" \/>/g,
  `<MapPin className="w-4 h-4 text-slate-500" />`
);
mapaSubjektuView = mapaSubjektuView.replace(
  /<Building2 className="w-5 h-5 text-indigo-400" \/>\n\s*<span className="font-bold">Všechny subjekty<\/span>/g,
  `<MapPin className="w-5 h-5 text-indigo-400" />
                          <span className="font-bold">Všechny subjekty</span>`
);
mapaSubjektuView = mapaSubjektuView.replace(
  /formatEntityType\(detailSubjekt.type\)/g,
  "(detailSubjekt.type in ENTITY_CONFIG ? ENTITY_CONFIG[detailSubjekt.type as EntityType].badgeText : String(detailSubjekt.type))"
);
mapaSubjektuView = mapaSubjektuView.replace(
  /formatEntityType\(s.type\)/g,
  "(s.type in ENTITY_CONFIG ? ENTITY_CONFIG[s.type as EntityType].badgeText : String(s.type))"
);


fs.writeFileSync(mapaSubjektuViewPath, mapaSubjektuView);
console.log('Modified MapaSubjektuView.tsx');


// --- 4. Modify SubjektManager.tsx ---
const subjektManagerPath = path.join('src', 'components', 'admin', 'SubjektManager.tsx');
let subjektManager = fs.readFileSync(subjektManagerPath, 'utf8');

if (!subjektManager.includes('ENTITY_CONFIG } from \'../../config/entityConfig\'')) {
  subjektManager = subjektManager.replace(
    /import { Subjekt, EntityType } from '\.\.\/\.\.\/types';/,
    "import { Subjekt, EntityType } from '../../types';\nimport { ENTITY_CONFIG } from '../../config/entityConfig';"
  );
}

subjektManager = subjektManager.replace(
  /<option value="SOUD">Soudy<\/option>\n\s*<option value="OSPOD">OSPOD<\/option>\n\s*<option value="ZNALEC">Znalci<\/option>\n\s*<option value="ADVOKAT">Advokáti<\/option>\n\s*<option value="PORADNA_CHARITA">Poradny<\/option>/g,
  `{(Object.keys(ENTITY_CONFIG) as EntityType[]).map(key => (
                  <option key={key} value={key}>{ENTITY_CONFIG[key].label}</option>
                ))}`
);

subjektManager = subjektManager.replace(
  /<option value="SOUD">Soud<\/option>\n\s*<option value="OSPOD">OSPOD<\/option>\n\s*<option value="ZNALEC">Soudní znalec<\/option>\n\s*<option value="ADVOKAT">Advokát<\/option>\n\s*<option value="PORADNA_CHARITA">Poradna \/ Mediace<\/option>/g,
  `{(Object.keys(ENTITY_CONFIG) as EntityType[]).map(key => (
                    <option key={key} value={key}>{ENTITY_CONFIG[key].badgeText}</option>
                  ))}`
);

fs.writeFileSync(subjektManagerPath, subjektManager);
console.log('Modified SubjektManager.tsx');

