/**
 * Security and URL sanitization utilities for Puck CMS Adapters.
 */

/**
 * Sanitizes URLs passed from the Puck CMS editor to prevent javascript: or unapproved external targets.
 * Ensures relative URLs or internal routes (starting with /) are preserved.
 * Strictly prevents malicious inputs to safeguard against SSRF and arbitrary redirects.
 */
export function sanitizeCtaUrl(url?: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  
  // Prevent dangerous URI schemes (javascript:, data:, vbscript:, file:, etc.)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.includes('script:')
  ) {
    return '#';
  }

  // Allow relative URLs, anchors, and query strings safely
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }

  // Handle external URLs with a safety domain boundary check
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      const allowedHosts = ['tatovacesta.cz', 'api.e-sbirka.gov.cz'];
      const host = parsed.hostname;
      
      const isAllowed = allowedHosts.some(allowed => host === allowed || host.endsWith('.' + allowed));
      if (isAllowed) {
        return trimmed;
      } else {
        console.warn(`Blocked potentially unsafe external redirect to: ${trimmed}`);
        return '/';
      }
    } catch {
      return '#';
    }
  }

  // If it doesn't start with http/https, /, #, or ?, prepend / to make it a safe relative path or return #
  if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(trimmed)) {
    return 'https://' + trimmed;
  }

  return '#';
}
