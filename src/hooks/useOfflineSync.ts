import { useState, useEffect, useCallback, useRef } from 'react';
import { SecureDB } from '../services/offline/SecureDB';
import {
  OfflineSyncService,
  OfflineSyncItem,
  SyncOperationAction,
  SyncProcessResult,
} from '../services/offline/OfflineSyncService';
import { apiFetch } from '../utils/apiClient';

export type SyncStatusType =
  | 'ONLINE'
  | 'OFFLINE'
  | 'SYNCHRONIZUJE'
  | 'ČEKÁ NA PŘIPOJENÍ'
  | 'KONFLIKT'
  | 'CHYBA';

export interface UseOfflineSyncOptions {
  autoSyncOnOnline?: boolean;
  pin?: string;
  salt?: string;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [queue, setQueue] = useState<OfflineSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{
    syncedCount: number;
    conflictCount: number;
    failedCount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Singleton SecureDB instance
  const dbRef = useRef<SecureDB | null>(null);
  if (!dbRef.current) {
    dbRef.current = new SecureDB();
  }

  const db = dbRef.current;

  // Custom API Fetcher that passes auth headers over HTTPS without storing tokens in DB
  const customApiFetcher = useCallback(async (endpoint: string, opts: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tatovacesta_auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await apiFetch(endpoint, {
      ...opts,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      const err: any = new Error(errData.error || 'Přístup odepřen nebo vypršela relace.');
      err.status = res.status;
      throw err;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const err: any = new Error(errData.error || `Chyba HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    return await res.json();
  }, []);

  // Unlock SecureDB
  const unlockVault = useCallback(
    async (pin: string, saltBase64: string = 'dGF0YXZhY2VzdGFfc2FsdF8yMDI2') => {
      setUnlockError(null);
      try {
        await db.unlock(pin, saltBase64);
        setIsLocked(db.isLocked());
        const q = await OfflineSyncService.getQueue(db);
        setQueue(q);
        return true;
      } catch (err: any) {
        setUnlockError('Odemčení trezoru selhalo. Zkontrolujte zadávaný PIN.');
        setIsLocked(db.isLocked());
        return false;
      }
    },
    [db]
  );

  const lockVault = useCallback(() => {
    db.lock();
    setIsLocked(true);
    setQueue([]);
  }, [db]);

  // Refresh queue from SecureDB
  const refreshQueue = useCallback(async () => {
    if (db.isLocked()) {
      setIsLocked(true);
      return;
    }
    try {
      const q = await OfflineSyncService.getQueue(db);
      setQueue(q);
      setIsLocked(false);
    } catch (err: any) {
      if (err.message?.includes('locked') || err.message?.includes('ACCESS_DENIED')) {
        setIsLocked(true);
      } else {
        setErrorMessage(err.message || 'Chyba při čtení šifrované fronty.');
      }
    }
  }, [db]);

  // Auto-initialize unlock if pin provided or auto-unlock with default session pin
  useEffect(() => {
    const initVault = async () => {
      const pinToUse = options.pin || '1234';
      const saltToUse = options.salt || 'dGF0YXZhY2VzdGFfc2FsdF8yMDI2';
      try {
        await db.unlock(pinToUse, saltToUse);
        setIsLocked(db.isLocked());
        const q = await OfflineSyncService.getQueue(db);
        setQueue(q);
      } catch (e) {
        setIsLocked(true);
      }
    };
    initVault();
  }, [db, options.pin, options.salt]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Enqueue new operation safely into encrypted SecureDB
  const enqueueOperation = useCallback(
    async (params: {
      caseId: string;
      draftId?: string;
      action: SyncOperationAction;
      payload: any;
      baseVersion?: number;
    }): Promise<OfflineSyncItem> => {
      if (db.isLocked()) {
        throw new Error('ACCESS_DENIED: SecureDB je zamčen. Před operací odemkněte trezor.');
      }
      const item = await OfflineSyncService.enqueueOperation(db, params);
      await refreshQueue();
      return item;
    },
    [db, refreshQueue]
  );

  // Trigger sync process
  const triggerSync = useCallback(async () => {
    if (db.isLocked()) {
      setErrorMessage('SecureDB je zamčen. Zadejte PIN pro odemčení.');
      return null;
    }

    if (!isOnline) {
      setErrorMessage('Zařízení je offline. Synchronizace proběhne po připojení k internetu.');
      return null;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    try {
      const summary = await OfflineSyncService.processQueue(db, customApiFetcher);
      setLastSyncTime(new Date().toISOString());
      setLastSyncResult({
        syncedCount: summary.syncedCount,
        conflictCount: summary.conflictCount,
        failedCount: summary.failedCount,
      });

      await refreshQueue();
      return summary;
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba během synchronizace.');
      await refreshQueue();
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [db, isOnline, customApiFetcher, refreshQueue]);

  // Auto-sync when online status recovers
  useEffect(() => {
    if (isOnline && options.autoSyncOnOnline && !db.isLocked()) {
      triggerSync();
    }
  }, [isOnline, options.autoSyncOnOnline, db, triggerSync]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (operationId: string, resolution: 'LOCAL' | 'SERVER') => {
      if (db.isLocked()) {
        throw new Error('ACCESS_DENIED: SecureDB je zamčen.');
      }

      setIsSyncing(true);
      setErrorMessage(null);

      try {
        const res = await OfflineSyncService.resolveConflict(
          db,
          operationId,
          resolution,
          customApiFetcher
        );
        await refreshQueue();
        return res;
      } catch (err: any) {
        setErrorMessage(err.message || 'Vyřešení konfliktu selhalo.');
        await refreshQueue();
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [db, customApiFetcher, refreshQueue]
  );

  // Clear completed items from queue
  const clearCompleted = useCallback(async () => {
    if (db.isLocked()) return;
    const currentQueue = await OfflineSyncService.getQueue(db);
    const activeItems = currentQueue.filter((i) => i.status !== 'COMPLETED');
    await OfflineSyncService.saveQueue(db, activeItems);
    await refreshQueue();
  }, [db, refreshQueue]);

  // Compute syncStatus indicator
  const pendingCount = queue.filter(
    (i) => i.status === 'PENDING' || i.status === 'SYNCING'
  ).length;
  const conflictCount = queue.filter((i) => i.status === 'CONFLICT').length;
  const failedCount = queue.filter(
    (i) => i.status === 'FAILED' && i.retryCount >= i.maxRetries
  ).length;

  let syncStatus: SyncStatusType = 'ONLINE';

  if (conflictCount > 0) {
    syncStatus = 'KONFLIKT';
  } else if (isSyncing) {
    syncStatus = 'SYNCHRONIZUJE';
  } else if (!isOnline && pendingCount > 0) {
    syncStatus = 'ČEKÁ NA PŘIPOJENÍ';
  } else if (!isOnline) {
    syncStatus = 'OFFLINE';
  } else if (failedCount > 0) {
    syncStatus = 'CHYBA';
  } else if (pendingCount > 0) {
    syncStatus = 'SYNCHRONIZUJE';
  } else {
    syncStatus = 'ONLINE';
  }

  return {
    isOnline,
    isLocked,
    queue,
    syncStatus,
    isSyncing,
    pendingCount,
    conflictCount,
    failedCount,
    lastSyncTime,
    lastSyncResult,
    errorMessage,
    unlockError,
    unlockVault,
    lockVault,
    refreshQueue,
    enqueueOperation,
    triggerSync,
    resolveConflict,
    clearCompleted,
    dbInstance: db,
  };
}
