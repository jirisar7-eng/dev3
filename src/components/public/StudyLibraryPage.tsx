import React, { useState, useEffect } from 'react';
import { Study } from '../../types';
import { SeoHead } from './SeoHead';
import {
  BookOpen,
  Search,
  FileText,
  ExternalLink,
  ShieldCheck,
  Tag,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  Eye,
  Download,
  AlertCircle,
  Share2,
  Sparkles,
} from 'lucide-react';

export const StudyLibraryPage: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [pdfModalStudy, setPdfModalStudy] = useState<Study | null>(null);

  const fetchPublishedStudies = async () => {
    setLoading(true);
    try {
      let url = '/api/cms/studies?status=PUBLISHED';
      const params: string[] = ['status=PUBLISHED'];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (selectedCategory !== 'ALL') params.push(`category=${selectedCategory}`);
      url = `/api/cms/studies?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudies(data);
      }
    } catch (err) {
      console.error('Chyba při načítání vědeckých studií:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedStudies();
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <SeoHead
        title="Katalog vědeckých studií & Výzkum"
        description="Recenzované vědecké studie z oblasti vývojové psychologie, střídavé péče, přespávání kojenců a citové vazby pro soudní řízení."
        canonicalPath="/studie"
      />
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Ověřené vědecké důkazy & výzkum
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            Knihovna vědeckých studií o střídavé péči a přespávání dětí
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Databáze recenzovaných výzkumných studií (APA, PubMed, Springer) k problematice
            přespávání kojenců a batolat u otců, citové vazby (attachment) a dopadů střídavé péče.
            Slouží jako podklad pro rodinně-právní argumentaci, vyjádření k OSPOD a soudní řízení.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hledat autory, téma, klíčová slova (např. Fabricius, kojenci)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-bold text-slate-700">
          <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Kategorie:
          </span>

          {[
            { id: 'ALL', label: 'Všechny studie' },
            { id: 'stridava_pece', label: 'Střídavá péče' },
            { id: 'pripoutaci_vazba', label: 'Citová vazba (Attachment)' },
            { id: 'konflikt_rodicu', label: 'Rodičovský konflikt' },
            { id: 'soudni_praxe', label: 'Soudní praxe & OSPOD' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Published Studies */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Načítám vědeckou knihovnu...
        </div>
      ) : studies.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">Žádné vědecké studie nenacomputovány</h3>
          <p className="text-xs text-slate-500">
            Pro zadaná kritéria nebyly nalezeny žádné publikované studie. Zkuste změnit vyhledávání.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {studies.map((study) => (
            <div
              key={study.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              {study.featured && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-bl-2xl">
                  Doporučená studie
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-extrabold">
                    {study.category === 'stridava_pece'
                      ? 'Střídavá péče'
                      : study.category === 'pripoutaci_vazba'
                      ? 'Citová vazba'
                      : study.category}
                  </span>
                  {study.publicationYear && (
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {study.publicationYear}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">{study.title}</h3>
                  {study.originalTitle && (
                    <p className="text-xs text-slate-500 italic mt-1 font-medium">{study.originalTitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{study.authors}</span>
                </div>

                {study.abstract && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {study.abstract}
                  </p>
                )}

                {study.summary && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                    <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Shrnutí pro praxi & OSPOD:
                    </span>
                    <p className="text-xs text-blue-950 leading-relaxed font-medium line-clamp-3">
                      {study.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedStudy(study)}
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  Detail studie & Zjištění
                </button>

                {study.pdfUrl && (
                  <button
                    onClick={() => setPdfModalStudy(study)}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100"
                  >
                    <FileText className="w-4 h-4" />
                    Zobrazit PDF (MinIO)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Study Detail Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 my-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  {selectedStudy.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{selectedStudy.title}</h3>
                {selectedStudy.originalTitle && (
                  <p className="text-xs text-slate-500 italic mt-0.5">{selectedStudy.originalTitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedStudy(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 block text-[11px]">Autoři studie:</span>
                  <span className="font-bold text-slate-900">{selectedStudy.authors}</span>
                </div>
                {selectedStudy.publicationYear && (
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px]">Rok publikace:</span>
                    <span className="font-bold text-slate-900">{selectedStudy.publicationYear}</span>
                  </div>
                )}
                {selectedStudy.publisher && (
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px]">Vydavatel:</span>
                    <span className="font-bold text-slate-900">{selectedStudy.publisher}</span>
                  </div>
                )}
                {selectedStudy.doi && (
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px]">DOI kód:</span>
                    <a
                      href={selectedStudy.sourceUrl || `https://doi.org/${selectedStudy.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-600 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      {selectedStudy.doi} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {selectedStudy.abstract && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Abstrakt výzkumu:</h4>
                  <p className="leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {selectedStudy.abstract}
                  </p>
                </div>
              )}

              {selectedStudy.summary && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Praktický význam pro otce:</h4>
                  <p className="leading-relaxed bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-blue-950 font-medium">
                    {selectedStudy.summary}
                  </p>
                </div>
              )}

              {selectedStudy.methodology && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Metodologie & Výzkumný vzorek:</h4>
                  <p className="leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    {selectedStudy.methodology}
                  </p>
                </div>
              )}

              {selectedStudy.findings && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Klíčová zjištění studie:</h4>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 text-emerald-950 text-xs font-medium">
                    {selectedStudy.findings}
                  </pre>
                </div>
              )}

              {selectedStudy.relevance && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Použití u opatrovnického soudu & OSPOD:</h4>
                  <p className="leading-relaxed bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-amber-950 text-xs font-medium">
                    {selectedStudy.relevance}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {selectedStudy.pdfUrl ? (
                <button
                  onClick={() => {
                    const st = selectedStudy;
                    setSelectedStudy(null);
                    setPdfModalStudy(st);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-blue-100"
                >
                  <FileText className="w-4 h-4" />
                  Otevřít celostránkové PDF
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedStudy(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {pdfModalStudy && pdfModalStudy.pdfUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm text-white max-w-xl truncate">{pdfModalStudy.title}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    MinIO Secure Storage | ClamAV AntiVirus Checked
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={pdfModalStudy.pdfUrl}
                  download
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Stáhnout PDF
                </a>
                <button
                  onClick={() => setPdfModalStudy(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            <iframe src={pdfModalStudy.pdfUrl} className="w-full flex-1 border-0" title={pdfModalStudy.title} />
          </div>
        </div>
      )}
    </div>
  );
};
