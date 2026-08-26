import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Study, StudyStatus } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Archive,
  ExternalLink,
  ShieldCheck,
  Tag,
  Calendar,
  User,
  Filter,
} from 'lucide-react';

export const StudyManager: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Study>>({
    title: '',
    originalTitle: '',
    slug: '',
    authors: '',
    publicationYear: new Date().getFullYear(),
    publisher: '',
    doi: '',
    sourceUrl: '',
    abstract: '',
    summary: '',
    methodology: '',
    findings: '',
    limitations: '',
    relevance: '',
    keywords: '',
    category: 'stridava_pece',
    status: 'DRAFT',
    featured: false,
    pdfUrl: '',
    pdfMediaId: '',
    pdfSize: 0,
  });

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const token = localStorage.getItem('tatovacesta_token');

  const fetchStudies = async () => {
    setLoading(true);
    try {
      let url = '/api/cms/studies';
      const params: string[] = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (categoryFilter !== 'ALL') params.push(`category=${categoryFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await apiFetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudies(data);
      }
    } catch (err) {
      console.error('Chyba při načítání studií:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [search, statusFilter, categoryFilter]);

  const handleOpenCreate = () => {
    setSelectedStudy(null);
    setFormData({
      title: '',
      originalTitle: '',
      slug: '',
      authors: '',
      publicationYear: new Date().getFullYear(),
      publisher: '',
      doi: '',
      sourceUrl: '',
      abstract: '',
      summary: '',
      methodology: '',
      findings: '',
      limitations: '',
      relevance: '',
      keywords: '',
      category: 'stridava_pece',
      status: 'DRAFT',
      featured: false,
      pdfUrl: '',
      pdfMediaId: '',
      pdfSize: 0,
    });
    setUploadError('');
    setUploadSuccess('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (study: Study) => {
    setSelectedStudy(study);
    setFormData({ ...study });
    setUploadError('');
    setUploadSuccess('');
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (study: Study) => {
    setSelectedStudy(study);
    setIsPreviewModalOpen(true);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Vyberte prosím platný PDF soubor.');
      return;
    }

    setUploadingPdf(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await apiFetch('/api/cms/studies/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64,
            mimeType: 'application/pdf',
            size: file.size,
          }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setFormData((prev) => ({
            ...prev,
            pdfUrl: data.url,
            pdfMediaId: data.mediaId,
            pdfSize: data.size,
          }));
          setUploadSuccess('PDF bylo úspěšně zkontrolováno ClamAV (CLEAN) a uloženo do MinIO.');
        } else {
          setUploadError(data.error || 'Nahrání PDF selhalo.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Chyba při nahrávání souboru: ' + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.authors) {
      alert('Název a autoři jsou povinné údaje.');
      return;
    }

    try {
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || 'studie'),
        publicationYear: formData.publicationYear ? Number(formData.publicationYear) : undefined,
      };

      const url = selectedStudy ? `/api/cms/studies/${selectedStudy.id}` : '/api/cms/studies';
      const method = selectedStudy ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchStudies();
      } else {
        const errData = await res.json();
        alert('Chyba uložení: ' + (errData.error || 'Neznámá chyba'));
      }
    } catch (err: any) {
      alert('Chyba komunikace s API: ' + err.message);
    }
  };

  const handleStatusChange = async (study: Study, newStatus: StudyStatus) => {
    try {
      const res = await apiFetch(`/api/cms/studies/${study.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStudies();
      }
    } catch (err) {
      console.error('Chyba změny stavu:', err);
    }
  };

  const handleDelete = async (study: Study) => {
    if (!confirm(`Opravdu chcete odstranit vědeckou studii "${study.title}"?`)) return;

    try {
      const res = await apiFetch(`/api/cms/studies/${study.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchStudies();
      }
    } catch (err) {
      console.error('Chyba mazání:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Knihovna vědeckých studií (CMS)
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Správa vědeckých publikací, výzkumných dat a PDF dokumentů o opatrovnictví a střídavé péči.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Přidat studii
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hledat v náznazích, autorech, klíčových slovech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Stav:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Všechny stavy</option>
              <option value="DRAFT">Koncept (DRAFT)</option>
              <option value="PUBLISHED">Publikováno (PUBLISHED)</option>
              <option value="ARCHIVED">Archivováno (ARCHIVED)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Kategorie:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Všechny kategorie</option>
              <option value="stridava_pece">Střídavá péče</option>
              <option value="pripoutaci_vazba">Citová vazba (Attachment)</option>
              <option value="konflikt_rodicu">Rodičovský konflikt</option>
              <option value="soudni_praxe">Soudní praxe & OSPOD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Studies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Načítám knihovnu studií...</div>
        ) : studies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nebyly nalezeny žádné vědecké studie odpovídající zadaným filtrům.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Název studie</th>
                  <th className="py-3 px-4">Autoři</th>
                  <th className="py-3 px-4">Rok</th>
                  <th className="py-3 px-4">Kategorie</th>
                  <th className="py-3 px-4">Stav</th>
                  <th className="py-3 px-4">PDF Dokument</th>
                  <th className="py-3 px-4">Datum aktualizace</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {studies.map((study) => (
                  <tr key={study.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <div>{study.title}</div>
                      {study.originalTitle && (
                        <div className="text-[11px] text-slate-500 font-normal italic truncate mt-0.5">
                          {study.originalTitle}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs">{study.authors}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {study.publicationYear || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {study.category === 'stridava_pece'
                          ? 'Střídavá péče'
                          : study.category === 'pripoutaci_vazba'
                          ? 'Citová vazba'
                          : study.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {study.status === 'PUBLISHED' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          PUBLISHED
                        </span>
                      )}
                      {study.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
                          <XCircle className="w-3 h-3 text-amber-600" />
                          DRAFT
                        </span>
                      )}
                      {study.status === 'ARCHIVED' && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-0.5 rounded-full font-extrabold text-[11px]">
                          <Archive className="w-3 h-3 text-slate-500" />
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {study.pdfUrl ? (
                        <a
                          href={study.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          PDF (MinIO)
                        </a>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Chybí PDF</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(study.updatedAt).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenPreview(study)}
                        title="Náhled"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(study)}
                        title="Upravit"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {study.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handleStatusChange(study, 'PUBLISHED')}
                          title="Publikovat"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {study.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleStatusChange(study, 'ARCHIVED')}
                          title="Archivovat"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(study)}
                        title="Odstranit"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 my-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {selectedStudy ? 'Upravit vědeckou studii' : 'Přidat novou vědeckou studii'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-800">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Český název studie *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={handleTitleChange}
                    placeholder="např. Frekvence přespávání kojenců u otců v rámci střídavé péče"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Původní originální název (EN)</label>
                  <input
                    type="text"
                    value={formData.originalTitle || ''}
                    onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })}
                    placeholder="Should Infants and Toddlers Have Frequent Overnight..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Slug (SEO)</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="fabricius-warshak-2017-prespavani"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Autoři *</label>
                  <input
                    type="text"
                    required
                    value={formData.authors || ''}
                    onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                    placeholder="William V. Fabricius, Go Woon Suh, Richard A. Warshak"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rok publikace</label>
                    <input
                      type="number"
                      value={formData.publicationYear || ''}
                      onChange={(e) => setFormData({ ...formData, publicationYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategorie</label>
                    <select
                      value={formData.category || 'stridava_pece'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="stridava_pece">Střídavá péče</option>
                      <option value="pripoutaci_vazba">Citová vazba (Attachment)</option>
                      <option value="konflikt_rodicu">Rodičovský konflikt</option>
                      <option value="soudni_praxe">Soudní praxe & OSPOD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vydavatel / Časopis</label>
                  <input
                    type="text"
                    value={formData.publisher || ''}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Psychology, Public Policy, and Law (APA)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DOI kód</label>
                  <input
                    type="text"
                    value={formData.doi || ''}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    placeholder="10.1037/law0000108"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Odkaz na původní zdroj (Source URL)</label>
                  <input
                    type="url"
                    value={formData.sourceUrl || ''}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder="https://doi.org/10.1037/law0000108"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Status & Options */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">Stav publikace:</span>
                  <select
                    value={formData.status || 'DRAFT'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudyStatus })}
                    className="bg-white border border-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DRAFT">Koncept (DRAFT)</option>
                    <option value="PUBLISHED">Publikováno (PUBLISHED)</option>
                    <option value="ARCHIVED">Archivováno (ARCHIVED)</option>
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Zobrazit jako Doporučenou studii
                </label>
              </div>

              {/* PDF Upload Section */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    PDF Dokument (MinIO / S3 s kontrolou ClamAV)
                  </span>
                  {formData.pdfUrl && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ PDF nahráno
                    </span>
                  )}
                </div>

                {formData.pdfUrl && (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-200 text-xs">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-slate-700 text-[11px] truncate flex-1">{formData.pdfUrl}</span>
                    <a
                      href={formData.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Otevřít
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingPdf ? 'Nahrávám a kontroluji PDF...' : 'Nahrát / Nahradit PDF z počítače'}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfFileUpload}
                      disabled={uploadingPdf}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">MIME: application/pdf | max 50 MB</span>
                </div>

                {uploadError && <div className="text-rose-600 text-xs font-bold">{uploadError}</div>}
                {uploadSuccess && <div className="text-emerald-700 text-xs font-bold">{uploadSuccess}</div>}
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Abstrakt (Abstrakt studie)</label>
                  <textarea
                    rows={3}
                    value={formData.abstract || ''}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    placeholder="Stručný oficiální abstrakt studie..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shrnutí pro praxi (Summary)</label>
                  <textarea
                    rows={3}
                    value={formData.summary || ''}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Srozumitelné shrnutí hlavních myšlenek..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metodologie (Methodology)</label>
                  <textarea
                    rows={2}
                    value={formData.methodology || ''}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                    placeholder="Popis výzkumného vzorku, metod a longitudinálního sledování..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hlavní zjištění (Findings)</label>
                  <textarea
                    rows={4}
                    value={formData.findings || ''}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="1. Klíčový výsledek...\n2. Další zjištění..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Omezení studie (Limitations)</label>
                    <textarea
                      rows={2}
                      value={formData.limitations || ''}
                      onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                      placeholder="Identifikovaná metodologická omezení..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relevance pro soudy / OSPOD</label>
                    <textarea
                      rows={2}
                      value={formData.relevance || ''}
                      onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
                      placeholder="Doporučení pro rozhodování soudů a znalecké posudky..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Klíčová slova (Keywords, oddělená čárkou)</label>
                  <input
                    type="text"
                    value={formData.keywords || ''}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="střídavá péče, přespávání kojenců, vazba s otcem, rodičovský konflikt"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-100"
                >
                  {selectedStudy ? 'Uložit změny' : 'Vytvořit studii'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedStudy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 my-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  {selectedStudy.category}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedStudy.title}</h3>
                {selectedStudy.originalTitle && (
                  <p className="text-xs text-slate-500 italic mt-0.5">{selectedStudy.originalTitle}</p>
                )}
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 block">Autoři:</span>
                  <span className="font-bold text-slate-900">{selectedStudy.authors}</span>
                </div>
                {selectedStudy.publicationYear && (
                  <div>
                    <span className="font-bold text-slate-500 block">Rok:</span>
                    <span className="font-bold text-slate-900">{selectedStudy.publicationYear}</span>
                  </div>
                )}
                {selectedStudy.publisher && (
                  <div>
                    <span className="font-bold text-slate-500 block">Vydavatel:</span>
                    <span className="font-bold text-slate-900">{selectedStudy.publisher}</span>
                  </div>
                )}
                {selectedStudy.doi && (
                  <div>
                    <span className="font-bold text-slate-500 block">DOI:</span>
                    <span className="font-mono text-blue-600">{selectedStudy.doi}</span>
                  </div>
                )}
              </div>

              {selectedStudy.abstract && (
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">Abstrakt:</h4>
                  <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedStudy.abstract}
                  </p>
                </div>
              )}

              {selectedStudy.summary && (
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">Shrnutí:</h4>
                  <p className="leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-blue-950">
                    {selectedStudy.summary}
                  </p>
                </div>
              )}

              {selectedStudy.findings && (
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">Hlavní zjištění:</h4>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-emerald-950">
                    {selectedStudy.findings}
                  </pre>
                </div>
              )}

              {selectedStudy.pdfUrl && (
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center justify-between">
                    <span>PDF Dokument:</span>
                    <a
                      href={selectedStudy.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      Otevřít v nové záložce <ExternalLink className="w-3 h-3" />
                    </a>
                  </h4>
                  <iframe
                    src={selectedStudy.pdfUrl}
                    className="w-full h-80 rounded-xl border border-slate-300"
                    title={selectedStudy.title}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
              >
                Zavřít náhled
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
