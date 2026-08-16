import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { dbStore } from './dbStore';
import { User } from '../types';

export interface E2ETestState {
  isTesting: boolean;
  lastRun: string | null;
  result: 'passed' | 'failed' | 'running' | 'idle';
  exitCode: number | null;
  durationMs: number | null;
  startedAt: string | null;
  outputLog: string[];
  reportUrl: string;
  triggeredBy?: string;
  hasReport: boolean;
}

class TestRunnerService {
  private state: E2ETestState = {
    isTesting: false,
    lastRun: null,
    result: 'idle',
    exitCode: null,
    durationMs: null,
    startedAt: null,
    outputLog: [],
    reportUrl: '/test-report',
    hasReport: false,
  };

  private currentProcess: any = null;

  constructor() {
    this.checkExistingReport();
  }

  public checkExistingReport(): boolean {
    try {
      const playwrightDir = path.resolve(process.cwd(), 'playwright-report');
      const midsceneDir = path.resolve(process.cwd(), 'midscene_run');
      const hasPlaywright = fs.existsSync(path.join(playwrightDir, 'index.html'));
      const hasMidscene = fs.existsSync(midsceneDir) && fs.readdirSync(midsceneDir).some(f => f.endsWith('.html'));
      this.state.hasReport = hasPlaywright || hasMidscene;
    } catch {
      this.state.hasReport = false;
    }
    return this.state.hasReport;
  }

  public getStatus(): E2ETestState {
    this.checkExistingReport();
    return { ...this.state };
  }

  public async runTests(user?: User): Promise<{ success: boolean; message: string; state: E2ETestState }> {
    if (this.state.isTesting) {
      return {
        success: false,
        message: 'E2E testování již právě probíhá na pozadí.',
        state: this.getStatus(),
      };
    }

    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const triggeredName = user?.name || user?.email || 'Admin';

    this.state.isTesting = true;
    this.state.result = 'running';
    this.state.startedAt = startedAt;
    this.state.exitCode = null;
    this.state.durationMs = null;
    this.state.triggeredBy = triggeredName;
    this.state.outputLog = [
      `[${new Date().toLocaleTimeString('cs-CZ')}] ▶ Spouštím E2E AI Testy (npx playwright test)...`,
      `[${new Date().toLocaleTimeString('cs-CZ')}] Spustil uživatel: ${triggeredName}`,
      `[${new Date().toLocaleTimeString('cs-CZ')}] Načítám proměnné prostředí: GROQ_API_KEY=${process.env.GROQ_API_KEY ? 'Nastaveno (skryto)' : 'Nenalezeno'}, OPENAI_BASE_URL=${process.env.OPENAI_BASE_URL || 'Default'}`,
    ];

    try {
      dbStore.logAudit('RUN_E2E_TESTS_START', 'ADMIN', `Spuštěno testování E2E Playwright uživatelem ${triggeredName}`, user);
    } catch (e) {
      console.error('Audit log error:', e);
    }

    // Ensure output directories exist
    try {
      const playwrightDir = path.resolve(process.cwd(), 'playwright-report');
      const midsceneDir = path.resolve(process.cwd(), 'midscene_run');
      if (!fs.existsSync(playwrightDir)) fs.mkdirSync(playwrightDir, { recursive: true });
      if (!fs.existsSync(midsceneDir)) fs.mkdirSync(midsceneDir, { recursive: true });
    } catch (err) {
      console.warn('Could not pre-create test report dirs:', err);
    }

    const env = {
      ...process.env,
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
      CI: process.env.CI || 'true',
    };

    // Execute npx playwright test in background
    try {
      this.currentProcess = spawn('npx', ['playwright', 'test'], {
        shell: true,
        env,
        cwd: process.cwd(),
      });

      this.currentProcess.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        this.state.outputLog.push(...lines);
        if (this.state.outputLog.length > 800) {
          this.state.outputLog = this.state.outputLog.slice(-800);
        }
      });

      this.currentProcess.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        this.state.outputLog.push(...lines);
        if (this.state.outputLog.length > 800) {
          this.state.outputLog = this.state.outputLog.slice(-800);
        }
      });

      this.currentProcess.on('close', (code: number | null) => {
        this.state.isTesting = false;
        this.state.exitCode = code;
        this.state.durationMs = Date.now() - startTime;
        this.state.lastRun = new Date().toISOString();
        this.state.result = code === 0 ? 'passed' : 'failed';
        this.checkExistingReport();

        const durationSec = ((this.state.durationMs || 0) / 1000).toFixed(1);
        this.state.outputLog.push(
          `[${new Date().toLocaleTimeString('cs-CZ')}] ⏹ Testování dokončeno za ${durationSec}s s návratovým kódem ${code} (Výsledek: ${this.state.result.toUpperCase()}).`
        );

        this.currentProcess = null;

        try {
          dbStore.logAudit(
            'RUN_E2E_TESTS_FINISH',
            'ADMIN',
            `E2E testy dokončeny s výsledkem ${this.state.result} (exit code: ${code}, trvání: ${durationSec}s)`,
            user
          );
        } catch (e) {
          console.error('Audit log error:', e);
        }
      });

      this.currentProcess.on('error', (err: Error) => {
        this.state.isTesting = false;
        this.state.result = 'failed';
        this.state.durationMs = Date.now() - startTime;
        this.state.lastRun = new Date().toISOString();
        this.state.outputLog.push(
          `[${new Date().toLocaleTimeString('cs-CZ')}] ❌ Kritická chyba při spuštění procesu: ${err.message}`
        );
        this.currentProcess = null;
      });

      return {
        success: true,
        message: 'E2E AI testy byly úspěšně spuštěny na pozadí.',
        state: this.getStatus(),
      };
    } catch (err: any) {
      this.state.isTesting = false;
      this.state.result = 'failed';
      this.state.outputLog.push(`[${new Date().toLocaleTimeString('cs-CZ')}] ❌ Výjimka: ${err.message}`);
      return {
        success: false,
        message: `Nepodařilo se spustit testy: ${err.message}`,
        state: this.getStatus(),
      };
    }
  }
}

export const testRunnerService = new TestRunnerService();
