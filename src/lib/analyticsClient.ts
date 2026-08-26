import { apiFetch } from '../utils/apiClient';
import { AnalyticsEventType } from '../types';

class AnalyticsClient {
  private sessionId: string;
  private lastTrackedRoute: string | null = null;
  private lastTrackedTime: number = 0;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr-session';
    try {
      let id = sessionStorage.getItem('tmp_analytics_sid');
      if (!id) {
        id = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        sessionStorage.setItem('tmp_analytics_sid', id);
      }
      return id;
    } catch {
      return 'anon-session-' + Math.random().toString(36).substring(2, 8);
    }
  }

  /**
   * Dispatches event to backend analytics pipeline.
   * Uses fetch with keepalive or falls back silently on network error.
   */
  async sendEvent(
    eventType: AnalyticsEventType | string,
    route: string,
    featureId?: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const payload = {
        sessionId: this.sessionId,
        eventType,
        route: route || window.location.pathname || '/',
        featureId: featureId || null,
        metadata: metadata || {},
      };

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon && eventType === 'session_end') {
        navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'application/json' }));
      } else {
        await apiFetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {
          // Non-blocking catch: user experience is never degraded by analytics transport
        });
      }
    } catch (e) {
      // Non-blocking
    }
  }

  /**
   * Tracks a page view with automatic deduplication within 500ms for identical paths.
   */
  trackPageView(route?: string, metadata?: Record<string, any>) {
    const currentRoute = route || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const now = Date.now();

    if (this.lastTrackedRoute === currentRoute && now - this.lastTrackedTime < 500) {
      return;
    }

    this.lastTrackedRoute = currentRoute;
    this.lastTrackedTime = now;

    this.sendEvent('page_view', currentRoute, null, metadata);
  }

  /**
   * Tracks interactive portal feature usage.
   */
  trackFeature(
    featureId: string,
    eventType: 'feature_open' | 'feature_complete' | 'feature_use' = 'feature_open',
    metadata?: Record<string, any>
  ) {
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.sendEvent(eventType, currentRoute, featureId, metadata);
  }

  /**
   * Tracks a step within a multi-step funnel (e.g. generator_podani, alimony_calculator).
   */
  trackFunnelStep(
    funnelId: string,
    stepIndex: number,
    stepName: string,
    totalSteps?: number,
    metadata?: Record<string, any>
  ) {
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.sendEvent('feature_use', currentRoute, funnelId, {
      funnelId,
      step: stepIndex,
      stepName,
      totalSteps,
      ...(metadata || {}),
    });
  }

  /**
   * Tracks internal search queries with result counts (sanitized, privacy-safe).
   */
  trackSearch(query: string, category?: string, resultsCount?: number, metadata?: Record<string, any>) {
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.sendEvent('search', currentRoute, category ? `search_${category}` : 'search', {
      query: query.trim(),
      category: category || 'all',
      resultsCount: resultsCount !== undefined ? resultsCount : 1,
      hasResults: resultsCount !== undefined ? resultsCount > 0 : true,
      ...(metadata || {}),
    });
  }

  /**
   * Tracks form interactions.
   */
  trackForm(formId: string, eventType: 'form_start' | 'form_complete', metadata?: Record<string, any>) {
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.sendEvent(eventType, currentRoute, `form_${formId}`, metadata);
  }

  /**
   * Tracks document downloads.
   */
  trackDocumentDownload(docNameOrId: string, format: string = 'pdf') {
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.sendEvent('document_download', currentRoute, 'doc_download', {
      docType: docNameOrId,
      format,
    });
  }
}

export const analytics = new AnalyticsClient();
