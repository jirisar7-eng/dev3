import React, { useEffect, useState } from 'react';
import { ComplianceDoc, LegalDocument, LegalDocumentVersion, ConsentRecord, LegalDocStatus } from '../../types';
import { ShieldCheck, FileText, GitBranch, CheckCircle2, Settings, Plus, Eye, Check, X, Search, Filter, History, Calendar, AlertCircle } from 'lucide-react';

export const ComplianceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docs' | 'versions' | 'consents' | 'settings'>('docs');
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [selectedDocKey, setSelectedDocKey] = useState<string>('terms');
  const [selectedDocDetail, setSelectedDocDetail] = useState<LegalDocument | null>(null);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [consentFilterKey, setConsentFilterKey] = useState<string>('all');
  const [consentSearchUser, setConsentSearchUser] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showNewDocModal, setShowNewDocModal] = useState<boolean>(false);
  const [newDocData, setNewDocData] = useState({
    key: '',
    title: '',
    type: 'TERMS',
    description: '',
    initialVersion: '1.0.0',
    initialContent: '',
  });

  const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false);
  const [newVersionData, setNewVersionData] = useState({
    version: '',
    content: '',
    status: 'PUBLISHED' as LegalDocStatus,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [inspectVersion, setInspectVersion] = useState<LegalDocumentVersion | null>(null);

  // Settings state
  const [complianceSettings, setComplianceSettings] = useState({
    requireConsentOnRegister: true,
    showCookieBanner: true,
    autoArchivePreviousVersions: true,
    allowUserRevokeConsent: false,
  });

  const fetchDocsSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance/docs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocs(data);
      }
    } catch (err) {
      console.error('Error fetching compliance docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocDetail = async (key: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/compliance/docs/${key}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDocDetail(data);
      }
    } catch (err) {
      console.error('Error fetching doc detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance/consent');
      if (res.ok) {
        const data = await res.json();
        setConsents(data);
      }
    } catch (err) {
      console.error('Error fetching consents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocsSummary();
    fetchConsents();
  }, []);

  useEffect(() => {
    if (selectedDocKey) {
      fetchDocDetail(selectedDocKey);
    }
  }, [selectedDocKey]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/compliance/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDocData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při vytváření dokumentu');

      setMessage({ type: 'success', text: `Dokument '${data.title}' [${data.key}] byl úspěšně vytvořen.` });
      setShowNewDocModal(false);
      setNewDocData({ key: '', title: '', type: 'TERMS', description: '', initialVersion: '1.0.0', initialContent: '' });
      await fetchDocsSummary();
      setSelectedDocKey(data.key);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch(`/api/compliance/docs/${selectedDocKey}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVersionData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při vytváření verze');

      setMessage({ type: 'success', text: `Nová verze v${data.version} byla úspěšně přidána.` });
      setShowNewVersionModal(false);
      await fetchDocsSummary();
      await fetchDocDetail(selectedDocKey);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    try {
      setMessage(null);
      const res = await fetch(`/api/compliance/versions/${versionId}/publish`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při publikaci verze');

      setMessage({ type: 'success', text: `Verze v${data.version} je nyní PUBLIKOVANÁ.` });
      await fetchDocsSummary();
      await fetchDocDetail(selectedDocKey);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeactivateVersion = async (versionId: string) => {
    try {
      setMessage(null);
      const res = await fetch(`/api/compliance/versions/${versionId}/deactivate`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při deaktivaci verze');

      setMessage({ type: 'success', text: `Verze v${data.version} byla archivována.` });
      await fetchDocsSummary();
      await fetchDocDetail(selectedDocKey);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredConsents = consents.filter((c) => {
    const matchesKey = consentFilterKey === 'all' || c.docKey === consentFilterKey;
    const matchesUser =
      !consentSearchUser ||
      (c.userEmail && c.userEmail.toLowerCase().includes(consentSearchUser.toLowerCase())) ||
      c.userId.toLowerCase().includes(consentSearchUser.toLowerCase());
    return matchesKey && matchesUser;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px] tracking-wider uppercase">
              Administrace
            </span>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-600">Compliance Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <ShieldCheck className="w-7 h-7 text-blue-900" />
            Compliance Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Správa právních dokumentů, verzování, uživatelských souhlasů a právního nastavení portálu.
          </p>
        </div>

        {activeTab === 'docs' && (
          <button
            onClick={() => setShowNewDocModal(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Vytvořit dokument
          </button>
        )}

        {activeTab === 'versions' && (
          <button
            onClick={() => {
              const currentVer = selectedDocDetail?.versions?.[0]?.version || '1.0.0';
              const parts = currentVer.split('.');
              const nextVer = parts.length === 3 ? `${parts[0]}.${parseInt(parts[1]) + 1}.0` : `${currentVer}.1`;
              setNewVersionData({
                version: nextVer,
                content: selectedDocDetail?.currentVersion?.content || '',
                status: 'PUBLISHED',
                effectiveDate: new Date().toISOString().split('T')[0],
              });
              setShowNewVersionModal(true);
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Vytvořit novou verzi
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'docs'
              ? 'border-blue-900 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Dokumenty ({docs.length})
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'versions'
              ? 'border-blue-900 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Verze a historie
        </button>

        <button
          onClick={() => setActiveTab('consents')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'consents'
              ? 'border-blue-900 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Souhlasy ({consents.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-blue-900 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Nastavení
        </button>
      </div>

      {/* TAB 1: DOKUMENTY */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Správa základních dokumentů</h3>
              <p className="text-xs text-slate-500">Seznam aktuálních právních dokumentů a předpisů portálu</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-slate-200 text-slate-700 rounded-md">
              Aktivních: {docs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Klíč (Key)</th>
                  <th className="p-3.5">Název dokumentu</th>
                  <th className="p-3.5">Typ</th>
                  <th className="p-3.5">Aktuální verze</th>
                  <th className="p-3.5">Stav</th>
                  <th className="p-3.5">Datum účinnosti</th>
                  <th className="p-3.5 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {docs.map((doc) => (
                  <tr key={doc.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600 font-medium">{doc.key}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{doc.title}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-mono text-[10px] font-semibold border border-blue-200">
                        {doc.type || 'TERMS'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">v{doc.version}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3" />
                        PUBLIKOVONO
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(doc.effectiveDate).toLocaleDateString('cs-CZ')}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDocKey(doc.key);
                          setActiveTab('versions');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Verze & Historie
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VERZE */}
      {activeTab === 'versions' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Document selector sidebar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1 h-fit">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
              Vyberte dokument
            </span>
            {docs.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDocKey(d.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  selectedDocKey === d.key
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{d.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  selectedDocKey === d.key ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  v{d.version}
                </span>
              </button>
            ))}
          </div>

          {/* Versions list & history table */}
          <div className="lg:col-span-3 space-y-6">
            {selectedDocDetail ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-900 uppercase">
                      Klíč: {selectedDocDetail.key}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{selectedDocDetail.title}</h2>
                    <p className="text-xs text-slate-500">{selectedDocDetail.description || 'Správa verzí a publikování.'}</p>
                  </div>
                  <button
                    onClick={() => {
                      const currentVer = selectedDocDetail.versions?.[0]?.version || '1.0.0';
                      const parts = currentVer.split('.');
                      const nextVer = parts.length === 3 ? `${parts[0]}.${parseInt(parts[1]) + 1}.0` : `${currentVer}.1`;
                      setNewVersionData({
                        version: nextVer,
                        content: selectedDocDetail.currentVersion?.content || '',
                        status: 'PUBLISHED',
                        effectiveDate: new Date().toISOString().split('T')[0],
                      });
                      setShowNewVersionModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Přidat novou verzi
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Historie verzí (Verzování je neměnné)
                  </h3>

                  <div className="space-y-4">
                    {selectedDocDetail.versions && selectedDocDetail.versions.length > 0 ? (
                      selectedDocDetail.versions.map((ver) => (
                        <div
                          key={ver.id}
                          className={`p-4 rounded-xl border transition-all ${
                            ver.status === 'PUBLISHED'
                              ? 'border-emerald-300 bg-emerald-50/30'
                              : ver.status === 'DRAFT'
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                                v{ver.version}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  ver.status === 'PUBLISHED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : ver.status === 'DRAFT'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {ver.status}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                Účinnost od: {new Date(ver.effectiveDate).toLocaleDateString('cs-CZ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setInspectVersion(ver)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                Zobrazit obsah
                              </button>

                              {ver.status !== 'PUBLISHED' && (
                                <button
                                  onClick={() => handlePublishVersion(ver.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Publikovat
                                </button>
                              )}

                              {ver.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => handleDeactivateVersion(ver.id)}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold"
                                >
                                  Deaktivovat / Archivovat
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 line-clamp-3 font-sans leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-100">
                            {ver.content}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Žádné verze k dispozici.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Načítám detail dokumentu...</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SOUHLASY */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registr souhlasů uživatelů</h3>
              <p className="text-xs text-slate-500">Přezkum historie potvrzení právních dokumentů a nařízení GDPR</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Filter by document */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={consentFilterKey}
                  onChange={(e) => setConsentFilterKey(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">Všechny dokumenty</option>
                  {docs.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.title} ({d.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search user */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Hledat e-mail uživatele..."
                  value={consentSearchUser}
                  onChange={(e) => setConsentSearchUser(e.target.value)}
                  className="bg-transparent focus:outline-none text-slate-700 placeholder-slate-400 w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Uživatel</th>
                  <th className="p-3">Dokument</th>
                  <th className="p-3">Verze</th>
                  <th className="p-3">Stav souhlasu</th>
                  <th className="p-3">Datum a čas</th>
                  <th className="p-3">IP Adresa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredConsents.length > 0 ? (
                  filteredConsents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        {c.userEmail || c.userName || c.userId}
                      </td>
                      <td className="p-3 font-mono text-blue-900 font-medium">{c.docKey}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">v{c.docVersion}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {c.status === 'ACCEPTED' ? 'POTVRZENO' : 'ODVOLÁNO'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(c.consentedAt).toLocaleString('cs-CZ')}</td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">{c.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Žádné záznamy o souhlasech nenalezeny.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NASTAVENÍ */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Právní nastavení & Compliance pravidla</h3>
            <p className="text-xs text-slate-500">Konfigurace systémových mechanismů pro udělování souhlasů</p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Vyžadovat souhlas při registraci</span>
                <span className="text-[11px] text-slate-500">
                  Uživatel musí při vytváření účtu výslovně potvrdit Podmínky užívání a GDPR.
                </span>
              </div>
              <input
                type="checkbox"
                checked={complianceSettings.requireConsentOnRegister}
                onChange={(e) =>
                  setComplianceSettings({ ...complianceSettings, requireConsentOnRegister: e.target.checked })
                }
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Aktivovat Cookie lištu na veřejném webu</span>
                <span className="text-[11px] text-slate-500">Zobrazovat oznámení o používání technických cookies.</span>
              </div>
              <input
                type="checkbox"
                checked={complianceSettings.showCookieBanner}
                onChange={(e) =>
                  setComplianceSettings({ ...complianceSettings, showCookieBanner: e.target.checked })
                }
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Automatická archivace předchozích verzí</span>
                <span className="text-[11px] text-slate-500">
                  Při publikaci nové verze dokumentu automaticky převést starší publikovanou verzi na ARCHIVED.
                </span>
              </div>
              <input
                type="checkbox"
                checked={complianceSettings.autoArchivePreviousVersions}
                onChange={(e) =>
                  setComplianceSettings({ ...complianceSettings, autoArchivePreviousVersions: e.target.checked })
                }
                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nový Dokument */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Vytvořit nový compliance dokument</h3>
              <button onClick={() => setShowNewDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unikátní klíč (Slug/Key):</label>
                <input
                  type="text"
                  required
                  placeholder="např. volunteer_code"
                  value={newDocData.key}
                  onChange={(e) => setNewDocData({ ...newDocData, key: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Název dokumentu:</label>
                <input
                  type="text"
                  required
                  placeholder="např. Dobrovolnický a mentorský kodex"
                  value={newDocData.title}
                  onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Typ dokumentu:</label>
                  <select
                    value={newDocData.type}
                    onChange={(e) => setNewDocData({ ...newDocData, type: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="TERMS">TERMS (Podmínky)</option>
                    <option value="PRIVACY">PRIVACY (GDPR)</option>
                    <option value="COOKIES">COOKIES (Cookies)</option>
                    <option value="LEGAL">LEGAL (Právní výhrada)</option>
                    <option value="VOLUNTEER_CODE">VOLUNTEER_CODE (Kodex)</option>
                    <option value="AI_STATEMENT">AI_STATEMENT (AI Prohlášení)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Počáteční verze:</label>
                  <input
                    type="text"
                    value={newDocData.initialVersion}
                    onChange={(e) => setNewDocData({ ...newDocData, initialVersion: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stručný popis:</label>
                <input
                  type="text"
                  placeholder="Popis účelu dokumentu..."
                  value={newDocData.description}
                  onChange={(e) => setNewDocData({ ...newDocData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Počáteční textový obsah:</label>
                <textarea
                  rows={5}
                  value={newDocData.initialContent}
                  onChange={(e) => setNewDocData({ ...newDocData, initialContent: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-semibold shadow-xs"
                >
                  Vytvořit dokument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nová Verze */}
      {showNewVersionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-900 uppercase">
                  Dokument: {selectedDocKey}
                </span>
                <h3 className="text-base font-bold text-slate-900">Vytvořit novou verzi dokumentu</h3>
              </div>
              <button onClick={() => setShowNewVersionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Číslo verze (SemVer):</label>
                  <input
                    type="text"
                    required
                    placeholder="1.1.0"
                    value={newVersionData.version}
                    onChange={(e) => setNewVersionData({ ...newVersionData, version: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stav verze:</label>
                  <select
                    value={newVersionData.status}
                    onChange={(e) =>
                      setNewVersionData({ ...newVersionData, status: e.target.value as LegalDocStatus })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="PUBLISHED">PUBLISHED (Ihned publikovat)</option>
                    <option value="DRAFT">DRAFT (Uložit jako koncept)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kompletní znění nové verze:</label>
                <textarea
                  required
                  rows={10}
                  value={newVersionData.content}
                  onChange={(e) => setNewVersionData({ ...newVersionData, content: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-semibold shadow-xs"
                >
                  Uložit novou verzi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Náhled Historické Verze */}
      {inspectVersion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-900">v{inspectVersion.version}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inspectVersion.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inspectVersion.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {inspectVersion.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Náhled historie verze</h3>
              </div>
              <button onClick={() => setInspectVersion(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2 text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="whitespace-pre-wrap font-sans">{inspectVersion.content}</div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setInspectVersion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
