const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/admin/qa/QADashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `  const handleRunAIAnalysis = async () => {
    setRunningAI(true);
    setAiMessage(null);
    try {
      const res = await apiFetch('/api/admin/qa/run-ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('tatovacesta_auth_token')}\`
        },
        body: JSON.stringify({ provider: 'auto' })
      });
      const json = await res.json();
      if (json.success && json.report) {
        setAiMessage(\`AI Analýza dokončena! Provider: \${json.report.providerUsed || 'Grok'}\`);
        await fetchRuns();
        await fetchAiStats();
      } else {
        setAiMessage(\`AI Analýza: \${json.error || 'Správa byla vrácena bez výslovného selhání.'}\`);
      }
    } catch (e: any) {
      setAiMessage(\`Chyba AI Analýzy: \${e.message}\`);
    } finally {
      setRunningAI(false);
    }
  };`;

const replacementStr = `  const handleRunAIAnalysis = async () => {
    setRunningAI(true);
    setAiMessage(null);
    try {
      const response = await dispatchAgent({
        agentId: 'DATA_ANALYST',
        capabilityId: 'report.generate'
      });
      
      if (response.decision === 'SUCCESS') {
        const data = response.data as any;
        setAiMessage(\`AI Analýza dokončena! Provider: \${data?.providerUsed || 'Agent Orchestrator'}\`);
        await fetchRuns();
        await fetchAiStats();
      } else if (response.decision === 'REQUIRE_HUMAN_APPROVAL') {
        setAiMessage(\`Vyžadováno schválení člověkem. Lístek: \${response.ticketId || 'N/A'}\`);
      } else if (response.decision === 'DENY') {
        setAiMessage(\`Zamítnuto: \${response.error || 'Přístup odepřen.'}\`);
      } else {
        setAiMessage(\`AI Analýza chyba: \${response.error || 'Neznámá chyba'}\`);
      }
    } catch (e: any) {
      setAiMessage(\`Chyba AI Analýzy: \${e.message}\`);
    } finally {
      setRunningAI(false);
    }
  };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("SUCCESS");
} else {
  console.log("TARGET STRING NOT FOUND");
}
