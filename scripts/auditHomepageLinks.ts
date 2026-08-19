import { DEFAULT_HOMEPAGE_PUCK_DATA, LEGAL_PAGES_PUCK_DATA, CRISIS_COMMUNITY_PAGES_PUCK_DATA } from '../src/puck/defaultPageData';
import { dbStore } from '../src/services/dbStore';
import { MENU_MODULE_PAGES, ensureAllModulePagesExist } from '../src/services/PageService';
import fs from 'fs';
import path from 'path';

function extractInternalLinks(obj: any, links: Set<string> = new Set()): Set<string> {
  if (!obj) return links;
  if (typeof obj === 'string') {
    if (obj.startsWith('/') && !obj.startsWith('//') && !obj.startsWith('/#')) {
      // Clean query and hash
      const cleanUrl = obj.split('?')[0].split('#')[0];
      if (cleanUrl) {
        links.add(cleanUrl);
      }
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      extractInternalLinks(item, links);
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      extractInternalLinks(obj[key], links);
    }
  }
  return links;
}

// Slugs handled directly in PublicPortal.tsx routing
function isRouteHandledInPublicPortal(slug: string, publicPortalCode: string): boolean {
  if (slug === '' || slug === '/' || slug === 'home' || slug === 'domu') return true;
  
  // Check common routes in PublicPortal
  const patterns = [
    `slug === '${slug}'`,
    `slug === "${slug}"`,
    `slug.startsWith('${slug}/')`,
    `COMPLIANCE_SLUGS.includes(slug)`,
    `slug === 'user-portal'`,
    `slug === 'portal'`,
  ];

  for (const pattern of patterns) {
    if (publicPortalCode.includes(pattern)) return true;
  }

  // Also check if CmsPageRenderer catches all unhandled slugs
  if (publicPortalCode.includes('return <CmsPageRenderer slug={slug}')) {
    return true;
  }

  return false;
}

async function runAudit() {
  console.log('=== PUCK HOMEPAGE LINK & ROUTING AUDIT ===\n');

  // Ensure dbStore is populated
  await ensureAllModulePagesExist();

  // Load PublicPortal source code to verify route handlers
  const publicPortalPath = path.join(process.cwd(), 'src/components/public/PublicPortal.tsx');
  const publicPortalCode = fs.readFileSync(publicPortalPath, 'utf8');

  const links = Array.from(extractInternalLinks(DEFAULT_HOMEPAGE_PUCK_DATA));
  console.log(`Found ${links.length} internal links in DEFAULT_HOMEPAGE_PUCK_DATA:\n`);

  let brokenCount = 0;
  let missingRouteCount = 0;
  let invalidPuckCount = 0;

  const auditResults: Array<{
    url: string;
    slug: string;
    existsInDbStore: boolean;
    routeHandled: boolean;
    puckValid: boolean;
    status: string;
  }> = [];

  for (const link of links) {
    const rawSlug = link.startsWith('/') ? link.slice(1) : link;
    const slug = rawSlug === '' ? 'home' : rawRawSlug(rawSlug);

    // 1. Check if slug exists in dbStore or MENU_MODULE_PAGES or known components
    const pageInStore = dbStore.pages.find((p) => p.slug === slug || (slug === 'home' && p.slug === 'domu'));
    const pageInMenu = MENU_MODULE_PAGES.find((m) => m.slug === slug);
    const existsInDbStore = !!pageInStore || !!pageInMenu;

    // 2. Check if route is handled in PublicPortal
    const routeHandled = isRouteHandledInPublicPortal(slug, publicPortalCode);

    // 3. Check if target page Puck data is valid
    let puckValid = false;
    let puckObj: any = pageInStore?.content;
    if (typeof puckObj === 'string') {
      try {
        puckObj = JSON.parse(puckObj);
      } catch (e) {
        puckObj = null;
      }
    }

    if (puckObj && typeof puckObj === 'object' && Array.isArray(puckObj.content)) {
      puckValid = true;
    } else if (slug === 'user-portal' || slug === 'portal' || slug === 'muj-pripad') {
      // Private / workspace dashboard views are dynamic React components, valid non-Puck routes
      puckValid = true;
    }

    let status = 'PASS';
    if (!existsInDbStore) {
      status = 'MISSING_IN_DB';
      brokenCount++;
    } else if (!routeHandled) {
      status = 'MISSING_ROUTE';
      missingRouteCount++;
    } else if (!puckValid) {
      status = 'INVALID_PUCK_DATA';
      invalidPuckCount++;
    }

    auditResults.push({
      url: link,
      slug,
      existsInDbStore,
      routeHandled,
      puckValid,
      status,
    });

    console.log(`URL: ${link.padEnd(25)} | Slug: ${slug.padEnd(20)} | DB: ${existsInDbStore ? 'YES' : 'NO '} | Route: ${routeHandled ? 'YES' : 'NO '} | Puck: ${puckValid ? 'VALID  ' : 'INVALID'} | Result: ${status}`);
  }

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total Links Checked: ${links.length}`);
  console.log(`Broken Links: ${brokenCount}`);
  console.log(`Missing Routes: ${missingRouteCount}`);
  console.log(`Invalid Puck Data: ${invalidPuckCount}`);

  if (brokenCount > 0 || missingRouteCount > 0 || invalidPuckCount > 0) {
    console.error('\n❌ AUDIT FAILED: Broken links or invalid routes detected!');
    process.exit(1);
  } else {
    console.log('\n✅ AUDIT PASSED: All homepage links lead to valid routes and valid Puck pages!');
  }
}

function rawRawSlug(s: string): string {
  if (s === '') return 'home';
  return s;
}

runAudit();
