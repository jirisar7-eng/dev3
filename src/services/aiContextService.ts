import { MENU_MODULE_PAGES } from './PageService';
import { dbStore } from './dbStore';
import { getPrismaClient, isPrismaAvailable } from '../db/prisma';

export interface AiContextIndexStatus {
  lastGenerated: string;
  publicUrlCount: number;
  status: 'active' | 'error' | 'syncing';
  error: string | null;
  outputs: {
    aiContextUrl: string;
    llmsTxtUrl: string;
    sitemapUrl: string;
    robotsUrl: string;
  };
}

let cachedIndex: {
  lastGenerated: string;
  publicUrls: Array<{ slug: string; title: string; description: string; category?: string }>;
  error: string | null;
} = {
  lastGenerated: new Date().toISOString(),
  publicUrls: [],
  error: null,
};

const PRIVATE_SLUGS_PREFIXES = [
  'administrace',
  'admin',
  'ai-admin',
  'muj-pripad',
  'pripad',
  'moje-slozka',
  'portal',
  'user-portal',
  'coparent',
  'coparent-hub',
  'api',
  'login',
  'registrace',
  'register',
];

export class AiContextService {
  /**
   * Generates or retrieves the cached index of public URLs and content.
   */
  public static async getIndex(forceRefresh = false): Promise<{ lastGenerated: string; publicUrls: Array<{ slug: string; title: string; description: string; category?: string }>; error: string | null }> {
    if (!forceRefresh && cachedIndex.publicUrls.length > 0) {
      return cachedIndex;
    }

    try {
      const publicMap = new Map<string, { slug: string; title: string; description: string; category?: string }>();

      // 1. Add static base routes
      publicMap.set('/', {
        slug: '/',
        title: 'Táta má právo • Pro nejlepší zájem dítěte',
        description: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
        category: 'Hlavní stránka',
      });

      publicMap.set('ai-context', {
        slug: 'ai-context',
        title: 'AI Context & Machine Index • Táta má právo',
        description: 'Strojově čitelný kontext, LLMS.txt, sitemap a metadata pro AI agenty a LLM crawlery.',
        category: 'Systém',
      });

      // 2. Add MENU_MODULE_PAGES (filtering out private ones)
      for (const mod of MENU_MODULE_PAGES) {
        if (this.isPrivateSlug(mod.slug)) continue;
        publicMap.set(mod.slug, {
          slug: mod.slug,
          title: mod.title,
          description: mod.description,
          category: mod.category || 'Moduly',
        });
      }

      // 3. Add dynamic pages from DB if available
      if (isPrismaAvailable()) {
        try {
          const prismaClient = getPrismaClient();
          if (prismaClient) {
            const dbPages = await prismaClient.page.findMany();
            for (const p of dbPages) {
              if (this.isPrivateSlug(p.slug)) continue;
              if (!publicMap.has(p.slug)) {
                publicMap.set(p.slug, {
                  slug: p.slug,
                  title: p.title || p.slug,
                  description: (p.content as any)?.description || `Stránka ${p.title} portálu Táta má právo.`,
                  category: 'CMS Stránky',
                });
              }
            }
          }
        } catch (dbErr: any) {
          console.warn('[AiContextService] DB fetch warning:', dbErr?.message);
        }
      }

      // Fallback to dbStore pages if needed
      for (const p of dbStore.pages || []) {
        if (this.isPrivateSlug(p.slug)) continue;
        if (!publicMap.has(p.slug)) {
          publicMap.set(p.slug, {
            slug: p.slug,
            title: p.title || p.slug,
            description: (p as any).description || (p as any).seoDescription || `Stránka ${p.title} portálu Táta má právo.`,
            category: 'CMS Stránky',
          });
        }
      }

      cachedIndex = {
        lastGenerated: new Date().toISOString(),
        publicUrls: Array.from(publicMap.values()),
        error: null,
      };
    } catch (err: any) {
      console.error('[AiContextService] Error generating index:', err);
      cachedIndex.error = err?.message || 'Neznámá chyba při generování indexu';
    }

    return cachedIndex;
  }

  private static isPrivateSlug(slug: string): boolean {
    const clean = slug.replace(/^\//, '');
    return PRIVATE_SLUGS_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(prefix + '/'));
  }

  public static async generateLlmsTxt(baseUrl = 'https://dev3.tatovacesta.cz'): Promise<string> {
    const index = await this.getIndex();
    
    let md = `# Táta má právo\n\n`;
    md += `> Komplexní opora pro otce v opatrovnických situacích, právní orientace, psychologická podpora a spravedlivá péče zohledňující nejlepší zájem dítěte.\n\n`;
    md += `## O projektu\n\n`;
    md += `Táta má právo je nezávislá odborná a občanská platforma poskytující otcům v České republice právní, psychologickou a krizovou podporu při opatrovnických řízeních, péči o děti, styku s dětmi a komunikaci s institucemi (OSPOD, soudy, znalci).\n\n`;
    md += `Poslední aktualizace kontextu: ${index.lastGenerated}\n\n`;
    
    md += `## Hlavní veřejné sekce a moduly\n\n`;
    for (const item of index.publicUrls) {
      const url = item.slug === '/' ? `${baseUrl}/` : `${baseUrl}/${item.slug}`;
      md += `- [${item.title}](${url}): ${item.description}\n`;
    }
    
    md += `\n## Strojově čitelné zdroje\n\n`;
    md += `- [AI Context & Přehled](${baseUrl}/ai-context)\n`;
    md += `- [LLMS.txt](${baseUrl}/llms.txt)\n`;
    md += `- [Sitemap XML](${baseUrl}/sitemap.xml)\n`;
    md += `- [Robots.txt](${baseUrl}/robots.txt)\n\n`;
    
    md += `## Pravidla používání obsahu\n\n`;
    md += `Tento strojově čitelný kontext slouží pro AI agenty, LLM crawlery a vývojáře. Veškerý obsah podléhá ochraně autorských práv. Osobní spisy, klientská data, identifikovatelné údaje (PII) a interní API jsou přísně chráněny autentizací a nejsou součástí tohoto indexu.\n`;

    return md;
  }

  public static async generateSitemapXml(baseUrl = 'https://dev3.tatovacesta.cz'): Promise<string> {
    const index = await this.getIndex();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    for (const item of index.publicUrls) {
      const loc = item.slug === '/' ? `${baseUrl}/` : `${baseUrl}/${item.slug}`;
      xml += `  <url>\n`;
      xml += `    <loc>${this.escapeXml(loc)}</loc>\n`;
      xml += `    <lastmod>${index.lastGenerated.split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${item.slug === '/' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }
    
    xml += `</urlset>`;
    return xml;
  }

  public static generateRobotsTxt(baseUrl = 'https://dev3.tatovacesta.cz'): string {
    let txt = `User-agent: *\n`;
    txt += `Allow: /\n\n`;
    
    // Disallow private/admin/sensitive paths
    txt += `# Zákaz indexace neveřejných, osobních a administrativních částí\n`;
    txt += `Disallow: /administrace/\n`;
    txt += `Disallow: /admin/\n`;
    txt += `Disallow: /ai-admin/\n`;
    txt += `Disallow: /muj-pripad/\n`;
    txt += `Disallow: /pripad/\n`;
    txt += `Disallow: /moje-slozka/\n`;
    txt += `Disallow: /portal/\n`;
    txt += `Disallow: /user-portal/\n`;
    txt += `Disallow: /coparent/\n`;
    txt += `Disallow: /coparent-hub/\n`;
    txt += `Disallow: /api/\n`;
    txt += `Disallow: /login\n`;
    txt += `Disallow: /registrace\n`;
    txt += `Disallow: /register\n\n`;
    
    txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    return txt;
  }

  public static async getStatus(baseUrl = 'https://dev3.tatovacesta.cz'): Promise<AiContextIndexStatus> {
    const index = await this.getIndex();
    return {
      lastGenerated: index.lastGenerated,
      publicUrlCount: index.publicUrls.length,
      status: index.error ? 'error' : 'active',
      error: index.error,
      outputs: {
        aiContextUrl: `${baseUrl}/ai-context`,
        llmsTxtUrl: `${baseUrl}/llms.txt`,
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        robotsUrl: `${baseUrl}/robots.txt`,
      },
    };
  }

  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
