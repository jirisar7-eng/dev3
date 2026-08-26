import dotenv from "dotenv";
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { User } from '../types';
import { AuditService } from './auditService';

const execFileAsync = promisify(execFile);

export interface GitFileChange {
  status: string; // e.g. "M", "A", "D", "??"
  statusDescription: string;
  file: string;
  isSecretRisk: boolean;
}

export interface GitStatusResult {
  repository: string;
  branch: string;
  hasToken: boolean;
  clean: boolean;
  fileCount: number;
  files: GitFileChange[];
  secretRiskDetected: boolean;
  forbiddenFiles: string[];
  currentBranch: string;
  lastCommit?: string;
}

export interface PublishResult {
  success: boolean;
  commitMessage: string;
  changedFilesCount: number;
  timestamp: string;
  auditId?: string;
  message: string;
}

const FORBIDDEN_SECRET_PATTERNS = [
  /^\.env$/i,
  /^\.env\.(?!example$)[a-z0-9_.-]+$/i, // Matches .env.local, .env.production, etc. but allows .env.example
  /^secrets(\/|$)/i,
  /.*\.pem$/i,
  /.*\.key$/i,
  /.*id_rsa/i,
  /^logs\/.*\.log$/i,
];

function isForbiddenFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').trim();
  return FORBIDDEN_SECRET_PATTERNS.some((pattern) => pattern.test(normalized));
}

function redactToken(input: string, token?: string): string {
  if (!input) return '';
  let result = input;
  if (token && token.trim().length > 0) {
    result = result.replace(new RegExp(token, 'g'), '***GITHUB_TOKEN_REDACTED***');
  }
  // Generic URL token redaction regex: https://[token]@github.com
  result = result.replace(/https:\/\/[^@]+@github\.com/gi, 'https://***REDACTED***@github.com');
  return result;
}

function describeGitStatus(code: string): string {
  const trimmed = code.trim();
  if (trimmed === 'M') return 'Změněno (Modified)';
  if (trimmed === 'A') return 'Přidáno (Added)';
  if (trimmed === 'D') return 'Smazáno (Deleted)';
  if (trimmed === 'R') return 'Přejmenováno (Renamed)';
  if (trimmed === 'C') return 'Zkopírováno (Copied)';
  if (trimmed === '??') return 'Nový nesledovaný soubor (Untracked)';
  return 'Změněno';
}

export class GithubPublisherService {
  private static getRepo(): string {
    return process.env.GITHUB_REPOSITORY || 'jirisar7-eng/dev3';
  }

  private static getBranch(): string {
    return process.env.GITHUB_BRANCH || 'main';
  }

  private static getToken(): string | undefined {
    // Dynamické načtení z .env pro jistotu aktuálnosti
    dotenv.config({ override: true });
    const token = process.env.GITHUB_TOKEN;
    return token && token.trim().length > 0 ? token.trim() : undefined;
  }

  private static resolveWorkDir(): string {
    const explicitPath = '/var/www/tatovacesta_dev3';
    if (fs.existsSync(explicitPath)) {
      return explicitPath;
    }
    return process.cwd();
  }

  private static async ensureGitRepo(workDir: string): Promise<void> {
    const token = this.getToken();
    let isRepo = false;
    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: workDir });
      isRepo = stdout.trim() === 'true';
    } catch {
      isRepo = false;
    }

    // AUTO-HEALING mechanism
    if (isRepo) {
      try {
        // Zkusíme, zda git funguje (často padne na index corruption)
        await execFileAsync('git', ['status'], { cwd: workDir });
      } catch (err: any) {
        const errText = (err.stderr || err.message || '').toLowerCase();
        if (errText.includes('corrupt') || errText.includes('fatal:') || errText.includes('error:')) {
          console.warn('[GithubPublisherService] Detekováno poškození Git indexu. Pokus o auto-healing...');
          try {
            await execFileAsync('rm', ['-f', '.git/index'], { cwd: workDir });
            await execFileAsync('git', ['reset'], { cwd: workDir });
            await execFileAsync('git', ['status'], { cwd: workDir });
            console.log('[GithubPublisherService] Git index byl úspěšně opraven (auto-healed).');
          } catch (healErr) {
            console.warn('[GithubPublisherService] Oprava indexu selhala. Přistupuji k úplné re-inicializaci repozitáře...', healErr);
            await execFileAsync('rm', ['-rf', '.git'], { cwd: workDir });
            isRepo = false; // Vynutí novou inicializaci v bloku níže
          }
        }
      }
    }

    console.log(`[GithubPublisherService] Diagnostics - WorkDir: '${workDir}', Git Repository Detected: ${isRepo}`);

    if (!isRepo) {
      try {
        await execFileAsync('git', ['init'], { cwd: workDir });
        await execFileAsync('git', ['config', 'user.name', 'System Admin Publisher'], { cwd: workDir });
        await execFileAsync('git', ['config', 'user.email', 'admin@tatovacesta.cz'], { cwd: workDir });
        await execFileAsync('git', ['checkout', '-B', 'main'], { cwd: workDir });
        console.log(`[GithubPublisherService] Initialized new Git repository in '${workDir}'.`);
      } catch (err: any) {
        console.error('[GithubPublisherService] Failed to initialize git repo in workDir:', redactToken(err.message, token));
      }
    }

    try {
      await execFileAsync('git', ['config', 'user.name', 'System Admin Publisher'], { cwd: workDir });
      await execFileAsync('git', ['config', 'user.email', 'admin@tatovacesta.cz'], { cwd: workDir });
    } catch {
      // non-fatal
    }
  }

  static async getStatus(): Promise<GitStatusResult> {
    const workDir = this.resolveWorkDir();
    await this.ensureGitRepo(workDir);

    const repo = this.getRepo();
    const branch = this.getBranch();
    const token = this.getToken();

    let statusOutput = '';
    let currentBranch = 'main';
    let lastCommit = '';

    try {
      const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd: workDir });
      statusOutput = stdout;
      console.log(`[GithubPublisherService] Diagnostics - git status exit code: 0, workDir: '${workDir}'`);
    } catch (err: any) {
      const safeStderr = redactToken(err.stderr || err.message || '', token);
      console.error(`[GithubPublisherService] Diagnostics - git status error (exit code: ${err.code || 1}), workDir: '${workDir}', stderr: ${safeStderr}`);
    }

    try {
      const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workDir });
      currentBranch = branchOut.trim() || branch;
    } catch {
      currentBranch = branch;
    }

    try {
      const { stdout: commitOut } = await execFileAsync('git', ['log', '-1', '--oneline'], { cwd: workDir });
      lastCommit = commitOut.trim();
    } catch {
      lastCommit = 'Žádné předchozí commity nebyly nalezeny.';
    }

    const lines = statusOutput.split('\n').filter((l) => l.trim().length > 0);
    const files: GitFileChange[] = [];
    const forbiddenFiles: string[] = [];

    for (const line of lines) {
      const statusCode = line.substring(0, 2).trim() || line.substring(0, 2);
      const filePath = line.substring(3).trim();
      const isRisk = isForbiddenFile(filePath);

      if (isRisk) {
        forbiddenFiles.push(filePath);
      }

      files.push({
        status: statusCode,
        statusDescription: describeGitStatus(statusCode),
        file: filePath,
        isSecretRisk: isRisk,
      });
    }

    const secretRiskDetected = forbiddenFiles.length > 0;

    return {
      repository: repo,
      branch,
      hasToken: !!token,
      clean: files.length === 0,
      fileCount: files.length,
      files,
      secretRiskDetected,
      forbiddenFiles,
      currentBranch,
      lastCommit,
    };
  }

  static async publishToGithub(
    user: User,
    commitMessage: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<PublishResult> {
    const workDir = this.resolveWorkDir();

    // 1. RBAC Security check
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      await AuditService.recordLog(
        'GITHUB_PUSH_DENIED',
        'SYSTEM',
        `Neoprávněný pokus o GitHub Push uživatelem ${user?.email || 'Neznámý'} s rolí ${user?.role || 'Neznámá'}.`,
        user,
        ipAddress
      );
      throw new Error('PŘÍSTUP ODEPŘEN: Pouze administrátoři mohou publikovat na GitHub.');
    }

    // 2. Validate commit message
    const cleanMsg = (commitMessage || '').trim();
    if (!cleanMsg) {
      throw new Error('Zadejte prosím zprávu k commitu (Commit Message).');
    }
    if (cleanMsg.length > 500) {
      throw new Error('Zpráva k commitu je příliš dlouhá (maximálně 500 znaků).');
    }

    // 3. Check GITHUB_TOKEN
    const token = this.getToken();
    if (!token) {
      await AuditService.recordLog(
        'GITHUB_PUSH_FAILED',
        'SYSTEM',
        `Pokus o GitHub push selhal: GITHUB_TOKEN není nakonfigurován v prostředí serveru.`,
        user,
        ipAddress
      );
      throw new Error('GITHUB_TOKEN není nastaven v prostředí serveru. Nastavte proměnnou GITHUB_TOKEN.');
    }

    const repo = this.getRepo();
    const branch = this.getBranch();

    // 4. Check status & secret risks
    const statusResult = await this.getStatus();

    if (statusResult.secretRiskDetected) {
      const forbiddenList = statusResult.forbiddenFiles.join(', ');
      await AuditService.recordLog(
        'GITHUB_PUSH_BLOCKED_SECURITY',
        'SYSTEM',
        `PUSH ZASTAVEN! Riziko úniku tajných údajů. Detekovány zakázané soubory: ${forbiddenList}`,
        user,
        ipAddress
      );
      throw new Error(
        `BEZPEČNOSTNÍ ZASTAVENÍ PUSH: V pracovním stromu byly detekovány soubory s citlivými údaji (${forbiddenList}). Odstraňte tyto soubory nebo je přidejte do .gitignore.`
      );
    }

    if (statusResult.clean) {
      throw new Error('Pracovní adresář je čistý (žádné neuložené změny k publikování).');
    }

    try {
      // Step A: Stage all safe files
      await execFileAsync('git', ['add', '-A'], { cwd: workDir });

      // Step B: Create commit with safe parameter array
      await execFileAsync('git', ['commit', '-m', cleanMsg], { cwd: workDir });

      const remoteUrl = `https://${token}@github.com/${repo}.git`;

      // Step C: Fetch remote to check divergence
      try {
        await execFileAsync('git', ['fetch', remoteUrl, branch], { cwd: workDir });
        const { stdout: revCount } = await execFileAsync(
          'git',
          ['rev-list', '--left-right', '--count', `HEAD...FETCH_HEAD`],
          { cwd: workDir }
        );
        const parts = revCount.trim().split(/\s+/);
        const behindCount = parseInt(parts[1] || '0', 10);

        if (behindCount > 0) {
          throw new Error(
            'GitHub obsahuje změny, které lokální verze nemá. Použijte Force Push, pokud chcete vzdálený repository přepsat aktuálním lokálním stavem.'
          );
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && fetchErr.message.includes('GitHub obsahuje změny')) {
          throw fetchErr;
        }
        // If fetch fails (e.g. initial empty remote repo), proceed to push attempt
      }

      // Step D: Push to GitHub using server-side auth URL in command argument
      await execFileAsync('git', ['push', remoteUrl, `HEAD:${branch}`], { cwd: workDir });

      const timestamp = new Date().toISOString();
      const changedCount = statusResult.fileCount;

      // Step E: Audit log success (NEVER including the token)
      const auditLog = await AuditService.recordLog(
        'GITHUB_PUSH_SUCCESS',
        'SYSTEM',
        `Úspěšný GitHub Push do ${repo}:${branch}. Commit: "${cleanMsg}". Počet změněných souborů: ${changedCount}. WorkDir: ${workDir}`,
        user,
        ipAddress
      );

      return {
        success: true,
        commitMessage: cleanMsg,
        changedFilesCount: changedCount,
        timestamp,
        auditId: auditLog.id,
        message: `Projekt byl úspěšně publikován na GitHub (repo: ${repo}, branch: ${branch}).`,
      };
    } catch (err: any) {
      const rawError = err.stderr || err.stdout || err.message || 'Neznámá chyba při spouštění Git příkazů.';
      const safeErrorMsg = redactToken(rawError, token);

      console.error('[GithubPublisherService] Push failed:', safeErrorMsg);

      let userFacingError = safeErrorMsg;
      if (
        safeErrorMsg.includes('rejected') ||
        safeErrorMsg.includes('fetch first') ||
        safeErrorMsg.includes('non-fast-forward') ||
        safeErrorMsg.includes('behind') ||
        safeErrorMsg.includes('GitHub obsahuje změny')
      ) {
        userFacingError =
          'GitHub obsahuje změny, které lokální verze nemá. Použijte Force Push, pokud chcete vzdálený repository přepsat aktuálním lokálním stavem.';
      }

      // Audit failure log (safe message)
      await AuditService.recordLog(
        'GITHUB_PUSH_FAILED',
        'SYSTEM',
        `Pokus o GitHub Push selhal: ${userFacingError.substring(0, 300)}`,
        user,
        ipAddress
      );

      throw new Error(userFacingError);
    }
  }

  static async forcePushToGithub(
    user: User,
    commitMessage: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<PublishResult> {
    const workDir = this.resolveWorkDir();

    // 1. RBAC & Permission check
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      await AuditService.recordLog(
        'GITHUB_FORCE_PUSH_DENIED',
        'SYSTEM',
        `Neoprávněný pokus o FORCE PUSH uživatelem ${user?.email || 'Neznámý'} s rolí ${user?.role || 'Neznámá'}.`,
        user,
        ipAddress
      );
      throw new Error('PŘÍSTUP ODEPŘEN: Pouze administrátoři mohou provést FORCE PUSH.');
    }

    const repo = this.getRepo();
    const branch = this.getBranch();

    // Enforce fixed repo and branch restrictions for DEV3
    if (branch !== 'main') {
      throw new Error(`FORCE PUSH je povolen výhradně pro cílovou větev 'main'. Zadaná větev: '${branch}'.`);
    }

    if (!repo.toLowerCase().includes('jirisar7-eng/dev3')) {
      throw new Error(`FORCE PUSH je povolen výhradně pro repozitář 'jirisar7-eng/dev3'. Zadaný repozitář: '${repo}'.`);
    }

    const token = this.getToken();
    if (!token) {
      await AuditService.recordLog(
        'GITHUB_FORCE_PUSH_FAILED',
        'SYSTEM',
        `Pokus o FORCE PUSH selhal: GITHUB_TOKEN není nakonfigurován v prostředí serveru.`,
        user,
        ipAddress
      );
      throw new Error('GITHUB_TOKEN není nastaven v prostředí serveru.');
    }

    // 2. Security check on working directory & tracked files
    const statusResult = await this.getStatus();

    if (statusResult.secretRiskDetected) {
      const forbiddenList = statusResult.forbiddenFiles.join(', ');
      await AuditService.recordLog(
        'GITHUB_FORCE_PUSH_BLOCKED_SECURITY',
        'SYSTEM',
        `FORCE PUSH ZASTAVEN! Riziko úniku tajných údajů v pracovním stromu: ${forbiddenList}`,
        user,
        ipAddress
      );
      throw new Error(
        `BEZPEČNOSTNÍ ZASTAVENÍ FORCE PUSH: Detekovány zakázané soubory s citlivými údaji (${forbiddenList}). Odstraňte je nebo přidejte do .gitignore.`
      );
    }

    // Additional security check: verify Git index (tracked files) for secret files or token exposure
    try {
      const { stdout: trackedFiles } = await execFileAsync('git', ['ls-files'], { cwd: workDir });
      const trackedList = trackedFiles.split('\n').map((f) => f.trim()).filter(Boolean);
      const trackedForbidden = trackedList.filter((f) => isForbiddenFile(f));
      if (trackedForbidden.length > 0) {
        throw new Error(`V Git indexu jsou již sledovány zakázané soubory s citlivými daty: ${trackedForbidden.join(', ')}`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Git indexu')) throw err;
      // non-fatal if ls-files has issue
    }

    const cleanMsg = (commitMessage || '').trim();
    const remoteUrl = `https://${token}@github.com/${repo}.git`;

    try {
      // Step A: Fetch current remote state first
      try {
        await execFileAsync('git', ['fetch', remoteUrl, branch], { cwd: workDir });
      } catch (fetchErr) {
        // Non-fatal if remote repo is fresh
      }

      // Step B: Stage and commit local changes if any exist
      if (!statusResult.clean) {
        if (!cleanMsg) {
          throw new Error('Zadejte prosím zprávu k commitu (Commit Message) pro neuložené změny.');
        }
        await execFileAsync('git', ['add', '-A'], { cwd: workDir });
        await execFileAsync('git', ['commit', '-m', cleanMsg], { cwd: workDir });
      }

      // Step C: Execute git push --force origin HEAD:main
      await execFileAsync('git', ['push', '--force', remoteUrl, `HEAD:${branch}`], { cwd: workDir });

      const timestamp = new Date().toISOString();
      const changedCount = statusResult.fileCount;

      // Step D: Audit log success (NEVER log the token)
      const auditLog = await AuditService.recordLog(
        'GITHUB_FORCE_PUSH_SUCCESS',
        'SYSTEM',
        `Úspěšný FORCE PUSH (--force) do ${repo}:${branch}. Commit: "${cleanMsg || statusResult.lastCommit || 'FORCE PUSH'}". Počet změněných souborů: ${changedCount}. WorkDir: ${workDir}`,
        user,
        ipAddress
      );

      return {
        success: true,
        commitMessage: cleanMsg || statusResult.lastCommit || 'FORCE PUSH',
        changedFilesCount: changedCount,
        timestamp,
        auditId: auditLog.id,
        message: `FORCE PUSH byl úspěšně proveden na repozitář ${repo}:${branch} pomocí --force.`,
      };
    } catch (err: any) {
      const rawError = err.stderr || err.stdout || err.message || 'Neznámá chyba při spouštění FORCE PUSH.';
      const safeErrorMsg = redactToken(rawError, token);

      console.error('[GithubPublisherService] Force push failed:', safeErrorMsg);

      await AuditService.recordLog(
        'GITHUB_FORCE_PUSH_FAILED',
        'SYSTEM',
        `Pokus o FORCE PUSH selhal: ${safeErrorMsg.substring(0, 300)}`,
        user,
        ipAddress
      );

      throw new Error(`Chyba při spouštění FORCE PUSH na GitHub: ${safeErrorMsg}`);
    }
  }

  public static async suggestPushName(): Promise<{ suggestedName: string; source: 'gemini' | 'fallback' }> {
    const workDir = this.resolveWorkDir();
    await this.ensureGitRepo(workDir);

    let diffText = '';
    let changedFiles: string[] = [];

    try {
      const { stdout: diffOut } = await execFileAsync('git', ['diff', 'HEAD'], { cwd: workDir });
      diffText = diffOut || '';
    } catch (err) {
      // Non-fatal if HEAD diff fails
    }

    try {
      const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], { cwd: workDir });
      const lines = statusOut.split('\n').filter((l) => l.trim().length > 0);
      changedFiles = lines.map((l) => l.trim().substring(2).trim());

      if (!diffText.trim() && lines.length > 0) {
        diffText = lines.join('\n');
      }
    } catch (err) {
      // Non-fatal if status fails
    }

    const truncatedDiff = diffText.substring(0, 3000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && truncatedDiff.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Jsi vývojářský asistent. Analýzou následujícího git diffu/změn vytvoř výstižný jednovětný název commitu/pushe v češtině.
Formát MUSÍ být striktně: typ(oblast): popis
Kde 'typ' je např. feat, fix, chore, refactor, style, docs, a 'oblast' např. admin, ui, auth, db, api, build.
Odpověz POUZE vygenerovaným názvem bez uvozovek a bez jakýchkoliv dalších komentářů.
Příklad: feat(admin): přihlašování přes MojeID

Git diff / změny:
${truncatedDiff}`;

        let responseText = '';
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
          });
          responseText = response.text || '';
        } catch (gemini25Err) {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
          });
          responseText = response.text || '';
        }

        const name = responseText.trim().replace(/^["'`]/, '').replace(/["'`]$/, '').trim();
        if (name.length > 0) {
          return { suggestedName: name, source: 'gemini' };
        }
      } catch (aiErr: any) {
        if (aiErr && aiErr.status === 429) {
          console.warn('[GithubPublisherService] Gemini quota exceeded (429), falling back to simple name.');
        } else {
          console.warn('[GithubPublisherService] Gemini push name generation failed, falling back:', aiErr);
        }
      }
    }

    // Fallback generation based on changed file names
    let fallbackName = 'chore(repo): aktualizace projektu';
    if (changedFiles.length > 0) {
      const fileCount = changedFiles.length;
      const sampleFiles = changedFiles.slice(0, 2).map((f) => path.basename(f));

      let scope = 'app';
      let type = 'feat';

      if (changedFiles.some((f) => f.includes('admin') || f.includes('GitHubPublisher'))) {
        scope = 'admin';
      } else if (changedFiles.some((f) => f.includes('db') || f.includes('prisma'))) {
        scope = 'db';
      } else if (changedFiles.some((f) => f.includes('auth') || f.includes('User'))) {
        scope = 'auth';
      } else if (changedFiles.some((f) => f.includes('server.ts') || f.includes('api'))) {
        scope = 'api';
      } else if (changedFiles.some((f) => f.includes('components') || f.includes('ui'))) {
        scope = 'ui';
      }

      if (changedFiles.every((f) => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.config.ts'))) {
        type = 'chore';
      }

      fallbackName = `${type}(${scope}): úprava ${sampleFiles.join(', ')}${fileCount > 2 ? ` a dalších ${fileCount - 2} souborů` : ''}`;
    }

    return { suggestedName: fallbackName, source: 'fallback' };
  }
}
