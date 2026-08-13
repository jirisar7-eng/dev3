const fs = require('fs');
let content = fs.readFileSync('src/components/private/UserProfileView.tsx', 'utf-8');

if (!content.includes('2FA není aktivní')) {
  content = content.replace(
    "{!is2faEnabled && mfaSetupStep === 0 && (\\s+<div className=\"space-y-4\">)",
    "{!is2faEnabled && mfaSetupStep === 0 && (\n            <div className=\"space-y-4\">\n              <div className=\"p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 font-bold flex items-center gap-2\">\n                <AlertTriangle className=\"w-4 h-4\" />\n                2FA není aktivní\n              </div>"
  );
  // Manual string replace because regex with newlines is tricky in JS sometimes
  const target = "{!is2faEnabled && mfaSetupStep === 0 && (\n            <div className=\"space-y-4\">";
  const replacement = "{!is2faEnabled && mfaSetupStep === 0 && (\n            <div className=\"space-y-4\">\n              <div className=\"p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 font-bold flex items-center gap-2\">\n                <AlertTriangle className=\"w-4 h-4\" />\n                2FA není aktivní\n              </div>";
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/private/UserProfileView.tsx', content);
}
