/**
 * TÁTA MÁ PRÁVO — Theme Context Resolver
 * Task: TMPR-20260910-THEME-003
 *
 * Maps any application route to one of three canonical runtime contexts:
 * - PUBLIC   (public portal, emergency, articles, auth pages)
 * - PRIVATE  (father's case, portal, user profile, settings, team portal)
 * - ADMIN    (CMS administration, RBAC, server management, AI admin)
 *
 * Note: GLOBAL is never a route context; it is solely a fallback theme context.
 */

export type AppThemeContext = 'PUBLIC' | 'PRIVATE' | 'ADMIN';

const ADMIN_ROUTE_PREFIXES = [
  '/administrace',
  '/admin',
  '/ai-admin',
  '/ai-context',
  '/experimenty',
];

const PRIVATE_ROUTE_PREFIXES = [
  '/muj-pripad',
  '/portal',
  '/user-portal',
  '/dashboard',
  '/nastenka',
  '/team',
  '/spolek',
];

/**
 * Normalizes a raw pathname by:
 * - Stripping query string and hash fragment
 * - Ensuring a leading slash
 * - Stripping trailing slash (unless the path is exactly '/')
 * - Trimming whitespace
 */
export function normalizePathname(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') return '/';
  
  // Strip query and hash
  let clean = rawPath.split('?')[0].split('#')[0].trim();
  
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  
  // Remove trailing slash if longer than 1 char
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  
  return clean.toLowerCase();
}

/**
 * Resolves the theme runtime context for a given pathname.
 * Pure, deterministic mapping with zero side-effects.
 *
 * @param pathname The URL path (e.g. '/muj-pripad', '/administrace/users', '/')
 * @returns 'PUBLIC' | 'PRIVATE' | 'ADMIN'
 */
export function resolveThemeContext(pathname: string): AppThemeContext {
  const norm = normalizePathname(pathname);

  // 1. ADMIN routes have highest precedence
  for (const prefix of ADMIN_ROUTE_PREFIXES) {
    if (norm === prefix || norm.startsWith(prefix + '/')) {
      return 'ADMIN';
    }
  }

  // 2. PRIVATE / Můj případ routes
  for (const prefix of PRIVATE_ROUTE_PREFIXES) {
    if (norm === prefix || norm.startsWith(prefix + '/')) {
      return 'PRIVATE';
    }
  }

  // 3. PUBLIC is default for all other routes
  return 'PUBLIC';
}
