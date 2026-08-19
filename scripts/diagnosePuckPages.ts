import { getPrismaClient, isPrismaAvailable } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { DEFAULT_HOMEPAGE_PUCK_DATA } from '../src/puck/defaultPageData';
import { normalizePuckData } from '../src/puck/config';

async function diagnose() {
  console.log('=== DIAGNOSING PUCK PAGES IN DB & DBSTORE ===\n');

  let prismaPages: any[] = [];
  const prismaAvailable = isPrismaAvailable();
  console.log('Prisma available:', prismaAvailable);

  if (prismaAvailable) {
    try {
      const client = getPrismaClient();
      prismaPages = await client.page.findMany();
      console.log(`Found ${prismaPages.length} pages in Prisma DB.`);
    } catch (e: any) {
      console.log('Prisma query error:', e.message);
    }
  }

  const allPages = prismaPages.length > 0 ? prismaPages : dbStore.pages;
  console.log(`Analyzing total ${allPages.length} pages...\n`);

  let validCount = 0;
  let invalidCount = 0;
  const invalidSlugs: string[] = [];

  for (const page of allPages) {
    let parsedContent: any = null;
    let isValidPuck = false;
    let parseError = '';

    try {
      if (typeof page.content === 'string') {
        parsedContent = JSON.parse(page.content);
      } else {
        parsedContent = page.content;
      }

      if (
        parsedContent &&
        typeof parsedContent === 'object' &&
        Array.isArray(parsedContent.content)
      ) {
        isValidPuck = true;
      }
    } catch (err: any) {
      parseError = err.message;
      isValidPuck = false;
    }

    if (isValidPuck) {
      validCount++;
    } else {
      invalidCount++;
      invalidSlugs.push(page.slug);
      console.log(`❌ INVALID PUCK PAGE: [slug="${page.slug}", id="${page.id}"]`);
      console.log(`   Title: ${page.title}`);
      console.log(`   Parse error / Reason: ${parseError || 'Content is not Puck structure'}`);
      const rawSnippet = typeof page.content === 'string' ? page.content.substring(0, 80) : JSON.stringify(page.content)?.substring(0, 80);
      console.log(`   Content snippet: ${rawSnippet}\n`);
    }
  }

  console.log('=== SUMMARY ===');
  console.log(`Total pages: ${allPages.length}`);
  console.log(`Valid Puck pages: ${validCount}`);
  console.log(`Invalid Puck pages: ${invalidCount}`);
  console.log(`Invalid slugs: ${JSON.stringify(invalidSlugs)}`);
}

diagnose().catch(console.error);
