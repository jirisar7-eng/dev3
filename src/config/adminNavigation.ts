import {
  LayoutDashboard,
  BarChart2,
  Type,
  Palette,
  Image as ImageIcon,
  Sliders,
  FileText,
  Users,
  ShieldCheck,
  Clock,
  Settings,
  Mail,
  Sparkles,
  Globe,
  GitPullRequest,
  LayoutTemplate,
  Code,
  Building2,
  Terminal,
  FlaskConical,
  Cpu,
  Scale,
  Landmark,
  CheckCircle2,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { UserRole } from '../types';

export type AdminTabId =
  | 'overview'
  | 'analytics'
  | 'pages'
  | 'templates'
  | 'page-builder'
  | 'texts'
  | 'theme'
  | 'branding'
  | 'modules'
  | 'custom-modules'
  | 'esbirka'
  | 'state-admin'
  | 'subjekty'
  | 'schvalovani-kontaktu'
  | 'cms'
  | 'users'
  | 'mailcow'
  | 'compliance'
  | 'audit'
  | 'audits'
  | 'qa'
  | 'ai-context'
  | 'settings'
  | 'sponsors'
  | 'dns'
  | 'github'
  | 'vps'
  | 'tests'
  | 'team-center';

export interface AdminNavItem {
  id: AdminTabId;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'blue' | 'emerald' | 'indigo' | 'amber' | 'purple' | 'rose' | 'slate' | 'sky';
  };
  path?: string;
  requiredRole?: UserRole;
  requiredPermission?: string;
  keywords: string[];
}

export interface AdminNavSection {
  id: string;
  title: string;
  emoji: string;
  description: string;
  icon: LucideIcon;
  requiredRole?: UserRole;
  requiredPermission?: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'sec-overview',
    title: 'Přehled',
    emoji: '📊',
    description: 'Systémový stav, hlavní metriky a upozornění',
    icon: LayoutDashboard,
    items: [
      {
        id: 'overview',
        title: 'Přehled systému',
        subtitle: 'Dashboard, statistiky a stav Fáze 1',
        icon: LayoutDashboard,
        keywords: ['přehled', 'dashboard', 'systém', 'metriky', 'statistika', 'stav'],
      },
    ],
  },
  {
    id: 'sec-cms',
    title: 'Obsah & CMS',
    emoji: '📝',
    description: 'Vizuální správa stránek, šablony, texty, téma a obsahové moduly',
    icon: FileText,
    items: [
      {
        id: 'pages',
        title: 'Správa stránek',
        subtitle: 'Vizuální správa a historie stránek',
        icon: LayoutTemplate,
        badge: { text: 'Puck', variant: 'indigo' },
        path: '/admin/pages',
        keywords: ['stránky', 'pages', 'puck', 'obsah', 'layout', 'podstránky', 'seo'],
      },
      {
        id: 'templates',
        title: 'Šablony stránek',
        subtitle: 'Předpřipravené šablony a bloky',
        icon: Sparkles,
        badge: { text: 'Engine', variant: 'amber' },
        keywords: ['šablony', 'templates', 'bloky', 'layout', 'design', 'seed'],
      },
      {
        id: 'texts',
        title: 'Text Manager',
        subtitle: 'Slovník systémových a lokalizačních textů',
        icon: Type,
        badge: { text: 'Slovník', variant: 'blue' },
        keywords: ['texty', 'texts', 'slovník', 'překlady', 'lokalizace', 'content string', 'hlášky'],
      },
      {
        id: 'theme',
        title: 'Theme & Colors',
        subtitle: 'Barevná schémata a systémové palety',
        icon: Palette,
        keywords: ['téma', 'theme', 'barvy', 'colors', 'paleta', 'vzhled', 'css'],
      },
      {
        id: 'branding',
        title: 'Branding & Logo',
        subtitle: 'Loga, favicon a Visual SVG Editor',
        icon: ImageIcon,
        keywords: ['branding', 'logo', 'favicon', 'svg', 'grafika', 'identita', 'editor'],
      },
      {
        id: 'custom-modules',
        title: 'Dynamické JSON Moduly',
        subtitle: 'Správa modulů s JSON Schema formuláři',
        icon: Code,
        badge: { text: 'Schema UI', variant: 'indigo' },
        keywords: ['json', 'moduly', 'schema', 'custom', 'formuláře', 'dynamické'],
      },
      {
        id: 'cms',
        title: 'Obsah CMS',
        subtitle: 'Články, studie, wiki, videa, návody a kvízy',
        icon: FileText,
        keywords: ['cms', 'články', 'poradna', 'aktuality', 'studie', 'wiki', 'videa', 'návody', 'kvízy', 'memento'],
      },
    ],
  },
  {
    id: 'sec-users',
    title: 'Uživatelé & Přístupy',
    emoji: '👥',
    description: 'Správa uživatelů, RBAC role, 2FA zabezpečení a schvalování',
    icon: Users,
    items: [
      {
        id: 'users',
        title: 'Uživatelé & RBAC',
        subtitle: 'Účty, role, 2FA stav, reset hesel a oprávnění',
        icon: Users,
        badge: { text: 'RBAC', variant: 'amber' },
        keywords: ['uživatelé', 'users', 'rbac', 'role', 'oprávnění', 'hesla', '2fa', 'mfa', 'přístupy', 'blokace'],
      },
    ],
  },
  {
    id: 'sec-legal',
    title: 'Právo & Státní data',
    emoji: '⚖️',
    description: 'Integrace e-Sbírky, státní registry, instituce a moderace kontaktů',
    icon: Scale,
    items: [
      {
        id: 'esbirka',
        title: 'Administrace e-Sbírka',
        subtitle: 'Konektor MV ČR, synchronizace zákonů a limity',
        icon: Scale,
        badge: { text: 'MV ČR', variant: 'emerald' },
        keywords: ['esbírka', 'e-sbírka', 'zákony', 'legislativa', 'paragrafy', 'mv čr', 'synchronizace', 'právo'],
      },
      {
        id: 'state-admin',
        title: 'Státní data & API Hub',
        subtitle: 'ČSÚ statistiky, MSp soudy, ARES a OSPOD data',
        icon: Landmark,
        badge: { text: 'ČSÚ / MSp', variant: 'blue' },
        keywords: ['státní data', 'čsú', 'msp', 'ares', 'statistika', 'opendata', 'soudy', 'justice'],
      },
      {
        id: 'subjekty',
        title: 'Registr Subjektů',
        subtitle: 'Soudy, OSPOD, mediátoři, znalci a advokáti',
        icon: Building2,
        badge: { text: 'Hodnocení', variant: 'amber' },
        keywords: ['subjekty', 'registr', 'soudy', 'ospod', 'mediátoři', 'znalci', 'advokáti', 'instituce', 'mapa'],
      },
      {
        id: 'schvalovani-kontaktu',
        title: 'Schvalování kontaktů',
        subtitle: 'Moderace uživatelských podání a pracovníků',
        icon: Users,
        badge: { text: 'Moderace', variant: 'emerald' },
        keywords: ['schvalování', 'kontakty', 'moderace', 'pracovníci', 'soudci', 'opatrovníci', 'podání'],
      },
    ],
  },
  {
    id: 'sec-ai',
    title: 'AI & Automatizace',
    emoji: '🤖',
    description: 'Synthesis Admin Copilot, AI Context báze, QA orchestrátor a E2E testy',
    icon: Sparkles,
    items: [
      {
        id: 'qa',
        title: 'Synthesis Admin Copilot',
        subtitle: 'Multi-AI agent pro asistovanou správu a QA',
        icon: Sparkles,
        badge: { text: 'AI Agent', variant: 'purple' },
        path: '/administrace/qa/copilot',
        keywords: ['copilot', 'ai', 'agent', 'synthesis', 'automatizace', 'asistent', 'gemini'],
      },
      {
        id: 'ai-context',
        title: 'AI Context & Index',
        subtitle: 'Znalostní báze pro LLM, indexace a systémové prompty',
        icon: Cpu,
        badge: { text: 'LLMS', variant: 'blue' },
        keywords: ['ai context', 'index', 'llm', 'prompty', 'znalostní báze', 'vektory', 'rag'],
      },
      {
        id: 'qa',
        title: 'QA & Audit Syntéza',
        subtitle: 'Komplexní QA orchestrátor, integrity testy a registry',
        icon: Activity,
        badge: { text: 'Orchestrátor', variant: 'purple' },
        path: '/administrace/qa',
        keywords: ['qa', 'testy', 'audit syntéza', 'findings', 'integrita', 'analýza', 'orchestrator'],
      },
      {
        id: 'tests',
        title: 'E2E AI Testy',
        subtitle: 'Spouštěč Playwright a systémových testů',
        icon: FlaskConical,
        badge: { text: 'Playwright', variant: 'indigo' },
        keywords: ['e2e', 'testy', 'playwright', 'automatizace', 'test runner', 'qa runner'],
      },
    ],
  },
  {
    id: 'sec-analytics',
    title: 'Analytika & Audit',
    emoji: '📈',
    description: '0-PII telemetrie, bezpečnostní auditní logy a compliance dokumenty',
    icon: BarChart2,
    items: [
      {
        id: 'analytics',
        title: 'Analytika & Návštěvnost',
        subtitle: '0-PII telemetrie, metriky a konverzní cesty',
        icon: BarChart2,
        badge: { text: '0-PII', variant: 'emerald' },
        path: '/admin/analytics',
        keywords: ['analytika', 'analytics', 'návštěvnost', 'telemetrie', 'grafy', 'metriky', '0-pii'],
      },
      {
        id: 'audit',
        title: 'Audit Log (Provozní DB)',
        subtitle: 'Bezpečnostní a systémové logy z PostgreSQL',
        icon: Clock,
        badge: { text: 'DB Logy', variant: 'rose' },
        keywords: ['audit log', 'provozní logy', 'databáze', 'bezpečnost', 'události', 'přihlášení', 'změny', 'db'],
      },
      {
        id: 'audits',
        title: 'Audit Center (Vývojové zprávy)',
        subtitle: 'Architektonické a QA auditní reporty z docs/audit',
        icon: ShieldCheck,
        badge: { text: 'docs/audit', variant: 'blue' },
        path: '/administrace/audity',
        keywords: ['audit center', 'audity', 'reporty', 'dev3', 'markdown', 'dokumentace', 'qa reporty', 'vývojové zprávy'],
      },
      {
        id: 'compliance',
        title: 'Compliance Dokumenty',
        subtitle: 'Verzování GDPR, Podmínek užití a Kodexu',
        icon: ShieldCheck,
        badge: { text: 'GDPR', variant: 'sky' },
        keywords: ['compliance', 'gdpr', 'podmínky', 'kodex', 'právní dokumenty', 'verze', 'cookies'],
      },
      {
        id: 'sponsors',
        title: 'Sponzoři a partneři',
        subtitle: 'Správa partnerských profilů, dárců a úrovní podpory',
        icon: CheckCircle2,
        keywords: ['sponzoři', 'partneři', 'dárci', 'financování', 'podpora', 'tiers', 'loga'],
      },
    ],
  },
  {
    id: 'sec-system',
    title: 'Systém & DevSecOps',
    emoji: '⚙️',
    description: 'Globální nastavení, moduly, e-mail, DNS, VPS a GitHub Publisher',
    icon: Settings,
    items: [
      {
        id: 'settings',
        title: 'Systémové Nastavení',
        subtitle: 'Globální parametry portálu a přepínače',
        icon: Settings,
        keywords: ['nastavení', 'settings', 'systém', 'konfigurace', 'parametry', 'cache', 'smtp'],
      },
      {
        id: 'modules',
        title: 'Module Manager',
        subtitle: 'Aktivace a řízení modulů portálu',
        icon: Sliders,
        keywords: ['moduly', 'modules', 'zapnutí', 'vypnutí', 'aktivace', 'správa modulů'],
      },
      {
        id: 'mailcow',
        title: 'Správa E-mailů',
        subtitle: 'Mailcow API, týmové schránky a aliasy',
        icon: Mail,
        badge: { text: 'Mailcow', variant: 'blue' },
        keywords: ['mailcow', 'email', 'pošta', 'schránky', 'aliasy', 'týmová pošta', 'domény'],
      },
      {
        id: 'dns',
        title: 'Správa DNS',
        subtitle: 'Vercel DNS záznamy a správa domén',
        icon: Globe,
        badge: { text: 'Vercel', variant: 'sky' },
        path: '/admin/dns',
        keywords: ['dns', 'domény', 'vercel', 'cname', 'záznamy', 'tatovacesta.cz', 'mx'],
      },
      {
        id: 'vps',
        title: 'VPS & Systém',
        subtitle: 'Monitoring serveru, PM2, Caddy procesy a hardware',
        icon: Terminal,
        badge: { text: 'SUPER_ADMIN', variant: 'rose' },
        requiredRole: 'SUPER_ADMIN',
        keywords: ['vps', 'server', 'pm2', 'caddy', 'docker', 'cpu', 'ram', 'hardware', 'restart'],
      },
      {
        id: 'github',
        title: 'GitHub Publisher',
        subtitle: 'Publikování změn a synchronizace do repozitáře',
        icon: GitPullRequest,
        badge: { text: 'SUPER_ADMIN', variant: 'purple' },
        requiredRole: 'SUPER_ADMIN',
        keywords: ['github', 'publisher', 'git', 'push', 'commit', 'release', 'repozitář'],
      },
    ],
  },
  {
    id: 'sec-team',
    title: 'Team Center',
    emoji: '🏛️',
    description: 'Koordinace týmu, dobrovolníků a přidělování případů',
    icon: Building2,
    items: [
      {
        id: 'team-center',
        title: 'Team Center Hub',
        subtitle: 'Týmová spolupráce a koordinace případů (připravováno)',
        icon: Building2,
        badge: { text: 'Slot', variant: 'slate' },
        keywords: ['team', 'tým', 'koordinace', 'dobrovolníci', 'případy', 'hub', 'spolupráce'],
      },
    ],
  },
];

export function getVisibleAdminSections(userRole?: UserRole): AdminNavSection[] {
  if (!userRole) return [];

  // Hierarchy check for SUPER_ADMIN vs ADMIN vs others
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdminOrSuper = isSuperAdmin || userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN';

  if (!isAdminOrSuper) {
    // Non-admin roles (e.g. CONTENT_MANAGER, LEGAL_EDITOR, MODERATOR) can only see relevant items if enabled
    return ADMIN_NAV_SECTIONS.map((section) => {
      const visibleItems = section.items.filter((item) => {
        if (item.requiredRole === 'SUPER_ADMIN') return false;
        if (item.requiredRole === 'ADMIN' && !isAdminOrSuper) return false;
        
        // Granular checks
        if (userRole === 'CONTENT_MANAGER' && section.id === 'sec-cms') return true;
        if (userRole === 'LEGAL_EDITOR' && (section.id === 'sec-legal' || item.id === 'compliance')) return true;
        if (userRole === 'MODERATOR' && (item.id === 'subjekty' || item.id === 'schvalovani-kontaktu')) return true;
        
        return false;
      });
      return { ...section, items: visibleItems };
    }).filter((sec) => sec.items.length > 0);
  }

  // Admin and Super Admin
  return ADMIN_NAV_SECTIONS.map((section) => {
    const visibleItems = section.items.filter((item) => {
      if (item.requiredRole === 'SUPER_ADMIN') {
        return isSuperAdmin;
      }
      return true;
    });
    return { ...section, items: visibleItems };
  }).filter((sec) => sec.items.length > 0);
}

export function findSectionByTabId(tabId: AdminTabId): string | undefined {
  for (const section of ADMIN_NAV_SECTIONS) {
    if (section.items.some((item) => item.id === tabId)) {
      return section.id;
    }
  }
  return undefined;
}

export function getAllAdminItems(): AdminNavItem[] {
  return ADMIN_NAV_SECTIONS.flatMap((sec) => sec.items);
}

export function findItemByTabId(tabId: AdminTabId): AdminNavItem | undefined {
  for (const section of ADMIN_NAV_SECTIONS) {
    const found = section.items.find((item) => item.id === tabId);
    if (found) return found;
  }
  return undefined;
}

export function resolveAdminTabFromUrl(urlOrPath?: string): AdminTabId {
  const target = urlOrPath || (typeof window !== 'undefined' ? window.location.pathname + window.location.search + window.location.hash : '');
  
  // 1. Query parameter matching (?tab=xxx or ?subtab=xxx)
  let searchStr = '';
  if (target.includes('?')) {
    searchStr = target.slice(target.indexOf('?'));
  } else if (typeof window !== 'undefined' && window.location.search) {
    searchStr = window.location.search;
  }

  if (searchStr) {
    const params = new URLSearchParams(searchStr);
    const tabParam = params.get('tab') || params.get('subtab') || params.get('sub');
    if (tabParam) {
      if (tabParam === 'copilot') return 'qa';
      if (tabParam === 'audit-center' || tabParam === 'audity') return 'audits';
      if (tabParam === 'audit-log') return 'audit';
      if (tabParam === 'analytika') return 'analytics';
      
      const matched = findItemByTabId(tabParam as AdminTabId);
      if (matched) return matched.id;
    }
  }

  // 2. Specific Path matches
  if (target.startsWith('/admin/pages/new') || target.startsWith('/admin/pages/edit')) return 'page-builder';
  if (target.startsWith('/admin/pages')) return 'pages';
  if (target.startsWith('/admin/analytics') || target.includes('/analytika')) return 'analytics';
  if (target.startsWith('/admin/dns')) return 'dns';
  if (target.includes('/qa/copilot') || target.includes('tab=copilot')) return 'qa';
  if (target.includes('/qa') || target.includes('/administrace/qa') || target.includes('/admin/copilot')) return 'qa';
  if (target.includes('/audity') || target.includes('/administrace/audity') || target.includes('/admin/audit-center')) return 'audits';
  if (target.includes('/audit-log') || target.includes('/administrace/audit-log')) return 'audit';
  if (target.includes('/admin/team-center')) return 'team-center';

  // 3. Match against configured item paths
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path && (target === item.path || target.startsWith(item.path + '/') || target.startsWith(item.path + '?'))) {
        return item.id;
      }
    }
  }

  // Default fallback
  return 'overview';
}
