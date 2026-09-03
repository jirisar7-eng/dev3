import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GithubPublisherService } from '../src/services/githubPublisherService';
import { execFile } from 'child_process';

// Mock dependencies
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

describe('GitHub Publisher Service - Verification Gate V2', () => {
  let fetchMock: any;
  let execFileMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    execFileMock = vi.mocked(execFile);
    execFileMock.mockImplementation((cmd: string, args: string[], opts: any, cb: any) => {
      if (cb) cb(null, { stdout: '', stderr: '' });
      return { stdout: 'mock_sha\n' };
    });
    vi.spyOn(GithubPublisherService as any, 'getToken').mockReturnValue('fake-token');
    vi.spyOn(GithubPublisherService as any, 'getRepo').mockReturnValue('test-owner/test-repo');
  });

  it('vrátí FAILED status pokud není k dispozici GITHUB_TOKEN', async () => {
    vi.spyOn(GithubPublisherService as any, 'getToken').mockReturnValue('');
    const verifyMethod = (GithubPublisherService as any).verifyRemoteCommitViaApi;
    const result = await verifyMethod('owner/repo', 'main', 'localsha123', [], '');
    
    expect(result.verificationStatus).toBe('FAILED');
    expect(result.reason).toBe('GITHUB_TOKEN_UNAVAILABLE');
    expect(result.verificationMethod).toBe('GITHUB_API_TOKEN');
  });

  it('vrátí VERIFIED status pokud vzdálený commit existuje, odpovídají soubory a je v remote HEAD', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/branches/')) {
        return { ok: true, json: async () => ({ commit: { sha: 'localsha123' } }) };
      }
      if (url.includes('/commits/')) {
        return { ok: true, json: async () => ({ files: [{ filename: 'src/test.ts' }] }) };
      }
      return { ok: false };
    });

    const verifyMethod = (GithubPublisherService as any).verifyRemoteCommitViaApi;
    const result = await verifyMethod('owner/repo', 'main', 'localsha123', ['src/test.ts'], 'token123');

    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.remoteHeadSha).toBe('localsha123');
    expect(result.verifiedFiles).toContain('src/test.ts');
  });

  it('vrátí FAILED status pokud na vzdáleném serveru chybí očekávané soubory', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/branches/')) {
        return { ok: true, json: async () => ({ commit: { sha: 'localsha123' } }) };
      }
      if (url.includes('/commits/')) {
        return { ok: true, json: async () => ({ files: [{ filename: 'src/other.ts' }] }) }; // Chybí src/test.ts
      }
      return { ok: false };
    });

    const verifyMethod = (GithubPublisherService as any).verifyRemoteCommitViaApi;
    const result = await verifyMethod('owner/repo', 'main', 'localsha123', ['src/test.ts'], 'token123');

    expect(result.verificationStatus).toBe('FAILED');
    expect(result.reason).toContain('Missing expected files');
  });

  it('ověří commit z historie pokud se liší od remote HEAD', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/branches/')) {
        return { ok: true, json: async () => ({ commit: { sha: 'new_sha_999' } }) }; // Někdo jiný pushnul dál
      }
      if (url.includes('/commits?sha=')) { // List history
        return { ok: true, json: async () => ([{ sha: 'new_sha_999' }, { sha: 'localsha123' }]) };
      }
      if (url.includes('/commits/')) {
        return { ok: true, json: async () => ({ files: [{ filename: 'src/test.ts' }] }) };
      }
      return { ok: false };
    });

    const verifyMethod = (GithubPublisherService as any).verifyRemoteCommitViaApi;
    const result = await verifyMethod('owner/repo', 'main', 'localsha123', ['src/test.ts'], 'token123');

    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.remoteHeadSha).toBe('new_sha_999');
  });

  it('vrátí FAILED pokud commit není nalezen na GitHubu vůbec', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/branches/')) {
        return { ok: true, json: async () => ({ commit: { sha: 'new_sha_999' } }) };
      }
      if (url.includes('/commits?sha=')) { // List history
        return { ok: true, json: async () => ([{ sha: 'new_sha_999' }, { sha: 'some_other_sha' }]) };
      }
      if (url.includes('/commits/')) {
        return { ok: false, status: 404, statusText: 'Not Found' };
      }
      return { ok: false };
    });

    const verifyMethod = (GithubPublisherService as any).verifyRemoteCommitViaApi;
    const result = await verifyMethod('owner/repo', 'main', 'localsha123', ['src/test.ts'], 'token123');

    expect(result.verificationStatus).toBe('FAILED');
    expect(result.reason).toContain('Commit verification failed');
  });
});
