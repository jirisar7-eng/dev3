import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '../../../utils/apiClient';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  Copy,
  Check,
  X,
  Info,
} from 'lucide-react';
import { AuditDocumentItem, AuditCenterStats, AuditCategoryType, AuditStatusType, AuditShareItem } from '../../../types';

interface AuditDocumentsCatalogProps {
  onSyncCompleted?: () => void;
}

export const AuditDocumentsCatalog: React.FC<AuditDocumentsCatalogProps> = ({ onSyncCompleted }) => {
  const [documents, setDocuments] = useState<AuditDocumentItem[]>([]);
  const [stats, setStats] = useState<AuditCenterStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Selected Document Modal
  const [selectedDoc, setSelectedDoc] = useState<AuditDocumentItem | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  // Share Modal
  const [sharingDoc, setSharingDoc] = useState<AuditDocumentItem | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState<boolean>(false);
  const [sharesList, setSharesList] = useState<AuditShareItem[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch audits list
  const fetchAudits = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (categoryFilter !== 'ALL') queryParams.set('category', categoryFilter);
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      queryParams.set('sortBy', sortBy);

      const res = await apiFetch(`/api/admin/audits?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success) {
        setDocuments(json.data || []);
        setStats(json.stats || null);
      } else {
        setError(json.error || 'Neplatná odpověď serveru.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [categoryFilter, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAudits();
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch('/api/admin/audits/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage(json.message);
        setStats(json.stats);
        await fetchAudits();
        if (onSyncCompleted) onSyncCompleted();
      } else {
        setError(json.error || 'Synchronizace selhala.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při spuštění synchronizace.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenDoc = async (doc: AuditDocumentItem) => {
    setSelectedDoc(doc);
    setLoadingContent(true);
    setDocContent('');
    try {
      const res = await apiFetch(`/api/admin/audits/${doc.id}`);
      const json = await res.json();
      if (json.success && json.audit) {
        setSelectedDoc(json.audit);
        setDocContent(json.audit.content || '');
      } else {
        setError(json.error || 'Chyba při načítání detailu auditu.');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst obsah auditního reportu.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleOpenShareModal = (doc: AuditDocumentItem) => {
    setSharingDoc(doc);
    setCreatedShareUrl(null);
    setSharesList(doc.shares || []);
  };

  const handleCreateShare = async (expiresDays: number = 30) => {
    if (!sharingDoc) return;
    setCreatingShare(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/audits/${sharingDoc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresDays }),
      });
      const json = await res.json();
      if (json.success && json.shareUrl) {
        setCreatedShareUrl(json.shareUrl);
        setSharesList((prev) => [json.share, ...prev]);
      } else {
        setError(json.error || 'Vytvoření odkazu selhalo.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při generování sdílecího odkazu.');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadMarkdown = (doc: AuditDocumentItem, content: string) => {
    const filename = doc.sourcePath ? doc.sourcePath.split('/').pop() || `${doc.id}.md` : `${doc.id}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            PASS
          </span>
        );
      case 'WARNING':
      case 'PASS_WITH_WARNINGS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            WARNINGS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            FAIL
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-500" />
            INFO
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            UNKNOWN
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      SECURITY: 'bg-rose-50 text-rose-700 border-rose-200',
      ARCHITECTURE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      MIGRATION: 'bg-purple-50 text-purple-700 border-purple-200',
      RELEASE_GATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      QA: 'bg-orange-50 text-orange-700 border-orange-200',
      QA_REGRESSION: 'bg-orange-50 text-orange-700 border-orange-200',
      DATA: 'bg-blue-50 text-blue-700 border-blue-200',
      DATA_INTEGRITY: 'bg-blue-50 text-blue-700 border-blue-200',
      GENERAL: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
          colors[category] || colors.GENERAL
        }`}
      >
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat v auditních reportech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="px-2 text-slate-500">Kategorie:</span>
            {['ALL', 'SECURITY', 'ARCHITECTURE', 'RELEASE_GATE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
            title="Synchronizovat markdown soubory z docs/audit/ do DB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizuji...' : 'Sync z disku'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Archivované auditní reporty ({documents.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Načítám katalog auditních dokumentů...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Žádné auditní dokumenty neodpovídají zadaným kritériím.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Název & Cesta</th>
                  <th className="px-4 py-3">Kategorie</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(doc.status)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-slate-500 font-mono text-[11px] truncate max-w-sm">
                        {doc.sourcePath || doc.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getCategoryBadge(doc.category)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {doc.auditDate ? new Date(doc.auditDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Zobrazit</span>
                        </button>
                        <button
                          onClick={() => handleOpenShareModal(doc)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Sdílet audit"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedDoc.status)}
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedDoc.title}</h3>
                  <div className="text-xs text-slate-500 font-mono">{selectedDoc.sourcePath || selectedDoc.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'preview' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Náhled
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'raw' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Raw MD
                  </button>
                </div>
                <button
                  onClick={() => handleDownloadMarkdown(selectedDoc, docContent)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="Stáhnout markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="Vytisknout / PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {loadingContent ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                  Načítám obsah zprávy...
                </div>
              ) : viewMode === 'preview' ? (
                <div className="prose prose-slate max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-slate-900 prose-pre:bg-slate-900 prose-pre:text-slate-100">
                  <ReactMarkdown>{docContent || '_Žádný obsah reportu._'}</ReactMarkdown>
                </div>
              ) : (
                <pre className="font-mono bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                  {docContent}
                </pre>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div>Typ: {selectedDoc.category}</div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Sdílet auditní report</span>
              </h3>
              <button onClick={() => setSharingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Vytvořit časově omezený odkaz pro náhled auditu <strong>{sharingDoc.title}</strong> bez nutnosti
              přihlášení.
            </div>

            {!createdShareUrl ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleCreateShare(30)}
                  disabled={creatingShare}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {creatingShare ? 'Generuji...' : 'Vygenerovat odkaz (platnost 30 dní)'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] break-all text-slate-800">
                  {window.location.origin + createdShareUrl}
                </div>
                <button
                  onClick={() => handleCopy(window.location.origin + createdShareUrl)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Zkopírováno!' : 'Kopírovat odkaz'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
