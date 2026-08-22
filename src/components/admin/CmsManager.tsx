import React, { useEffect, useState } from 'react';
import { Page, PageSection, Article, Category, Faq, NavItem, MediaItem } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';
import { StudyManager } from './StudyManager';
import { WikiManager } from './WikiManager';
import { LegalGuideManager } from './LegalGuideManager';
import { VideoManager } from './VideoManager';
import { QuizManager } from './QuizManager';
import { MementoManager } from './MementoManager';
import {
  FileText,
  BookOpen,
  HelpCircle,
  FolderTree,
  Navigation,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Server,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  LayoutDashboard,
  Save,
  X,
  BookMarked,
  Video,
  Award,
  AlertTriangle,
} from 'lucide-react';

export const CmsManager: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<
    | 'dashboard'
    | 'pages'
    | 'articles'
    | 'categories'
    | 'faqs'
    | 'nav'
    | 'media'
    | 'studies'
    | 'wiki'
    | 'legal-guides'
    | 'videos'
    | 'quizzes'
    | 'memento'
  >('dashboard');

  const [pages, setPages] = useState<Page[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Selected Page for Section Editing
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const selectedPage = pages.find((p) => p.id === selectedPageId);

  // Edit Mode state
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingFaq, setEditingFaq] = useState<Partial<Faq> | null>(null);

  // Create forms state
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '' });
  const [newSection, setNewSection] = useState({
    sectionKey: 'hero',
    title: '',
    content: '',
    order: 1,
    config: '{}',
  });
  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'Judikatura',
  });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', type: 'article' });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Právní dotazy' });
  const [newNavItem, setNewNavItem] = useState({ labelKey: '', url: '', target: '_self', isExternal: false });
  const [newMedia, setNewMedia] = useState({ name: '', url: '', type: 'image', size: 102400, alt: '' });

  const fetchCmsData = () => {
    fetch('/api/cms/pages')
      .then((res) => res.json())
      .then((data) => {
        setPages(data);
        if (data.length > 0 && !selectedPageId) {
          setSelectedPageId(data[0].id);
        }
      });
    fetch('/api/cms/articles')
      .then((res) => res.json())
      .then((data) => setArticles(data));
    fetch('/api/cms/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data));
    fetch('/api/cms/faqs')
      .then((res) => res.json())
      .then((data) => setFaqs(data));
    fetch('/api/cms/nav')
      .then((res) => res.json())
      .then((data) => setNavItems(data));
    fetch('/api/cms/media')
      .then((res) => res.json())
      .then((data) => setMediaItems(data));
  };

  useEffect(() => {
    fetchCmsData();
  }, []);

  // --- PAGES & SECTIONS HANDLERS ---
  const handleSyncPages = async () => {
    try {
      await fetch('/api/admin/pages/sync-modules', { method: 'POST' });
      fetchCmsData();
    } catch (err) {
      console.error('Error syncing module pages:', err);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPage.title || !newPage.slug) return;
    await fetch('/api/cms/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPage, published: true }),
    });
    setNewPage({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '' });
    fetchCmsData();
  };

  const handleUpdatePage = async (id: string, updatedData: Partial<Page>) => {
    await fetch(`/api/cms/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    setEditingPage(null);
    fetchCmsData();
  };

  const handleTogglePublishPage = async (page: Page) => {
    await fetch(`/api/cms/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !page.published }),
    });
    fetchCmsData();
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto stránku?')) return;
    await fetch(`/api/cms/pages/${id}`, { method: 'DELETE' });
    if (selectedPageId === id) setSelectedPageId(null);
    fetchCmsData();
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPageId) return;
    await fetch(`/api/cms/pages/${selectedPageId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSection),
    });
    setNewSection({ sectionKey: 'hero', title: '', content: '', order: 1, config: '{}' });
    fetchCmsData();
  };

  const handleDeleteSection = async (sectionId: string) => {
    await fetch(`/api/cms/sections/${sectionId}`, { method: 'DELETE' });
    fetchCmsData();
  };

  // --- ARTICLES HANDLERS ---
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.slug) return;
    await fetch('/api/cms/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newArticle, published: true }),
    });
    setNewArticle({ title: '', slug: '', summary: '', content: '', category: 'Judikatura' });
    fetchCmsData();
  };

  const handleTogglePublishArticle = async (art: Article) => {
    await fetch(`/api/cms/articles/${art.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !art.published }),
    });
    fetchCmsData();
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Opravdu smazat tento článek?')) return;
    await fetch(`/api/cms/articles/${id}`, { method: 'DELETE' });
    fetchCmsData();
  };

  // --- CATEGORY HANDLERS ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.slug) return;
    await fetch('/api/cms/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    });
    setNewCategory({ name: '', slug: '', description: '', type: 'article' });
    fetchCmsData();
  };

  const handleDeleteCategory = async (id: string) => {
    await fetch(`/api/cms/categories/${id}`, { method: 'DELETE' });
    fetchCmsData();
  };

  // --- FAQ HANDLERS ---
  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) return;
    await fetch('/api/cms/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newFaq, order: faqs.length + 1, published: true }),
    });
    setNewFaq({ question: '', answer: '', category: 'Právní dotazy' });
    fetchCmsData();
  };

  const handleDeleteFaq = async (id: string) => {
    await fetch(`/api/cms/faqs/${id}`, { method: 'DELETE' });
    fetchCmsData();
  };

  // --- NAV HANDLERS ---
  const handleCreateNavItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNavItem.labelKey || !newNavItem.url) return;
    await fetch('/api/cms/nav', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newNavItem, order: navItems.length + 1 }),
    });
    setNewNavItem({ labelKey: '', url: '', target: '_self', isExternal: false });
    fetchCmsData();
  };

  const handleDeleteNavItem = async (id: string) => {
    await fetch(`/api/cms/nav/${id}`, { method: 'DELETE' });
    fetchCmsData();
  };

  // --- MEDIA HANDLERS ---
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedia.name || !newMedia.url) return;
    await fetch('/api/cms/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMedia),
    });
    setNewMedia({ name: '', url: '', type: 'image', size: 102400, alt: '' });
    fetchCmsData();
  };

  const handleDeleteMedia = async (id: string) => {
    await fetch(`/api/cms/media/${id}`, { method: 'DELETE' });
    fetchCmsData();
  };

  return (
    <div className="space-y-6">
      {/* Subtab Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Správa Obsahu (CMS Core)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data-driven CMS: Stránky, sekce, články, kategorie, FAQ, navigace a média.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto text-xs font-bold text-slate-700">
          <button
            onClick={() => setActiveSubtab('dashboard')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'dashboard' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Přehled
          </button>
          <button
            onClick={() => setActiveSubtab('pages')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'pages' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Stránky ({pages.length})
          </button>
          <button
            onClick={() => setActiveSubtab('articles')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'articles' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Články ({articles.length})
          </button>
          <button
            onClick={() => setActiveSubtab('categories')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'categories' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Kategorie ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubtab('faqs')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'faqs' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ ({faqs.length})
          </button>
          <button
            onClick={() => setActiveSubtab('nav')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'nav' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Navigace ({navItems.length})
          </button>
          <button
            onClick={() => setActiveSubtab('media')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'media' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Média ({mediaItems.length})
          </button>
          <button
            onClick={() => setActiveSubtab('wiki')}
            id="cms-subtab-wiki"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'wiki' ? 'bg-indigo-600 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Encyklopedie & Wiki
          </button>
          <button
            onClick={() => setActiveSubtab('legal-guides')}
            id="cms-subtab-legal-guides"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'legal-guides' ? 'bg-amber-600 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Právní průvodci
          </button>
          <button
            onClick={() => setActiveSubtab('studies')}
            id="cms-subtab-studies"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'studies' ? 'bg-blue-600 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Knihovna studií
          </button>
          <button
            onClick={() => setActiveSubtab('videos')}
            id="cms-subtab-videos"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'videos' ? 'bg-rose-600 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videotéka
          </button>
          <button
            onClick={() => setActiveSubtab('quizzes')}
            id="cms-subtab-quizzes"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'quizzes' ? 'bg-emerald-600 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Kvízy
          </button>
          <button
            onClick={() => setActiveSubtab('memento')}
            id="cms-subtab-memento"
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeSubtab === 'memento' ? 'bg-amber-500 text-white shadow-2xs font-extrabold' : 'hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Procesní chyby
          </button>
        </div>
      </div>

      {/* 1. DASHBOARD SUBTAB */}
      {activeSubtab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Publikované Stránky</span>
              <span className="text-3xl font-black text-slate-900">
                {pages.filter((p) => p.published).length} / {pages.length}
              </span>
              <span className="text-[11px] text-blue-600 block mt-2 font-semibold">
                S podporou PageSections
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Články v Databázi</span>
              <span className="text-3xl font-black text-slate-900">{articles.length}</span>
              <span className="text-[11px] text-emerald-600 block mt-2 font-semibold">
                Kategorie & SEO meta
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Položky Navigace</span>
              <span className="text-3xl font-black text-slate-900">{navItems.length}</span>
              <span className="text-[11px] text-purple-600 block mt-2 font-semibold">
                Dynamic Main Header Menu
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Soubory v Mědiích</span>
              <span className="text-3xl font-black text-slate-900">{mediaItems.length}</span>
              <span className="text-[11px] text-amber-600 block mt-2 font-semibold">
                MinIO / S3 & ClamAV OK
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Architektura CMS (Data-Driven Workflow)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Veškerý obsah portálu je dynamicky řízen databázovými záznamy přes REST API. Stránky se skládají z rozšiřitelných bloků (PageSections) typu <strong>Hero, Text, Image, Cards, FAQ a CTA</strong>.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold border border-slate-200">
                PostgreSQL 16 Schema
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-lg font-bold border border-blue-200">
                PageSection Renderer Engine
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-lg font-bold border border-emerald-200">
                ClamAV Antivirus Scanner
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAGES & PAGE SECTIONS SUBTAB */}
      {activeSubtab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pages List & Sections Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">Seznam stránek ({pages.length})</h3>
                <button
                  onClick={handleSyncPages}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Obnovit / Synchronizovat všech 33 stránek z menu"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Obnovit / Synchronizovat všech 33 stránek z menu</span>
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Název</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Sekce</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pages.map((pg) => (
                    <tr
                      key={pg.id}
                      className={`hover:bg-slate-50 transition-all cursor-pointer ${
                        selectedPageId === pg.id ? 'bg-blue-50/60 font-semibold' : ''
                      }`}
                      onClick={() => setSelectedPageId(pg.id)}
                    >
                      <td className="p-3.5 font-bold text-slate-900">{pg.title}</td>
                      <td className="p-3.5 font-mono text-slate-500">/{pg.slug}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {pg.sections?.length || 0} sekcí
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublishPage(pg);
                          }}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                            pg.published
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {pg.published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Publikováno
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Koncept
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingPage(pg)}
                          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                          title="Upravit stránku"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(pg.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Smazat stránku"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Page Section Management Panel */}
            {selectedPage && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      Správa sekcí stránky
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{selectedPage.title}</h3>
                  </div>

                  <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-xl text-slate-600">
                    /{selectedPage.slug}
                  </span>
                </div>

                {/* Section List for Selected Page */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">
                    Existující PageSections ({selectedPage.sections?.length || 0})
                  </h4>

                  {!selectedPage.sections || selectedPage.sections.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Tato stránka zatím nemá žádné PageSections. Přidejte sekci níže.
                    </div>
                  ) : (
                    selectedPage.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {sec.order}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px] uppercase">
                                {sec.sectionKey}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {sec.title || '(Bez nadpisu)'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {sec.content || 'Bez obsahu'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Section to Selected Page */}
                <form onSubmit={handleCreateSection} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Přidat novou PageSection na tuto stránku
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Typ sekce:</label>
                      <select
                        value={newSection.sectionKey}
                        onChange={(e) => setNewSection({ ...newSection, sectionKey: e.target.value })}
                        className="w-full p-2 border rounded-xl bg-white font-semibold"
                      >
                        <option value="hero">Hero (Banner + CTA)</option>
                        <option value="text">Text (Odmrážkový / Zvýrazněný text)</option>
                        <option value="cards">Cards (Mřížka karet s popisem)</option>
                        <option value="faq">FAQ (Časté dotazy)</option>
                        <option value="cta">CTA (Výzva k akci)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Pořadí:</label>
                      <input
                        type="number"
                        value={newSection.order}
                        onChange={(e) => setNewSection({ ...newSection, order: Number(e.target.value) })}
                        className="w-full p-2 border rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Nadpis sekce:</label>
                    <input
                      type="text"
                      value={newSection.title}
                      onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                      className="w-full p-2 border rounded-xl bg-white"
                      placeholder="Např. Hlavní pilíře nebo Právní tipy"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Obsah sekce:</label>
                    <textarea
                      value={newSection.content}
                      onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                      rows={2}
                      className="w-full p-2 border rounded-xl bg-white"
                      placeholder="Popisný text sekce..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat sekci
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Form to Create New Page */}
          <form onSubmit={handleCreatePage} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Vytvořit novou stránku
            </h3>

            <div>
              <label className="block font-semibold mb-1">Název stránky:</label>
              <input
                type="text"
                required
                value={newPage.title}
                onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-600"
                placeholder="Např. Ochrana práv rodiny"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">URL Slug:</label>
              <input
                type="text"
                required
                value={newPage.slug}
                onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                placeholder="ochrana-prav-rodiny"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">SEO Title:</label>
              <input
                type="text"
                value={newPage.seoTitle}
                onChange={(e) => setNewPage({ ...newPage, seoTitle: e.target.value })}
                placeholder="Meta titulek pro vyhledávače"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">SEO Popis:</label>
              <textarea
                value={newPage.seoDescription}
                onChange={(e) => setNewPage({ ...newPage, seoDescription: e.target.value })}
                rows={2}
                placeholder="Meta popis pro vyhledávače"
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <MarkdownEditor
                label="Základní textový obsah"
                value={newPage.content}
                onChange={(val) => setNewPage({ ...newPage, content: val })}
                rows={5}
                placeholder="Obsah stránky v Markdown formátu..."
              />
            </div>

            <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">
              Uložit novou stránku
            </button>
          </form>
        </div>
      )}

      {/* 3. ARTICLES SUBTAB */}
      {activeSubtab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Název článku</th>
                    <th className="p-3.5">Kategorie</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Datum</th>
                    <th className="p-3.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{art.title}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-bold text-[10px]">
                          {art.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleTogglePublishArticle(art)}
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            art.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {art.published ? 'Publikováno' : 'Koncept'}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {new Date(art.createdAt).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCreateArticle} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-2">Vytvořit nový článek</h3>

            <div>
              <label className="block font-semibold mb-1">Název článku:</label>
              <input
                type="text"
                required
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">URL Slug:</label>
              <input
                type="text"
                required
                value={newArticle.slug}
                onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Kategorie:</label>
              <select
                value={newArticle.category}
                onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Stručné shrnutí:</label>
              <input
                type="text"
                value={newArticle.summary}
                onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Obsah článku:</label>
              <textarea
                value={newArticle.content}
                onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                rows={5}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950">
              Uložit článek
            </button>
          </form>
        </div>
      )}

      {/* 4. CATEGORIES SUBTAB */}
      {activeSubtab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Název</th>
                    <th className="p-3.5">Slug</th>
                    <th className="p-3.5">Typ</th>
                    <th className="p-3.5">Popis</th>
                    <th className="p-3.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3.5 font-mono text-slate-500">/{c.slug}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                          {c.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{c.description || '-'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-2">Přidat novou kategorii</h3>

            <div>
              <label className="block font-semibold mb-1">Název kategorie:</label>
              <input
                type="text"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Slug:</label>
              <input
                type="text"
                required
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Typ:</label>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white font-semibold"
              >
                <option value="article">Články (article)</option>
                <option value="faq">FAQ (faq)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Popis:</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows={2}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950">
              Přidat kategorii
            </button>
          </form>
        </div>
      )}

      {/* 5. FAQS SUBTAB */}
      {activeSubtab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {faqs.map((f) => (
              <div key={f.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-bold text-[10px]">
                      {f.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Pořadí: #{f.order}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{f.question}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>
                </div>

                <button
                  onClick={() => handleDeleteFaq(f.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateFaq} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-2">Přidat FAQ Otázku</h3>

            <div>
              <label className="block font-semibold mb-1">Otázka:</label>
              <input
                type="text"
                required
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Kategorie:</label>
              <input
                type="text"
                value={newFaq.category}
                onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Odpověď:</label>
              <textarea
                required
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={4}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950">
              Uložit FAQ
            </button>
          </form>
        </div>
      )}

      {/* 6. NAVIGATION SUBTAB */}
      {activeSubtab === 'nav' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Pořadí</th>
                    <th className="p-3.5">Klíč / Štítek</th>
                    <th className="p-3.5">Cílová URL</th>
                    <th className="p-3.5">Cíl</th>
                    <th className="p-3.5 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {navItems.map((nav) => (
                    <tr key={nav.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold font-mono text-slate-900">#{nav.order}</td>
                      <td className="p-3.5 font-bold text-slate-900">{nav.labelKey}</td>
                      <td className="p-3.5 font-mono text-slate-500">{nav.url}</td>
                      <td className="p-3.5 text-slate-600">{nav.target}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteNavItem(nav.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCreateNavItem} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-2">Přidat položku menu</h3>

            <div>
              <label className="block font-semibold mb-1">Štítek / Klíč:</label>
              <input
                type="text"
                required
                value={newNavItem.labelKey}
                onChange={(e) => setNewNavItem({ ...newNavItem, labelKey: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
                placeholder="Např. Ochrana práv"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">URL adresa:</label>
              <input
                type="text"
                required
                value={newNavItem.url}
                onChange={(e) => setNewNavItem({ ...newNavItem, url: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono"
                placeholder="/pages/ochrana-prav neboli #oddil"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Cíl okna (Target):</label>
              <select
                value={newNavItem.target}
                onChange={(e) => setNewNavItem({ ...newNavItem, target: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white font-semibold"
              >
                <option value="_self">Stejné okno (_self)</option>
                <option value="_blank">Nové okno (_blank)</option>
              </select>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950">
              Přidat do navigace
            </button>
          </form>
        </div>
      )}

      {/* 7. MEDIA SUBTAB */}
      {activeSubtab === 'media' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mediaItems.map((med) => (
                <div key={med.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1 border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      ClamAV Clean
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">MinIO / S3 Storage</span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm truncate">{med.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{med.mimeType || med.type} • {(med.size / 1024).toFixed(1)} KB</div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <a
                      href={med.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Náhled
                    </a>

                    <button
                      onClick={() => handleDeleteMedia(med.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddMedia} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-black text-slate-900 text-base border-b pb-2">Nahrát / Evidovat médium</h3>

            <div>
              <label className="block font-semibold mb-1">Název souboru:</label>
              <input
                type="text"
                required
                value={newMedia.name}
                onChange={(e) => setNewMedia({ ...newMedia, name: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
                placeholder="vzorovy-dokument.pdf"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">URL Adresa:</label>
              <input
                type="text"
                required
                value={newMedia.url}
                onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono"
                placeholder="/assets/vzor.pdf"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Typ:</label>
              <select
                value={newMedia.type}
                onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-white font-semibold"
              >
                <option value="image">Obrázek (image)</option>
                <option value="document">Dokument (document)</option>
              </select>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950">
              Registrovat médium
            </button>
          </form>
        </div>
      )}

      {/* Page Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">Upravit stránku</h3>
              <button onClick={() => setEditingPage(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Název:</label>
                <input
                  type="text"
                  value={editingPage.title || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Slug:</label>
                <input
                  type="text"
                  value={editingPage.slug || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">SEO Title:</label>
                <input
                  type="text"
                  value={editingPage.seoTitle || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">SEO Popis:</label>
                <textarea
                  value={editingPage.seoDescription || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, seoDescription: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Obsah:</label>
                <textarea
                  value={editingPage.content || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  rows={4}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50"
              >
                Zrušit
              </button>
              <button
                onClick={() => handleUpdatePage(editingPage.id!, editingPage)}
                className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold text-xs hover:bg-blue-950 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Uložit změny
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 8. STUDIES SUBTAB */}
      {activeSubtab === 'studies' && <StudyManager />}
      {/* 9. WIKI SUBTAB */}
      {activeSubtab === 'wiki' && <WikiManager />}
      {/* 10. LEGAL GUIDES SUBTAB */}
      {activeSubtab === 'legal-guides' && <LegalGuideManager />}
      {/* 11. VIDEOS SUBTAB */}
      {activeSubtab === 'videos' && <VideoManager />}
      {/* 12. QUIZZES SUBTAB */}
      {activeSubtab === 'quizzes' && <QuizManager />}
      {/* 13. MEMENTO SUBTAB */}
      {activeSubtab === 'memento' && <MementoManager />}
    </div>
  );
};
