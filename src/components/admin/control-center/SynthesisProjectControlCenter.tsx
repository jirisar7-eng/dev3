import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Save, Search, Play, Pause, Activity, Database, GitBranch, GitCommit, GitPullRequest, Cloud, LayoutDashboard, Lock, User, Clock, History, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ControlPlaneAction, ControlPlaneRiskLevel, ControlPlaneStatus, ControlPlaneFinding, ControlPlaneApprovalLevel, DryRunResult } from '../../../types/controlPlane';
import { UserRole } from '../../../types';

export const SynthesisProjectControlCenter: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { currentUser: user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'copilot' | 'approvals' | 'history'>('dashboard');
  const [copilotQuery, setCopilotQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);

  // RBAC Checks for UI
  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canSeeRisk = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'CONTENT_MANAGER';

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call for intent analysis and dry run
    setTimeout(() => {
      setDryRunResult({
        plan: `Analyzován požadavek: "${copilotQuery}"\nPlánovaná akce: Analýza a úprava resources.`,
        affectedResources: ['frontend/homepage', 'api/content'],
        riskLevel: 'P2',
        requiredApproval: 'SAFE_MUTATION',
        requiredPermissions: ['content.write'],
        backupPlan: '48h Snapshot of content database',
        rollbackPlan: 'Restore content from snapshot',
        willMutate: true
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  const executeAction = () => {
    alert("Executing safely via Control Plane. (Phase 5 implementation)");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Synthesis Project Control Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Centrální řídicí bod projektu. Zajišťuje Intent → Risk → Plan → Backup → Execution Lifecycle.
          </p>
        </div>
        
        <div className="flex gap-2 bg-white rounded-lg border shadow-sm p-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('copilot')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'copilot' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Command Center
          </button>
          {canApprove && (
            <button 
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Approvals <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs">2</span>
            </button>
          )}
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Project Health</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">92%</div>
              <div className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Stabilní provoz
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Active Risks (P0/P1)</span>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">0 / 2</div>
              <div className="text-xs text-orange-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Řeší se v rámci ticketů
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Active Control Actions</span>
                <Play className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">1</div>
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Probíhá zálohování
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-sm font-medium">Technical Debt</span>
                <Database className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900">Low</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Clean architecture
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Poslední provedené akce (48h Backup Window)
                </h3>
              </div>
              <div className="divide-y">
                {[
                  { id: 'act-102', req: 'Update homepage text', actor: 'Jan Novák', time: 'před 2 hodinami', status: 'COMPLETED', canRollback: true },
                  { id: 'act-101', req: 'Fix auth bug in Login', actor: 'AI Copilot', time: 'před 1 dnem', status: 'ROLLED_BACK', canRollback: false },
                  { id: 'act-100', req: 'Deploy Phase 3', actor: 'Admin', time: 'před 3 dny', status: 'COMPLETED', canRollback: false }
                ].map(act => (
                  <div key={act.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{act.req}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span><User className="w-3 h-3 inline" /> {act.actor}</span>
                        <span>•</span>
                        <span><Clock className="w-3 h-3 inline" /> {act.time}</span>
                      </div>
                    </div>
                    <div>
                      {act.canRollback ? (
                        <button className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-orange-100">
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <History className="w-3 h-3" /> Expired
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  Aktivní větve a PRs
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium font-mono text-purple-700">feat/project-control-plane-ticket-risk</span>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" /> c9aa446</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 8/8 Tests</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Copilot Command
              </h2>
              <form onSubmit={handleCopilotSubmit}>
                <textarea 
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  rows={4}
                  placeholder="Napište požadavek (např. 'Změň text na úvodní stránce' nebo 'Oprav chybu v kalkulačce')..."
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  disabled={isAnalyzing}
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isAnalyzing || !copilotQuery.trim()}
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <> <Activity className="w-4 h-4 animate-spin" /> Analyzing Intent... </>
                    ) : (
                      <> <Sparkles className="w-4 h-4" /> Analyzovat & Dry Run </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {dryRunResult && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden border-purple-100">
                <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center justify-between">
                  <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Dry Run Výsledek
                  </h3>
                  <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">SAFE_MUTATION</span>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Execution Plan</h4>
                    <pre className="text-sm bg-gray-50 p-3 rounded-lg text-gray-700 whitespace-pre-wrap">{dryRunResult.plan}</pre>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Affected Resources</h4>
                      <div className="flex gap-2 flex-wrap">
                        {dryRunResult.affectedResources.map(r => (
                          <span key={r} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">{r}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Risk Level</h4>
                      <span className={`text-xs px-2 py-1 rounded border font-bold ${
                        dryRunResult.riskLevel === 'P0' ? 'bg-red-50 text-red-700 border-red-200' :
                        dryRunResult.riskLevel === 'P1' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {dryRunResult.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                        <Save className="w-3 h-3" /> Backup Plan
                      </h4>
                      <p className="text-xs text-emerald-700">{dryRunResult.backupPlan}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <h4 className="text-xs font-bold text-orange-800 uppercase mb-1 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Rollback Plan
                      </h4>
                      <p className="text-xs text-orange-700">{dryRunResult.rollbackPlan}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Zrušit</button>
                    <button onClick={executeAction} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Provést akci (Creates Snapshot first)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Vaše oprávnění (RBAC)
              </h3>
              <div className="text-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Aktivní Role</span>
                  <span className="font-mono font-medium text-purple-700">{user?.role || 'USER'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-2">Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['content.read', 'settings.read', 'audit.read'].map(cap => (
                      <span key={cap} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-mono">{cap}</span>
                    ))}
                    {canApprove && ['content.write', 'users.write', 'github.pr.create'].map(cap => (
                      <span key={cap} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded border border-blue-100 font-mono">{cap}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                AI Council
              </h3>
              <p className="text-xs text-gray-500 mb-3">Multi-AI Orchestrator jako poradní vrstva.</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm p-2 rounded bg-gray-50">
                  <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-purple-500" /> Gemini</span>
                  <span className="text-emerald-600 font-medium text-xs">AGREES</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded bg-gray-50">
                  <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-blue-500" /> Grok</span>
                  <span className="text-emerald-600 font-medium text-xs">AGREES</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded bg-gray-50">
                  <span className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-orange-500" /> Claude</span>
                  <span className="text-gray-400 font-medium text-xs">PENDING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Approval Queue
            </h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-4 font-medium">Request</th>
                  <th className="p-4 font-medium">Actor</th>
                  <th className="p-4 font-medium">Risk</th>
                  <th className="p-4 font-medium">Backup</th>
                  <th className="p-4 font-medium">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">DATABASE MIGRATION</div>
                    <div className="text-xs text-gray-500">Přidání tabulky pro novou funkcionalitu</div>
                  </td>
                  <td className="p-4 text-gray-600">AI Copilot</td>
                  <td className="p-4"><span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-200">CRITICAL_MUTATION</span></td>
                  <td className="p-4 text-gray-500 text-xs">PG_DUMP Required</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-emerald-100">Approve</button>
                      <button className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100">Reject</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">PRODUCTION DEPLOY</div>
                    <div className="text-xs text-gray-500">Nasazení Fáze 3 do produkce</div>
                  </td>
                  <td className="p-4 text-gray-600">Admin</td>
                  <td className="p-4"><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs border border-orange-200">SENSITIVE_MUTATION</span></td>
                  <td className="p-4 text-gray-500 text-xs">VPS Snapshot</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-emerald-100">Approve</button>
                      <button className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100">Reject</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="text-center py-10">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Historie změn</h3>
            <p className="text-gray-500 mt-1 max-w-md mx-auto">
              Zde se zobrazuje neměnná auditní stopa všech Control Plane akcí, včetně Before/After diffů a provedených rollbacků.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
