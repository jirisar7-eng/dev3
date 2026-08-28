const fs = require('fs');
let code = fs.readFileSync('tests/pwa-offline-sync-ui-phase22.test.ts', 'utf8');
const idx = code.indexOf("  it('9.");
if (idx > -1) {
  const before = code.substring(0, idx);
  const after = code.substring(idx);
  // find the last '});' in before
  const lastIndex = before.lastIndexOf('});');
  if (lastIndex > -1) {
    code = before.substring(0, lastIndex) + after;
  }
}
// add the missing closing braces at the end
code += "\n});\n";
fs.writeFileSync('tests/pwa-offline-sync-ui-phase22.test.ts', code);
