import { SecureDB } from './SecureDB';

export type SyncOperationAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncItemStatus = 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';

export interface OfflineSyncItem {
  operationId: string;
  caseId: string;
  draftId?: string;
  action: SyncOperationAction;
  payload: {
    title?: string;
    templateId?: string;
    status?: string;
    formData?: any;
    generatedContent?: string;
    notes?: string;
  };
  baseVersion?: number;
  clientTimestamp: string;
  retryCount: number;
  maxRetries: number;
  status: SyncItemStatus;
  error?: string;
  conflictDetails?: {
    serverDraft: any;
    localDraft: any;
  };
}

export interface SyncProcessResult {
  operationId: string;
  status: 'SYNCED' | 'CONFLICT' | 'FAILED' | 'ALREADY_SYNCED';
  draft?: any;
  serverDraft?: any;
  error?: string;
}

export class OfflineSyncService {
  public static readonly QUEUE_KEY = 'offline_sync_queue';
  public static readonly MAX_RETRIES = 3;

  /**
   * Safe queueing of an offline operation into SecureDB (encrypted)
   */
  public static async enqueueOperation(
    db: SecureDB,
    params: {
      caseId: string;
      draftId?: string;
      action: SyncOperationAction;
      payload: any;
      baseVersion?: number;
    }
  ): Promise<OfflineSyncItem> {
    if (!params.caseId) {
      throw new Error('Chybí ID případu (caseId) pro offline operaci.');
    }

    const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const syncItem: OfflineSyncItem = {
      operationId,
      caseId: params.caseId,
      draftId: params.draftId,
      action: params.action,
      payload: params.payload || {},
      baseVersion: params.baseVersion,
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      status: 'PENDING',
    };

    const queue = await this.getQueue(db);
    queue.push(syncItem);
    await this.saveQueue(db, queue);

    return syncItem;
  }

  /**
   * Reads and decrypts the offline sync queue from SecureDB
   */
  public static async getQueue(db: SecureDB): Promise<OfflineSyncItem[]> {
    const raw = await db.getItem(this.QUEUE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Encrypts and saves the offline sync queue back to SecureDB
   */
  public static async saveQueue(db: SecureDB, queue: OfflineSyncItem[]): Promise<void> {
    await db.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Clears all items in the offline sync queue
   */
  public static async clearQueue(db: SecureDB): Promise<void> {
    await db.setItem(this.QUEUE_KEY, JSON.stringify([]));
  }

  /**
   * Process pending queue items by sending sync requests to the backend API
   */
  public static async processQueue(
    db: SecureDB,
    apiFetcher: (endpoint: string, options: any) => Promise<any>
  ): Promise<{
    processedCount: number;
    syncedCount: number;
    conflictCount: number;
    failedCount: number;
    results: SyncProcessResult[];
  }> {
    const queue = await this.getQueue(db);
    const pendingItems = queue.filter(
      item => item.status === 'PENDING' || (item.status === 'FAILED' && item.retryCount < item.maxRetries)
    );

    let syncedCount = 0;
    let conflictCount = 0;
    let failedCount = 0;
    const results: SyncProcessResult[] = [];

    for (const item of pendingItems) {
      item.status = 'SYNCING';
      await this.saveQueue(db, queue);

      try {
        const response = await apiFetcher(`/api/cases/${item.caseId}/submissions/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        });

        const syncResult: SyncProcessResult = response.data?.[0] || response.data || response;

        if (syncResult.status === 'SYNCED' || syncResult.status === 'ALREADY_SYNCED') {
          item.status = 'COMPLETED';
          item.error = undefined;
          syncedCount++;
          results.push(syncResult);
        } else if (syncResult.status === 'CONFLICT') {
          item.status = 'CONFLICT';
          item.conflictDetails = {
            serverDraft: syncResult.serverDraft,
            localDraft: item.payload,
          };
          item.error = syncResult.error || 'Detekován konflikt verzí.';
          conflictCount++;
          results.push(syncResult);
        } else {
          item.retryCount += 1;
          item.status = item.retryCount >= item.maxRetries ? 'FAILED' : 'PENDING';
          item.error = syncResult.error || 'Synchronizace selhala.';
          failedCount++;
          results.push(syncResult);
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isAuthError = err?.status === 401 || err?.status === 403 || errMsg.includes('Přístup odepřen') || errMsg.includes('Neautorizovaný');

        if (isAuthError) {
          item.status = 'FAILED';
          item.error = `EXPIRED_SESSION: ${errMsg}`;
          failedCount++;
          results.push({
            operationId: item.operationId,
            status: 'FAILED',
            error: item.error,
          });
        } else {
          item.retryCount += 1;
          item.status = item.retryCount >= item.maxRetries ? 'FAILED' : 'PENDING';
          item.error = errMsg;
          failedCount++;
          results.push({
            operationId: item.operationId,
            status: 'FAILED',
            error: errMsg,
          });
        }
      }

      await this.saveQueue(db, queue);
    }

    return {
      processedCount: pendingItems.length,
      syncedCount,
      conflictCount,
      failedCount,
      results,
    };
  }

  /**
   * Resolves a version conflict by accepting either LOCAL or SERVER resolution
   */
  public static async resolveConflict(
    db: SecureDB,
    operationId: string,
    resolution: 'LOCAL' | 'SERVER',
    apiFetcher: (endpoint: string, options: any) => Promise<any>
  ): Promise<any> {
    const queue = await this.getQueue(db);
    const itemIndex = queue.findIndex(i => i.operationId === operationId);

    if (itemIndex === -1) {
      throw new Error(`Operace ${operationId} nebyla ve frontě nalezena.`);
    }

    const item = queue[itemIndex];

    const endpoint = item.draftId
      ? `/api/cases/${item.caseId}/submissions/${item.draftId}/resolve-conflict`
      : `/api/cases/${item.caseId}/submissions/sync`;

    const response = await apiFetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution,
        localPayload: item.payload,
        item: resolution === 'LOCAL' ? { ...item, baseVersion: undefined } : undefined,
      }),
    });

    item.status = 'COMPLETED';
    item.error = undefined;
    item.conflictDetails = undefined;

    await this.saveQueue(db, queue);

    return response.data;
  }
}
