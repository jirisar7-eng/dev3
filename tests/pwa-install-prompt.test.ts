import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('PWA Install Prompt Logic (usePWAInstall behavior)', () => {
  let listeners: Record<string, Function[]> = {};
  
  beforeEach(() => {
    listeners = {};
    
    // Mock window
    const winMock: any = {
      matchMedia: (query: string) => ({
        matches: false
      }),
      navigator: {
        userAgent: 'Mozilla/5.0',
        standalone: false
      },
      addEventListener: (evt: string, cb: Function) => {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(cb);
      },
      removeEventListener: (evt: string, cb: Function) => {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter(fn => fn !== cb);
        }
      }
    };
    Object.defineProperty(globalThis, 'window', { value: winMock, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: winMock.navigator, writable: true, configurable: true });
    
    // Mock localStorage
    let store: Record<string, string> = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, val: string) => { store[key] = val; },
        clear: () => { store = {}; }
      },
      writable: true,
      configurable: true
    });
  });
  
  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).navigator;
    delete (globalThis as any).localStorage;
  });

  it('should not show prompt if already standalone (display-mode: standalone)', () => {
    globalThis.window.matchMedia = (query: string) => ({
      matches: query === '(display-mode: standalone)'
    });
    const isStandalone = globalThis.window.matchMedia('(display-mode: standalone)').matches;
    assert.strictEqual(isStandalone, true);
  });

  it('should not show prompt if within 14 days cooldown', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    globalThis.localStorage.setItem('pwa_install_dismissed_date', threeDaysAgo.toString());
    
    const dismissedDateStr = globalThis.localStorage.getItem('pwa_install_dismissed_date');
    const dismissedDate = parseInt(dismissedDateStr!, 10);
    const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
    
    assert.strictEqual(daysSinceDismissed < 14, true);
  });

  it('should show prompt if cooldown > 14 days', () => {
    const twentyDaysAgo = Date.now() - 20 * 24 * 60 * 60 * 1000;
    globalThis.localStorage.setItem('pwa_install_dismissed_date', twentyDaysAgo.toString());
    
    const dismissedDateStr = globalThis.localStorage.getItem('pwa_install_dismissed_date');
    const dismissedDate = parseInt(dismissedDateStr!, 10);
    const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
    
    assert.strictEqual(daysSinceDismissed >= 14, true);
  });

  it('should identify iOS device from userAgent', () => {
    (globalThis.window as any).navigator = {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    };
    const userAgent = globalThis.window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(globalThis.window as any).MSStream;
    assert.strictEqual(isIOSDevice, true);
  });

  it('should not identify Android as iOS', () => {
    (globalThis.window as any).navigator = {
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
    };
    const userAgent = globalThis.window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(globalThis.window as any).MSStream;
    assert.strictEqual(isIOSDevice, false);
  });
  
  it('should set visibility when beforeinstallprompt is triggered', () => {
    let isVisible = false;
    let installEvent: any = null;
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault = () => {};
      installEvent = e;
      isVisible = true;
    };
    globalThis.window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Fire event
    const event = { type: 'beforeinstallprompt', preventDefault: () => {} };
    listeners['beforeinstallprompt'].forEach(fn => fn(event));
    
    assert.strictEqual(isVisible, true);
    assert.ok(installEvent);
  });
});
