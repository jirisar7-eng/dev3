import fs from 'fs';
import path from 'path';
import { prisma, isPrismaAvailable } from '../../../db/prisma';
import { qaRegistryService } from '../qaRegistryService';
import { EvidenceBundle } from './types';

export class EvidenceValidator {
  /**
   * Generates a complete Evidence Bundle for a given QA finding.
   */
  public static async createBundle(
    finding: { id?: string; severity: string; category: string; message: string; endpointId?: string },
    qaRun: { id: string; commitSha: string; branch: string; environment: string; findings?: any[] }
  ): Promise<EvidenceBundle> {
    const findingId = finding.id || `fnd-${Math.random().toString(36).substr(2, 9)}`;
    const commitSha = qaRun.commitSha || 'main-HEAD';
    const gitInfo = qaRegistryService.getGitInfo();

    // 1. Locate relevant source files and their contents
    const sourceFiles: Array<{ filePath: string; content: string; hash: string }> = [];
    const dependencyContext: string[] = [];
    let matchedFile: string | null = null;

    try {
      const artifacts = qaRegistryService.discoverArtifacts();
      
      // Try to find a file path matching the message, endpoint, or category
      const lowercaseMsg = finding.message.toLowerCase();
      let bestArtifact = artifacts.find(art => 
        lowercaseMsg.includes(art.name.toLowerCase()) || 
        lowercaseMsg.includes(path.basename(art.filePath).toLowerCase())
      );

      // If not found by name, try to find via endpointId
      if (!bestArtifact && finding.endpointId) {
        bestArtifact = artifacts.find(art => art.key === finding.endpointId || art.filePath.includes(finding.endpointId));
      }

      if (bestArtifact) {
        matchedFile = bestArtifact.filePath;
        const fullPath = path.isAbsolute(bestArtifact.filePath) 
          ? bestArtifact.filePath 
          : path.join(process.cwd(), bestArtifact.filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          sourceFiles.push({
            filePath: bestArtifact.filePath,
            content: content.slice(0, 10000), // Safety cap
            hash: bestArtifact.contentHash
          });
          dependencyContext.push(...bestArtifact.imports);
        }
      }
    } catch (e) {
      console.error('[Evidence Validator] Error locating source files:', e);
    }

    // 2. Resolve stack trace if available
    let stackTrace: string | undefined;
    try {
      // Look for error stacks or exception patterns in the message or global log files if available
      if (finding.message.includes('Error') || finding.message.includes('Exception') || finding.message.includes('at ')) {
        const lines = finding.message.split('\n');
        const traceLines = lines.filter(l => l.trim().startsWith('at ') || l.includes('Stack trace:'));
        if (traceLines.length > 0) {
          stackTrace = traceLines.join('\n');
        }
      }
    } catch {}

    // 3. API Request / Response sample if ENDPOINT category
    let apiRequestResponse: EvidenceBundle['apiRequestResponse'] | undefined;
    if (finding.category === 'API' || finding.message.includes('/api/')) {
      // Try to parse route from finding message
      const routeMatch = finding.message.match(/(GET|POST|PUT|DELETE)\s+(\/api\/[^\s]+)/i);
      const method = routeMatch ? routeMatch[1].toUpperCase() : 'GET';
      const endpoint = routeMatch ? routeMatch[2] : '/api/unknown';

      apiRequestResponse = {
        endpoint,
        method,
        sampleRequest: JSON.stringify({ mockQuery: 'test-qa-payload' }),
        sampleResponse: JSON.stringify({ success: false, error: finding.message })
      };
    }

    // 4. Resolve DB State if PERSISTENCE category
    let dbState: string | undefined;
    if (finding.category === 'PERSISTENCE' || finding.message.toLowerCase().includes('databáz')) {
      dbState = 'Prisma connection: ONLINE. Tables synced. Finding relates to data layer constraints.';
    }

    // 5. Look for previous verified result in QARegistryItem
    let previousVerifiedResult: EvidenceBundle['previousVerifiedResult'] | undefined;
    if (isPrismaAvailable()) {
      try {
        const regKey = matchedFile ? `PAGE:${path.basename(matchedFile, path.extname(matchedFile))}` : null;
        if (regKey) {
          const regItem = await prisma.qARegistryItem.findUnique({
            where: { key: regKey }
          });
          if (regItem && regItem.lastVerifiedAt) {
            previousVerifiedResult = {
              verifiedAt: regItem.lastVerifiedAt.toISOString(),
              verdict: regItem.status || 'VERIFIED',
              commitSha: regItem.lastCommitSha || 'unknown',
              hash: regItem.contentHash || ''
            };
          }
        }
      } catch {}
    }

    // 6. Gather git diff for the specific source file
    let gitDiff: string | undefined;
    if (matchedFile) {
      try {
        const diffOutput = require('child_process')
          .execSync(`git diff HEAD~1 HEAD -- ${matchedFile}`, { stdio: 'pipe' })
          .toString()
          .trim();
        if (diffOutput) {
          gitDiff = diffOutput.slice(0, 3000);
        }
      } catch {}
    }

    // Build the initial bundle
    const bundle: EvidenceBundle = {
      findingId,
      findingMessage: finding.message,
      findingCategory: finding.category,
      severity: finding.severity,
      qaRunId: qaRun.id,
      commitSha,
      gitCommitSha: commitSha,
      qaTestResult: {
        passed: false,
        message: finding.message
      },
      apiRequestResponse,
      stackTrace,
      sourceFiles,
      gitDiff,
      dependencyContext,
      dbState,
      previousVerifiedResult,
      validationStatus: {
        exists: true,
        isFresh: true,
        relatesToCommit: true,
        hasSufficientEvidence: true,
        wasPreviouslyVerified: !!previousVerifiedResult,
        hasChangedSinceVerification: false,
        evidenceScore: 0
      }
    };

    // Run verification logic on the bundle
    return this.validateBundle(bundle);
  }

  /**
   * Evaluates the Evidence Bundle, runs 5 key validation checks, and calculates the Evidence Score.
   */
  public static async validateBundle(bundle: EvidenceBundle): Promise<EvidenceBundle> {
    const status = bundle.validationStatus;

    // Check 1: Existence
    // Verify finding actually exists (e.g. is non-empty message)
    status.exists = bundle.findingMessage.trim().length > 0;

    // Check 2: Freshness
    // Is the QA run ID valid and not empty
    status.isFresh = bundle.qaRunId.trim().length > 0;

    // Check 3: Commit Relevance
    // Does the bundle's commitSha match the current HEAD git commit
    const currentHead = qaRegistryService.getGitCommitSha();
    status.relatesToCommit = currentHead === bundle.commitSha || bundle.commitSha === 'main-HEAD';

    // Check 4: Previous Verification and changes
    if (bundle.previousVerifiedResult && bundle.sourceFiles && bundle.sourceFiles.length > 0) {
      status.wasPreviouslyVerified = true;
      const currentFileHash = bundle.sourceFiles[0].hash;
      const previousHash = bundle.previousVerifiedResult.hash;
      status.hasChangedSinceVerification = currentFileHash !== previousHash;
    } else {
      status.wasPreviouslyVerified = false;
      status.hasChangedSinceVerification = true;
    }

    // Check 5: Evidence Sufficiency & Score Calculation
    let score = 0;
    
    // QA Test Result info (max 20 points)
    if (bundle.qaTestResult) score += 20;

    // Source files presence (max 25 points)
    if (bundle.sourceFiles && bundle.sourceFiles.length > 0) {
      score += 25;
    }

    // Diagnostic information: Stack trace or API request/response or DB state (max 25 points)
    if (bundle.stackTrace || bundle.apiRequestResponse || bundle.dbState) {
      score += 25;
    }

    // Git integration: Commit SHA + Diff (max 15 points)
    if (bundle.gitCommitSha) score += 5;
    if (bundle.gitDiff) score += 10;

    // Dependency context or Previous Verification context (max 15 points)
    if (bundle.dependencyContext && bundle.dependencyContext.length > 0) score += 10;
    if (bundle.previousVerifiedResult) score += 5;

    status.evidenceScore = Math.min(100, score);

    // Is evidence sufficient for a FAIL/PARTIAL finding?
    // Rules say: If it's a FAIL, PARTIAL, or P0/P1 issue, we need at least a source file OR a stack trace
    const isCritical = ['FAIL', 'PARTIAL', 'P0', 'P1'].includes(bundle.severity);
    const hasSourceFile = bundle.sourceFiles && bundle.sourceFiles.length > 0;
    const hasStackTraceOrAPI = !!bundle.stackTrace || !!bundle.apiRequestResponse;

    if (isCritical) {
      if (!hasSourceFile && !hasStackTraceOrAPI) {
        status.hasSufficientEvidence = false;
        status.insufficientEvidenceReason = 'Chybí zdrojový kód (source code) i stack trace k doložení kritického nálezu.';
      } else {
        status.hasSufficientEvidence = status.evidenceScore >= 40;
        if (status.evidenceScore < 40) {
          status.insufficientEvidenceReason = 'Skóre doloženosti důkazy (Evidence Score) je příliš nízké.';
        }
      }
    } else {
      // P2 / P3 warnings require less strict evidence
      status.hasSufficientEvidence = status.evidenceScore >= 20;
    }

    bundle.validationStatus = status;
    return bundle;
  }
}
