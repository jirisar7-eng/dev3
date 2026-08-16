import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { prisma, isPrismaAvailable } from '../../db/prisma';

export interface ArtifactInfo {
  key: string;            // e.g. "SERVICE:CarePlanService", "ENDPOINT:GET:/api/health", "COMPONENT:ArticleCard", "PAGE:CareHubPage", "TEST:careHubHardening"
  name: string;
  type: 'SERVICE' | 'ENDPOINT' | 'COMPONENT' | 'PAGE' | 'TEST';
  filePath: string;
  contentHash: string;
  imports: string[];       // Array of filePaths or relative module names imported by this file
}

export interface IncrementalAuditPlan {
  totalItems: number;
  commitSha: string;
  itemsToSkip: Array<{ key: string; name: string; type: string; hash: string; status: string }>;
  itemsToRun: Array<{ key: string; name: string; type: string; hash: string; status: string; reason: 'NEW' | 'CHANGED' | 'DEPENDENCY_CHANGED' | 'PREVIOUSLY_FAILED' }>;
  dependencyEdges: Array<{ sourceKey: string; targetKey: string }>;
}

// In-Memory store fallback if Prisma/PostgreSQL is offline in dev/preview
const memoryRegistry = new Map<string, {
  id: string;
  key: string;
  name: string;
  type: string;
  filePath: string;
  contentHash: string;
  lastCommitSha?: string;
  status: string;
  lastVerifiedAt?: Date;
  lastResultJson?: string;
}>();

const memoryDependencies = new Set<string>(); // "sourceKey->targetKey"

export const qaRegistryService = {
  getGitCommitSha(): string {
    try {
      return execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    } catch {
      return 'main-HEAD';
    }
  },

  getGitInfo(): { currentCommitSha: string; previousCommitSha: string; changedFiles: string[] } {
    let currentCommitSha = 'main-HEAD';
    let previousCommitSha = 'main-HEAD~1';
    let changedFiles: string[] = [];

    try {
      currentCommitSha = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    } catch {}

    try {
      previousCommitSha = execSync('git rev-parse --short HEAD~1', { stdio: 'pipe' }).toString().trim();
    } catch {}

    try {
      const gitDiff = execSync('git diff --name-only HEAD~1 HEAD', { stdio: 'pipe' }).toString().trim();
      if (gitDiff) {
        changedFiles = gitDiff.split('\n').map(f => f.trim()).filter(Boolean);
      }
    } catch {}

    return { currentCommitSha, previousCommitSha, changedFiles };
  },

  computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  computeFileHash(filePath: string): string {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        return this.computeHash(content);
      }
    } catch {
      // Fallback
    }
    return '0000000000000000000000000000000000000000000000000000000000000000';
  },

  discoverArtifacts(): ArtifactInfo[] {
    const rootDir = process.cwd();
    const srcDir = path.join(rootDir, 'src');
    const artifacts: ArtifactInfo[] = [];

    function walkDir(dir: string, callback: (filepath: string) => void) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f === 'node_modules' || f === 'dist' || f.startsWith('.')) continue;
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
          walkDir(dirPath, callback);
        } else {
          callback(dirPath);
        }
      }
    }

    const allTsFiles: string[] = [];
    walkDir(srcDir, (f) => {
      if (f.endsWith('.ts') || f.endsWith('.tsx')) {
        allTsFiles.push(f);
      }
    });

    for (const fullPath of allTsFiles) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const filename = path.basename(relPath, path.extname(relPath));
      const content = fs.readFileSync(fullPath, 'utf-8');
      const hash = this.computeHash(content);

      // Extract imports from file
      const importMatches = Array.from(content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g));
      const imports = importMatches.map(m => m[1]);

      if (relPath.startsWith('src/services/')) {
        artifacts.push({
          key: `SERVICE:${filename}`,
          name: filename,
          type: 'SERVICE',
          filePath: relPath,
          contentHash: hash,
          imports
        });
      } else if (relPath.startsWith('src/components/')) {
        artifacts.push({
          key: `COMPONENT:${filename}`,
          name: filename,
          type: 'COMPONENT',
          filePath: relPath,
          contentHash: hash,
          imports
        });
      } else if (relPath.startsWith('src/pages/')) {
        artifacts.push({
          key: `PAGE:${filename}`,
          name: filename,
          type: 'PAGE',
          filePath: relPath,
          contentHash: hash,
          imports
        });
      } else if (relPath.startsWith('src/tests/') || relPath.startsWith('src/routes/')) {
        if (relPath.startsWith('src/tests/')) {
          artifacts.push({
            key: `TEST:${filename}`,
            name: filename,
            type: 'TEST',
            filePath: relPath,
            contentHash: hash,
            imports
          });
        }
      }
    }

    // Discover API Endpoints from routes and server.ts
    const routeFiles = allTsFiles.filter(f => f.includes('/routes/') || f.endsWith('server.ts'));
    for (const fullPath of routeFiles) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf-8');
      const routeMatches = content.matchAll(/(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g);
      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        const key = `ENDPOINT:${method}:${routePath}`;
        artifacts.push({
          key,
          name: `${method} ${routePath}`,
          type: 'ENDPOINT',
          filePath: relPath,
          contentHash: this.computeHash(`${method}:${routePath}:${relPath}:${content.length}`),
          imports: []
        });
      }
    }

    return artifacts;
  },

  async syncAndBuildGraph(isFullAudit = false): Promise<IncrementalAuditPlan> {
    const commitSha = this.getGitCommitSha();
    const artifacts = this.discoverArtifacts();

    // Map filename to key for dependency graph construction
    const filenameToKeyMap = new Map<string, string>();
    for (const a of artifacts) {
      filenameToKeyMap.set(a.name, a.key);
    }

    // Build dependency edges (source -> target)
    const dependencyEdges: Array<{ sourceKey: string; targetKey: string }> = [];
    for (const artifact of artifacts) {
      for (const imp of artifact.imports) {
        const baseImportName = path.basename(imp);
        if (filenameToKeyMap.has(baseImportName)) {
          const targetKey = filenameToKeyMap.get(baseImportName)!;
          if (targetKey !== artifact.key) {
            dependencyEdges.push({ sourceKey: artifact.key, targetKey });
          }
        }
      }
    }

    // Fetch existing registry from DB / Memory
    let dbItemsMap = new Map<string, any>();
    if (isPrismaAvailable()) {
      try {
        const dbItems = await prisma.qARegistryItem.findMany({
          include: { dependencies: true, dependents: true }
        });
        if (Array.isArray(dbItems) && dbItems.length > 0) {
          for (const item of dbItems) {
            dbItemsMap.set(item.key, item);
          }
        }
      } catch {
        dbItemsMap = memoryRegistry;
      }
    } else {
      dbItemsMap = memoryRegistry;
    }

    const itemsToSkip: IncrementalAuditPlan['itemsToSkip'] = [];
    const itemsToRun: IncrementalAuditPlan['itemsToRun'] = [];

    // Track which items changed or are new
    const changedKeys = new Set<string>();

    for (const artifact of artifacts) {
      const existing = dbItemsMap.get(artifact.key);

      if (isFullAudit) {
        itemsToRun.push({
          key: artifact.key,
          name: artifact.name,
          type: artifact.type,
          hash: artifact.contentHash,
          status: 'CHANGED',
          reason: existing ? 'CHANGED' : 'NEW'
        });
        continue;
      }

      if (!existing) {
        // New item -> DISCOVER & RUN
        itemsToRun.push({
          key: artifact.key,
          name: artifact.name,
          type: artifact.type,
          hash: artifact.contentHash,
          status: 'DISCOVERED',
          reason: 'NEW'
        });
        changedKeys.add(artifact.key);
      } else if (existing.contentHash !== artifact.contentHash) {
        // Changed content -> CHANGED & RUN
        itemsToRun.push({
          key: artifact.key,
          name: artifact.name,
          type: artifact.type,
          hash: artifact.contentHash,
          status: 'CHANGED',
          reason: 'CHANGED'
        });
        changedKeys.add(artifact.key);
      } else if (existing.status === 'FAILED') {
        // Previously failed -> RUN
        itemsToRun.push({
          key: artifact.key,
          name: artifact.name,
          type: artifact.type,
          hash: artifact.contentHash,
          status: 'FAILED',
          reason: 'PREVIOUSLY_FAILED'
        });
      }
    }

    // Propagate invalidation to dependent items
    if (!isFullAudit && changedKeys.size > 0) {
      const queue = Array.from(changedKeys);
      const visited = new Set<string>(changedKeys);

      while (queue.length > 0) {
        const currentChangedKey = queue.shift()!;
        // Find items that depend on currentChangedKey
        const dependents = dependencyEdges.filter(edge => edge.targetKey === currentChangedKey);
        for (const dep of dependents) {
          if (!visited.has(dep.sourceKey)) {
            visited.add(dep.sourceKey);
            queue.push(dep.sourceKey);

            // Add to itemsToRun if not already present
            const artifact = artifacts.find(a => a.key === dep.sourceKey);
            if (artifact && !itemsToRun.some(i => i.key === dep.sourceKey)) {
              itemsToRun.push({
                key: artifact.key,
                name: artifact.name,
                type: artifact.type,
                hash: artifact.contentHash,
                status: 'INVALIDATED',
                reason: 'DEPENDENCY_CHANGED'
              });
            }
          }
        }
      }
    }

    // Remaining unchanged items -> SKIP ONLY if a persistent record exists with VERIFIED status
    if (!isFullAudit) {
      const runKeySet = new Set(itemsToRun.map(i => i.key));
      for (const artifact of artifacts) {
        if (!runKeySet.has(artifact.key)) {
          const existing = dbItemsMap.get(artifact.key);
          if (existing && existing.status === 'VERIFIED') {
            itemsToSkip.push({
              key: artifact.key,
              name: artifact.name,
              type: artifact.type,
              hash: artifact.contentHash,
              status: 'VERIFIED'
            });
          } else {
            // Unverified or missing persistent record -> MUST be audited
            itemsToRun.push({
              key: artifact.key,
              name: artifact.name,
              type: artifact.type,
              hash: artifact.contentHash,
              status: existing ? existing.status : 'DISCOVERED',
              reason: 'NEW'
            });
          }
        }
      }
    }

    // Persist/update registry items in database / memory
    for (const item of itemsToRun) {
      await this.upsertRegistryItem(item.key, item.name, item.type, item.hash, item.status, commitSha);
    }
    for (const item of itemsToSkip) {
      await this.upsertRegistryItem(item.key, item.name, item.type, item.hash, 'VERIFIED', commitSha);
    }

    // Ensure all discovered artifacts exist in memoryRegistry
    for (const artifact of artifacts) {
      if (!memoryRegistry.has(artifact.key)) {
        memoryRegistry.set(artifact.key, {
          id: `mem-${artifact.key}`,
          key: artifact.key,
          name: artifact.name,
          type: artifact.type,
          filePath: artifact.filePath,
          contentHash: artifact.contentHash,
          status: 'DISCOVERED',
          lastCommitSha: commitSha
        });
      }
    }

    // Persist dependency graph edges
    for (const edge of dependencyEdges) {
      await this.upsertDependencyEdge(edge.sourceKey, edge.targetKey);
    }

    return {
      totalItems: artifacts.length,
      commitSha,
      itemsToSkip,
      itemsToRun,
      dependencyEdges
    };
  },

  async upsertRegistryItem(key: string, name: string, type: string, hash: string, status: string, commitSha: string): Promise<void> {
    // Always update in-memory store
    const existing = memoryRegistry.get(key) || {
      id: `mem-${key}`,
      key,
      name,
      type,
      filePath: '',
      contentHash: hash,
      status,
      lastCommitSha: commitSha
    };
    existing.contentHash = hash;
    existing.status = status;
    existing.lastCommitSha = commitSha;
    memoryRegistry.set(key, existing);

    if (isPrismaAvailable()) {
      try {
        await prisma.qARegistryItem.upsert({
          where: { key },
          update: {
            contentHash: hash,
            status,
            lastCommitSha: commitSha,
            updatedAt: new Date()
          },
          create: {
            key,
            name,
            type,
            contentHash: hash,
            status,
            lastCommitSha: commitSha
          }
        });
      } catch {
        // Fallback already updated memory
      }
    }
  },

  async markItemVerified(key: string, resultDetails?: any): Promise<void> {
    const commitSha = this.getGitCommitSha();
    const resultJson = resultDetails ? JSON.stringify(resultDetails) : null;

    // Always update memory store
    const existing: {
      id: string;
      key: string;
      name: string;
      type: string;
      filePath: string;
      contentHash: string;
      lastCommitSha?: string;
      status: string;
      lastVerifiedAt?: Date;
      lastResultJson?: string;
    } = memoryRegistry.get(key) || {
      id: `mem-${key}`,
      key,
      name: key,
      type: key.split(':')[0] || 'COMPONENT',
      filePath: '',
      contentHash: '',
      status: 'VERIFIED',
      lastCommitSha: commitSha
    };
    existing.status = 'VERIFIED';
    existing.lastVerifiedAt = new Date();
    existing.lastCommitSha = commitSha;
    existing.lastResultJson = resultJson || undefined;
    memoryRegistry.set(key, existing);

    if (isPrismaAvailable()) {
      try {
        await prisma.qARegistryItem.update({
          where: { key },
          data: {
            status: 'VERIFIED',
            lastVerifiedAt: new Date(),
            lastCommitSha: commitSha,
            lastResultJson: resultJson
          }
        });
      } catch {
        // Ignore
      }
    }
  },

  async markItemFailed(key: string, errorDetails?: any): Promise<void> {
    const resultJson = errorDetails ? JSON.stringify(errorDetails) : null;

    // Always update memory store
    const existing: {
      id: string;
      key: string;
      name: string;
      type: string;
      filePath: string;
      contentHash: string;
      lastCommitSha?: string;
      status: string;
      lastVerifiedAt?: Date;
      lastResultJson?: string;
    } = memoryRegistry.get(key) || {
      id: `mem-${key}`,
      key,
      name: key,
      type: key.split(':')[0] || 'COMPONENT',
      filePath: '',
      contentHash: '',
      status: 'FAILED'
    };
    existing.status = 'FAILED';
    existing.lastResultJson = resultJson || undefined;
    memoryRegistry.set(key, existing);

    if (isPrismaAvailable()) {
      try {
        await prisma.qARegistryItem.update({
          where: { key },
          data: {
            status: 'FAILED',
            lastResultJson: resultJson
          }
        });
      } catch {
        // Ignore
      }
    }
  },

  async upsertDependencyEdge(sourceKey: string, targetKey: string): Promise<void> {
    memoryDependencies.add(`${sourceKey}->${targetKey}`);

    if (isPrismaAvailable()) {
      try {
        const sourceItem = await prisma.qARegistryItem.findUnique({ where: { key: sourceKey } });
        const targetItem = await prisma.qARegistryItem.findUnique({ where: { key: targetKey } });

        if (sourceItem && targetItem) {
          await prisma.qADependency.upsert({
            where: {
              sourceId_targetId: {
                sourceId: sourceItem.id,
                targetId: targetItem.id
              }
            },
            update: {},
            create: {
              sourceId: sourceItem.id,
              targetId: targetItem.id,
              type: 'IMPORTS'
            }
          });
        }
      } catch {
        // Ignore
      }
    }
  },

  async getRegistryOverview() {
    if (isPrismaAvailable()) {
      try {
        const items = await prisma.qARegistryItem.findMany({
          include: { dependencies: { include: { target: true } }, dependents: { include: { source: true } } },
          orderBy: { key: 'asc' }
        });
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to memory below
      }
    }

    return Array.from(memoryRegistry.values()).map(item => ({
      ...item,
      dependencies: [],
      dependents: []
    }));
  }
};
