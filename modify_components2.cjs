const fs = require('fs');
const path = require('path');

// --- 1. Modify SubjektyMap.tsx ---
const subjektyMapPath = path.join('src', 'components', 'public', 'SubjektyMap.tsx');
let subjektyMap = fs.readFileSync(subjektyMapPath, 'utf8');

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

subjektyMap = subjektyMap.replace(/const createCustomPinIcon = [\s\S]*?popupAnchor: \[0, -\(size \/ 2 \+ 6\)\],\n  }\);\n};/, createCustomPinIconReplacement);

fs.writeFileSync(subjektyMapPath, subjektyMap);
console.log('Modified SubjektyMap.tsx');
