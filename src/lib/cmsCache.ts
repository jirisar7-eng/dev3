import { apiFetch } from '../utils/apiClient';
/**
 * Shared Request Deduplication and Caching utility for Public CMS Content (/api/cms/articles, /api/cms/faqs).
 * Ensures concurrent requests for public CMS resources are deduplicated into a single in-flight promise
 * and cached with a short TTL (15 seconds) to prevent redundant request storms and rate-limit violations (429),
 * without weakening server-side rate limits, authentication, or RBAC.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 15000; // 15 seconds TTL

export async function fetchCmsPublic<T = any>(endpoint: string): Promise<T> {
  const now = Date.now();
  const cached = cache.get(endpoint);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (inFlightPromises.has(endpoint)) {
    return inFlightPromises.get(endpoint)!;
  }

  const promise = (async () => {
    try {
      const res = await apiFetch(endpoint);
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Failed to fetch ${endpoint}`);
      }
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error ${res.status}`);
      }
      cache.set(endpoint, { data, timestamp: Date.now() });
      return data as T;
    } finally {
      inFlightPromises.delete(endpoint);
    }
  })();

  inFlightPromises.set(endpoint, promise);
  return promise;
}

export function clearCmsCache() {
  cache.clear();
  inFlightPromises.clear();
}
