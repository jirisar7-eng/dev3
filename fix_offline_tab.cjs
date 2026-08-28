const fs = require('fs');

const tabPath = 'src/components/case/OfflineVaultSyncTab.tsx';
let tabCode = fs.readFileSync(tabPath, 'utf8');

// Remove the Local Offline Draft Enqueue Form completely
tabCode = tabCode.replace(/\{\/\* Local Offline Draft Enqueue Form \*\/\}.*<\/form>\s*<\/div>/s, '');
// Also remove the imports and state used only for it
tabCode = tabCode.replace(/const \[testDraftTitle, setTestDraftTitle\] = useState\(''\);\s*/, '');
tabCode = tabCode.replace(/const \[testDraftNotes, setTestDraftNotes\] = useState\(''\);\s*/, '');
tabCode = tabCode.replace(/const \[isEnqueuing, setIsEnqueuing\] = useState\(false\);\s*/, '');

tabCode = tabCode.replace(/const handleAddTestDraft = async.*?};\s*\/\//s, '//');
tabCode = tabCode.replace(/import \{.*Plus,.*\} from 'lucide-react';/, (match) => match.replace('Plus,', ''));

// Save the changes
fs.writeFileSync(tabPath, tabCode);
console.log('Fixed OfflineVaultSyncTab.tsx');
