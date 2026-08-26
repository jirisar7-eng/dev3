import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
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
  ExternalLink,
  Clock,
  GitBranch,
  GitCommit,
  User,
  X,
  Lock,
  Calendar,
  Layers,
} from 'lucide-react';
import { AuditDocumentItem, AuditCenterStats, AuditCategoryType, AuditStatusType, AuditShareItem } from '../../types';

export const AuditCenter: React.FC = () => {
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
  const [copiedContent, setCopiedContent] = useState<boolean>(false);

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

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAudits();
  };

  // Synchronize audits from filesystem
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
      } else {
        setError(json.error || 'Synchronizace selhala.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při spuštění synchronizace.');
    } finally {
      setSyncing(false);
    }
  };

  // Open Document detail modal and fetch raw content
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

  // Open Share modal
  const handleOpenShareModal = (doc: AuditDocumentItem) => {
    setSharingDoc(doc);
    setCreatedShareUrl(null);
    setSharesList(doc.shares || []);
  };

  // Create new share link
  const handleCreateShare = async (expiresDays: number = 30) => {
    if (!sharingDoc) return;
    setCreatingShare(true);
    try {
      const res = await apiFetch(`/api/admin/audits/${sharingDoc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessMode: 'SHARED_LINK', expiresDays }),
      });
      const json = await res.json();
      if (json.success && json.shareUrl) {
        const fullUrl = `${window.location.origin}${json.shareUrl}`;
        setCreatedShareUrl(fullUrl);
        if (json.shareRecord) {
          setSharesList((prev) => [json.shareRecord, ...prev]);
        }
      } else {
        setError(json.error || 'Vytvoření sdíleného odkazu selhalo.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při generování sdíleného odkazu.');
    } finally {
      setCreatingShare(false);
    }
  };

  // Revoke share link
  const handleRevokeShare = async (shareId: string) => {
    try {
      const res = await apiFetch(`/api/admin/audits/shares/${shareId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSharesList((prev) => prev.filter((s) => s.id !== shareId));
      } else {
        setError(json.error || 'Zrušení odkazu selhalo.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při zrušení sdíleného odkazu.');
    }
  };

  // Download Markdown file
  const handleDownloadMd = (doc: AuditDocumentItem) => {
    window.open(`/api/admin/audits/${doc.id}/download`, '_blank');
  };

  // Open PDF / Print View
  const handleOpenPdf = (doc: AuditDocumentItem) => {
    window.open(`/api/admin/audits/${doc.id}/pdf`, '_blank');
  };

  // Copy share link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copy markdown content to clipboard
  const copyMarkdownContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>WARNING</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>FAIL</span>
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>INFO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>NEUVEDENO</span>
          </span>
        );
    }
  };

  // Category Badge Component
  const renderCategoryBadge = (category: string) => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                AUDIT CENTER DEV3
              </span>
              <span className="text-xs text-slate-400 font-mono">audits/ & docs/audit/</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Centrální správa auditních reportů
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Automatické vyhledávání, bezpečná archivace, stahování (MD/PDF) a tokenové sdílení všech systémových a bezpečnostních auditů.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all shadow-md flex items-center gap-2 border border-blue-400 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizuji...' : 'Synchronizovat z Git'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Overview Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Celkem auditů</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stats.total}</span>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
            <span className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> STAV: PASS
            </span>
            <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">{stats.passCount}</span>
          </div>

          <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-4 shadow-xs">
            <span className="text-amber-700 text-[11px] font-bold uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> STAV: WARNING
            </span>
            <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">{stats.warningCount}</span>
          </div>

          <div className="bg-rose-50/60 rounded-2xl border border-rose-200/80 p-4 shadow-xs">
            <span className="text-rose-700 text-[11px] font-bold uppercase tracking-wider block flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> STAV: FAIL
            </span>
            <span className="text-2xl font-black text-rose-900 font-mono mt-1 block">{stats.failCount}</span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-slate-600 text-[11px] font-bold uppercase tracking-wider block flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> NEUVEDENO / INFO
            </span>
            <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">{stats.unknownCount}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat podle náznaku, cesty souboru, autora..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category selector */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="ALL">Všechny kategorie</option>
              <option value="SECURITY">SECURITY (Bezpečnost)</option>
              <option value="REGISTRY">REGISTRY (Registr)</option>
              <option value="CONTENT">CONTENT (Obsah)</option>
              <option value="CMS">CMS (Puck)</option>
              <option value="ARCHITECTURE">ARCHITECTURE (Architektura)</option>
              <option value="DATA">DATA (Databáze)</option>
              <option value="QA">QA (Testování)</option>
              <option value="PERFORMANCE">PERFORMANCE (Výkon)</option>
              <option value="LEGAL">LEGAL (e-Sbírka)</option>
              <option value="RESEARCH">RESEARCH (Výzkum)</option>
              <option value="OTHER">OTHER (Ostatní)</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="ALL">Všechny stavy</option>
              <option value="PASS">PASS</option>
              <option value="WARNING">WARNING</option>
              <option value="FAIL">FAIL</option>
              <option value="INFO">INFO</option>
              <option value="UNKNOWN">NEUVEDENO</option>
            </select>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="newest">Nejnovější</option>
              <option value="oldest">Nejstarší</option>
              <option value="title">Abecedně (Název)</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              Hledat
            </button>
          </div>
        </form>
      </div>

      {/* Audit List Table / Cards */}
      {loading ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-semibold">Načítám auditní dokumenty...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nebyly nalezeny žádné auditní zprávy</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Zkontrolujte zvolené filtry nebo spusťte synchronizaci repozitáře kliknutím na tlačítko "Synchronizovat z Git".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderStatusBadge(doc.status)}
                  {renderCategoryBadge(doc.category)}
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {doc.sourcePath}
                  </span>
                </div>

                <h3
                  onClick={() => handleOpenDoc(doc)}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {doc.title}
                </h3>

                {doc.summary && (
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                    {doc.summary}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {doc.auditDate || 'Neuvedeno'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {doc.author || 'Neuvedeno'}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-slate-400" />
                    {doc.commitSha ? doc.commitSha.slice(0, 8) : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-slate-400" />
                    {doc.branch || 'main'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  onClick={() => handleOpenDoc(doc)}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Prohlédnout</span>
                </button>

                <button
                  onClick={() => handleDownloadMd(doc)}
                  title="Stáhnout Markdown (.md)"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenPdf(doc)}
                  title="Tisk / Export PDF"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenShareModal(doc)}
                  title="Sdílet přes bezpečný odkaz"
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all border border-blue-200 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {renderStatusBadge(selectedDoc.status)}
                  {renderCategoryBadge(selectedDoc.category)}
                  <span className="text-xs font-mono text-slate-400">{selectedDoc.sourcePath}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{selectedDoc.title}</h2>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Metadata Strip */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap font-mono">
                <span><strong>Datum:</strong> {selectedDoc.auditDate || 'Neuvedeno'}</span>
                <span><strong>Autor:</strong> {selectedDoc.author || 'Neuvedeno'}</span>
                <span><strong>Commit:</strong> {selectedDoc.commitSha ? selectedDoc.commitSha.slice(0, 8) : 'N/A'}</span>
                <span><strong>Větev:</strong> {selectedDoc.branch || 'main'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  👁️ Náhled
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'raw' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  📝 Raw Markdown
                </button>
              </div>
            </div>

            {/* Modal Body / Markdown Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {loadingContent ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500 font-semibold">Načítám obsah souboru...</p>
                </div>
              ) : viewMode === 'preview' ? (
                <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
                  <ReactMarkdown>{docContent}</ReactMarkdown>
                </div>
              ) : (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {docContent}
                </pre>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => copyMarkdownContent(docContent)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300 transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiedContent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedContent ? 'Zkopírováno!' : 'Kopírovat Markdown'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadMd(selectedDoc)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Stáhnout MD</span>
                </button>

                <button
                  onClick={() => handleOpenPdf(selectedDoc)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Tisk / PDF</span>
                </button>

                <button
                  onClick={() => {
                    const d = selectedDoc;
                    setSelectedDoc(null);
                    handleOpenShareModal(d);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Sdílet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {sharingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider block w-fit mb-1">
                  BEZPEČNÉ SDÍLENÍ AUDITU
                </span>
                <h3 className="text-lg font-bold text-slate-900">{sharingDoc.title}</h3>
              </div>

              <button
                onClick={() => setSharingDoc(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Vygenerujte bezpečný, kryptograficky podepsaný token pro sdílení tohoto auditního reportu bez nutnosti udělovat plný admin přístup.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCreateShare(30)}
                  disabled={creatingShare}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{creatingShare ? 'Generuji...' : 'Vygenerovat odkaz (30 dní)'}</span>
                </button>
              </div>

              {createdShareUrl && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 block">Váš nový sdílený odkaz:</span>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-200 text-xs font-mono">
                    <input
                      type="text"
                      readOnly
                      value={createdShareUrl}
                      className="w-full bg-transparent outline-none text-slate-800"
                    />
                    <button
                      onClick={() => copyToClipboard(createdShareUrl)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-500 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Kopírováno' : 'Kopírovat'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Shares List */}
              {sharesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block">Aktivní sdílené odkazy ({sharesList.length}):</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {sharesList.map((share) => (
                      <div
                        key={share.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3 font-mono"
                      >
                        <div className="truncate">
                          <span className="text-slate-900 font-bold block truncate">
                            {share.shareUrl || `/audit/share/${share.rawToken || 'token'}`}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Vytvořeno: {new Date(share.createdAt).toLocaleDateString('cs-CZ')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px] hover:bg-rose-200 transition-all cursor-pointer shrink-0"
                        >
                          Zrušit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
