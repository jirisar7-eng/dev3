import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma';

export const qaDiscoveryService = {
  async discover() {
    const rootDir = process.cwd();
    const srcDir = path.join(rootDir, 'src');
    
    // Naive directory walk
    function walkDir(dir: string, callback: (filepath: string) => void) {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (f === 'node_modules' || f === 'dist' || f.startsWith('.')) return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
      });
    }

    const files: string[] = [];
    walkDir(srcDir, (f) => files.push(f));

    // Analyze counts
    let componentsCount = 0;
    let buttonsCount = 0;
    let linksCount = 0;
    let formsCount = 0;
    let pagesCount = 0;
    let routesCount = 0;

    const endpointsList: { method: string, path: string, file: string }[] = [];

    files.forEach(file => {
      const ext = path.extname(file);
      if (ext === '.tsx' || ext === '.ts') {
        const content = fs.readFileSync(file, 'utf-8');
        
        if (ext === '.tsx') {
          // Detect components
          const componentMatches = content.match(/export const [A-Z][a-zA-Z0-9_]*\s*:\s*React\.FC/g) || content.match(/function [A-Z][a-zA-Z0-9_]*\s*\(/g);
          if (componentMatches) componentsCount += componentMatches.length;

          // Detect buttons
          const buttonMatches = content.match(/<button/g);
          if (buttonMatches) buttonsCount += buttonMatches.length;

          // Detect links
          const linkMatches = content.match(/<Link /g) || content.match(/<a /g);
          if (linkMatches) linksCount += linkMatches.length;

          // Detect forms
          const formMatches = content.match(/<form/g);
          if (formMatches) formsCount += formMatches.length;

          // Detect pages (rough heuristic: files in src/pages or ending with Page.tsx)
          if (file.includes('/pages/') || file.endsWith('Page.tsx')) {
            pagesCount++;
          }
        }

        // Detect API routes
        if (file.includes('/routes/') || file.includes('server.ts')) {
          const routeMatches = content.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g);
          for (const match of routeMatches) {
            routesCount++;
            endpointsList.push({ method: match[1].toUpperCase(), path: match[2], file: path.relative(rootDir, file) });
          }
        }
      }
    });

    // Detect Prisma models
    let prismaModelsCount = 0;
    const prismaPath = path.join(rootDir, 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaPath)) {
      const prismaContent = fs.readFileSync(prismaPath, 'utf-8');
      const modelMatches = prismaContent.match(/^model\s+[a-zA-Z0-9_]+/gm);
      if (modelMatches) prismaModelsCount = modelMatches.length;
    }

    // Upsert a default QA Project
    const project = await prisma.qAProject.upsert({
      where: { name: 'Táta má právo' },
      update: {},
      create: { name: 'Táta má právo' }
    });

    // Upsert a default module
    const module = await prisma.qAModule.create({
      data: {
        projectId: project.id,
        name: `Discovery Run ${new Date().toISOString()}`,
        description: 'Auto-discovered metrics',
      }
    });

    // Save endpoints
    for (const ep of endpointsList) {
      await prisma.qAEndpoint.create({
        data: {
          moduleId: module.id,
          method: ep.method,
          path: ep.path,
          sourceFile: ep.file,
          status: 'NOT_TESTED'
        }
      });
    }

    return {
      filesScanned: files.length,
      metrics: {
        pages: pagesCount,
        routes: routesCount,
        components: componentsCount,
        buttons: buttonsCount,
        links: linksCount,
        forms: formsCount,
        apiEndpoints: endpointsList.length,
        prismaModels: prismaModelsCount,
        e2eTests: 0,
        currentErrors: 0
      }
    };
  },

  async getDashboardData() {
    const project = await prisma.qAProject.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    const endpoints = await prisma.qAEndpoint.count();
    const modules = await prisma.qAModule.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    return {
      project,
      totalEndpoints: endpoints,
      latestModule: modules.length > 0 ? modules[0] : null
    };
  }
};
