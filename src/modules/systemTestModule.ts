import { ModuleContract } from '../types';

export interface SystemTestModuleConfig {
  maxRequestsPerMin: number;
  debugMode: boolean;
  apiEndpointUrl: string;
  testPingMessage?: string;
}

export const systemTestModuleContract: ModuleContract<SystemTestModuleConfig> = {
  metadata: {
    key: 'system-test-module',
    name: 'System Test Module (Technický Test)',
    description: 'Demonstrační technický modul pro verifikaci funkčnosti Module Engine, RBAC a konfigurací. Slouží výhradně k technickému testování.',
    version: '1.0.0',
    isPublic: false,
    icon: 'TestTube',
    category: 'system-test',
  },
  permissions: [
    { key: 'systemtest.read', name: 'Zobrazit testovací modul', description: 'Právo zobrazit diagnostiku a stav testovacího modulu' },
    { key: 'systemtest.manage', name: 'Spravovat testovací modul', description: 'Právo spouštět testovací akce a měnit nastavení modulu' },
  ],
  defaultConfig: {
    maxRequestsPerMin: 100,
    debugMode: true,
    apiEndpointUrl: 'https://test.api',
    testPingMessage: 'System Test Engine OK',
  },
  routes: [
    {
      method: 'GET',
      path: '/api/modules/system-test-module/ping',
      handlerName: 'ping',
      public: false,
      permissionRequired: 'systemtest.read',
    },
    {
      method: 'POST',
      path: '/api/modules/system-test-module/run-test',
      handlerName: 'runTest',
      public: false,
      permissionRequired: 'systemtest.manage',
    },
  ],
  adminComponentKey: 'SystemTestModuleAdmin',
  onEnable: () => {
    console.log('[SystemTestModule] Module ENABLED');
  },
  onDisable: () => {
    console.log('[SystemTestModule] Module DISABLED');
  },
  onConfigChange: (newConfig) => {
    console.log('[SystemTestModule] Config updated:', newConfig);
  },
};
