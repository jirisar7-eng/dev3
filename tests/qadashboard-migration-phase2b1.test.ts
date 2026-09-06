import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 2B-1: QADashboard Migration', () => {
  const filePath = path.resolve(__dirname, '../src/components/admin/qa/QADashboard.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  it('1. QADashboard používá agentDispatchClient', () => {
    expect(content).toContain("import { dispatchAgent } from '../../../services/agent/agentDispatchClient'");
    expect(content).toContain("const response = await dispatchAgent({");
  });

  it('2. Používá DATA_ANALYST', () => {
    expect(content).toContain("agentId: 'DATA_ANALYST'");
  });

  it('3. Používá report.generate', () => {
    expect(content).toContain("capabilityId: 'report.generate'");
  });

  it('4. Neposílá provider', () => {
    expect(content).not.toMatch(/provider:\s*['"]auto['"]/);
  });

  it('5. Neposílá model', () => {
    const handleBlock = content.split("const handleRunAIAnalysis = async () => {")[1].split("const handleTabChange")[0];
    expect(handleBlock).not.toContain("model:");
  });

  it('6. Neposílá systemPrompt', () => {
    const handleBlock = content.split("const handleRunAIAnalysis = async () => {")[1].split("const handleTabChange")[0];
    expect(handleBlock).not.toContain("systemPrompt:");
  });

  it('7. Neposílá user/role/permissions', () => {
    const handleBlock = content.split("const handleRunAIAnalysis = async () => {")[1].split("const handleTabChange")[0];
    expect(handleBlock).not.toContain("user:");
    expect(handleBlock).not.toContain("role:");
    expect(handleBlock).not.toContain("permissions:");
  });

  it('8. SUCCESS response', () => {
    expect(content).toContain("if (response.decision === 'SUCCESS') {");
  });

  it('9. DENY response', () => {
    expect(content).toContain("else if (response.decision === 'DENY') {");
    expect(content).toContain("setAiMessage(`Zamítnuto:");
  });

  it('10. REQUIRE_HUMAN_APPROVAL / 202', () => {
    expect(content).toContain("else if (response.decision === 'REQUIRE_HUMAN_APPROVAL') {");
    expect(content).toContain("Vyžadováno schválení člověkem");
  });

  it('11. ERROR response', () => {
    expect(content).toContain("else {");
    expect(content).toContain("setAiMessage(`AI Analýza chyba:");
  });

  it('12. Loading state', () => {
    const handleBlock = content.split("const handleRunAIAnalysis = async () => {")[1].split("const handleTabChange")[0];
    expect(handleBlock).toContain("setRunningAI(true);");
    expect(handleBlock).toContain("setRunningAI(false);");
  });

  it('13. Success refresh', () => {
    const successBlock = content.split("if (response.decision === 'SUCCESS') {")[1].split("else if")[0];
    expect(successBlock).toContain("await fetchRuns();");
    expect(successBlock).toContain("await fetchAiStats();");
  });

  it('14. Approval neprovede success refresh', () => {
    const approvalBlock = content.split("else if (response.decision === 'REQUIRE_HUMAN_APPROVAL') {")[1].split("else if")[0];
    expect(approvalBlock).not.toContain("await fetchRuns();");
  });

  it('15. Legacy endpoint zůstává nezměněn', () => {
    const routePath = path.resolve(__dirname, '../src/routes/admin/qa.ts');
    if (fs.existsSync(routePath)) {
        const routeContent = fs.readFileSync(routePath, 'utf8');
        expect(routeContent).toContain('/run-ai-analysis');
    }
  });

  it('18. Auth/RBAC spoofing není možný přes frontend payload', () => {
    const handleBlock = content.split("const handleRunAIAnalysis = async () => {")[1].split("const handleTabChange")[0];
    expect(handleBlock).not.toContain("localStorage.getItem('tatovacesta_auth_token')");
    expect(handleBlock).not.toContain("Authorization:");
  });
});
