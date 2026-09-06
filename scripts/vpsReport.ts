/**
 * VPS-REPORT: CLI Diagnostic Bridge -> Notion
 * Táta má právo / Synthesis Hub / DEV3
 *
 * Usage:
 *   npx tsx scripts/vpsReport.ts
 *   npm run vps-report
 *   vps-report
 */

import { VpsDiagnosticBridge } from '../src/services/audit/vpsDiagnosticBridge';

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const isLocalOnly = args.includes('--local-only');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
Táta má právo — VPS Diagnostic Bridge (vps-report)

POUŽITÍ:
  vps-report [volby]
  npm run vps-report
  npx tsx scripts/vpsReport.ts [volby]

VOLBY:
  --json          Výstup pouze ve formátu JSON (pro strojové zpracování)
  --local-only    Přeskočit odeslání do Notion (pouze lokální diagnostika)
  --target-url    URL pro test Caddy/HTTPS (výchozí: dev3.tatovacesta.cz)
  --port          Port aplikace pro test /api/health (výchozí: 3000)
  --help, -h      Zobrazit tuto nápovědu

BEZPEČNOST:
  - Striktně READ-ONLY (žádné mutace, restarty ani zápisy do databáze).
  - Automatická 0-PII sanitizace (hesla, tokeny, API klíče, rodná čísla).
  - Fail-Closed kontrola unredacted secretů před přenosem.
`);
    process.exit(0);
  }

  // Parse optional target URL and port
  let targetUrl: string | undefined;
  const targetUrlIdx = args.indexOf('--target-url');
  if (targetUrlIdx !== -1 && args[targetUrlIdx + 1]) {
    targetUrl = args[targetUrlIdx + 1];
  }

  let appPort: number | undefined;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    appPort = parseInt(args[portIdx + 1], 10);
  }

  try {
    if (!isJson) {
      console.log('Spouštím bezpečnou read-only diagnostiku VPS/DEV3...');
    }

    const report = await VpsDiagnosticBridge.collectDiagnosticReport({
      targetUrl,
      appPort,
    });

    if (isJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(VpsDiagnosticBridge.generateCliSummary(report));
    }

    if (isLocalOnly) {
      if (!isJson) {
        console.log('\n[INFO] Zvolena volba --local-only. Odeslání do Notion přeskočeno.\n');
      }
      process.exit(report.overallStatus === 'FAIL' ? 1 : 0);
    }

    if (!isJson) {
      console.log('\nOdesílám diagnostický report do Notion (DEV3 – Audit Knowledge Base)...');
    }

    const pushResult = await VpsDiagnosticBridge.pushReportToNotion(report);

    if (!isJson) {
      console.log(`[NOTION STATUS] ${pushResult.status}`);
      console.log(`[NOTION MESSAGE] ${pushResult.message}`);
      if (pushResult.notionPageId) {
        console.log(`[NOTION PAGE ID] ${pushResult.notionPageId}`);
      }
      if (pushResult.notionUrl) {
        console.log(`[NOTION URL] ${pushResult.notionUrl}`);
      }
      console.log('');
    }

    if (pushResult.status === 'FAILED_BLOCKED') {
      console.error('[CHYBA] Zápis do Notion zablokován bezpečnostním pravidlem.');
      process.exit(1);
    }

    // Fail code only if critical P0 error detected
    if (report.overallStatus === 'FAIL') {
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error(`[KRITICKÁ CHYBA] Spuštění diagnostiky selhalo: ${error.message}`);
    process.exit(1);
  }
}

main();
