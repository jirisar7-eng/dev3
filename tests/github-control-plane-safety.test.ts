import { describe, it, expect, vi } from 'vitest';
import { GithubPublisherService, redactToken } from '../src/services/githubPublisherService';
import { AuditService } from '../src/services/auditService';
import * as child_process from 'child_process';

// Mock child_process execFile to control Git behavior
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

describe('GitHub Publisher Service - Copilot Safety', () => {
  describe('validateCopilotBranch', () => {
    it('povolí validní copilot branch name', () => {
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/test-123')).not.toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/fix_auth-bug')).not.toThrow();
    });

    it('zamítne chybějící copilot prefix', () => {
      expect(() => GithubPublisherService.validateCopilotBranch('main')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('master')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('feat/test')).toThrow();
    });

    it('zamítne zakázané znaky a shell operátory', () => {
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/test;rm-rf')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/test&&echo')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/test|grep')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/test backtick')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/../main')).toThrow();
      expect(() => GithubPublisherService.validateCopilotBranch('copilot/$()')).toThrow();
    });
  });

  describe('Token Redaction', () => {
    it('nahradí raw token v log zprávě bez ohledu na strukturu', () => {
      const secret = 'ghp_SuperSecretToken1234567890';
      const errorMessage = `Command failed: git fetch https://${secret}@github.com/repo.git main`;
      const redacted = redactToken(errorMessage, secret);
      expect(redacted).not.toContain(secret);
      expect(redacted).toContain('***REDACTED***');
    });

    it('rediguje generický https://[token]@github.com', () => {
      const errorMessage = `Command failed: git fetch https://ghp_AnyOtherToken@github.com/repo.git main`;
      const redacted = redactToken(errorMessage);
      expect(redacted).not.toContain('ghp_AnyOtherToken');
      expect(redacted).toContain('***REDACTED***');
    });
  });

  describe('Pull Request Base & Branch Creation', () => {
    it('createPullRequest vždy vynucuje base=main', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ number: 42, html_url: 'url' })
      });
      global.fetch = fetchMock;

      vi.spyOn(GithubPublisherService as any, 'getRepo').mockReturnValue('owner/repo');
      vi.spyOn(GithubPublisherService as any, 'getToken').mockReturnValue('fake-token');
      const mockAudit = vi.spyOn(AuditService, 'recordLog');
      mockAudit.mockResolvedValue({ id: '1' } as any);

      await GithubPublisherService.createPullRequest(
        { id: '1', role: 'ADMIN', email: 'test@t.cz', name: 'T', passkeyId: null } as any,
        'copilot/test-branch',
        'Title',
        'Body'
      );

      expect(fetchMock).toHaveBeenCalled();
      const fetchArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(fetchArgs[1].body);
      expect(body.base).toBe('main');
      expect(body.head).toBe('copilot/test-branch');
    });
  });
});
