import { describe, it, expect } from 'vitest';
import { UNIFIED_AGENT_REGISTRY, AgentRegistry } from '../src/services/agentRegistry';
import { CAPABILITY_CATALOG } from '../src/services/agentCapabilityCatalog';
import fs from 'fs';
import path from 'path';

describe('Phase 1B-0 — Experimental Agent Documentation Contract', () => {
  const MANDATORY_AGENTS = [
    'BUILD_WITH_AGENTS',
    'ANTIGRAVITY_PREVIEW',
    'AI_TALK_RADIO',
    'CUSTOMER_SUPPORT',
    'DATA_ANALYST',
    'DOCUMENT_PROCESSOR',
    'REPO_MAINTAINER',
  ];

  it('1. All 7 mandatory agents are registered in UNIFIED_AGENT_REGISTRY', () => {
    MANDATORY_AGENTS.forEach(agentId => {
      const entry = AgentRegistry.getAgent(agentId);
      expect(entry).toBeDefined();
      expect(entry?.id).toBe(agentId);
    });
  });

  it('2. Documentation files exist for all 7 mandatory agents in docs/agents/', () => {
    const docMap: Record<string, string> = {
      BUILD_WITH_AGENTS: 'build-with-agents.md',
      ANTIGRAVITY_PREVIEW: 'antigravity-preview.md',
      AI_TALK_RADIO: 'ai-talk-radio.md',
      CUSTOMER_SUPPORT: 'customer-support.md',
      DATA_ANALYST: 'data-analyst.md',
      DOCUMENT_PROCESSOR: 'document-processor.md',
      REPO_MAINTAINER: 'repo-maintainer.md',
    };

    MANDATORY_AGENTS.forEach(agentId => {
      const fileName = docMap[agentId];
      const filePath = path.join(process.cwd(), 'docs', 'agents', fileName);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(500);
      expect(content).toContain(`ID:** \`${agentId}\``);
      expect(content).toContain('User Guide');
      expect(content).toContain('Technical Guide');
      expect(content).toContain('Matrix implementačního stavu');
    });
  });

  it('3. INDEX.md catalog exists and lists all 7 agents', () => {
    const indexPath = path.join(process.cwd(), 'docs', 'agents', 'INDEX.md');
    expect(fs.existsSync(indexPath)).toBe(true);

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    MANDATORY_AGENTS.forEach(agentId => {
      expect(indexContent).toContain(agentId);
    });
  });

  it('4. Status accuracy: PROPOSED agents must be disabled or marked appropriately', () => {
    const talkRadio = AgentRegistry.getAgent('AI_TALK_RADIO');
    expect(talkRadio?.status).toBe('PROPOSED');
    expect(talkRadio?.enabled).toBe(false);

    const customerSupport = AgentRegistry.getAgent('CUSTOMER_SUPPORT');
    expect(customerSupport?.status).toBe('PROPOSED');
    expect(customerSupport?.enabled).toBe(false);
  });

  it('5. Declarative capabilities in catalog match agent registry definitions', () => {
    MANDATORY_AGENTS.forEach(agentId => {
      const agent = AgentRegistry.getAgent(agentId);
      agent?.allowedScopes.forEach(scope => {
        const cap = CAPABILITY_CATALOG[scope];
        if (cap) {
          expect(cap.allowedForAgents).toContain(agentId);
        }
      });
    });
  });
});
