import React, { useState, useEffect } from 'react';
import { AcademyVideo, VideoAttachment } from '../../types';
import {
  Video,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  Save,
  X,
  FileText,
  Play,
  Clock,
  UserCheck,
  Paperclip,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'rozhovory', label: 'Rozhovory s odborníky' },
  { id: 'navody', label: 'Praktické videonávody' },
  { id: 'webinare', label: 'Záznamy webinářů' },
];

export const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<AcademyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<AcademyVideo | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AcademyVideo>>({
    title: '',
    slug: '',
    category: 'rozhovory',
    categoryLabel: 'Rozhovory s odborníky',
    duration: '20 min',
    speaker: '',
    speakerRole: '',
    thumbnailUrl: '',
    videoEmbedUrl: '',
    sourceType: 'youtube',
    description: '',
    summaryNotes: [],
    attachments: [],
    order: 0,
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
  });

  const [newNote, setNewNote] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentSize, setNewAttachmentSize] = useState('1.0 MB');

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Chyba při načítání videí:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      slug: '',
      category: 'rozhovory',
      categoryLabel: 'Rozhovory s odborníky',
      duration: '20 min',
      speaker: '',
      speakerRole: '',
      thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      sourceType: 'youtube',
      description: '',
      summaryNotes: [],
      attachments: [],
      order: videos.length + 1,
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
    });
    setSelectedVideo(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (video: AcademyVideo) => {
    setSelectedVideo(video);
    setFormData({
      ...video,
      summaryNotes: [...(video.summaryNotes || [])],
      attachments: [...(video.attachments || [])],
    });
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (video: AcademyVideo) => {
    setSelectedVideo(video);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Vyplňte prosím název videa.');
      return;
    }

    const payload = {
      ...formData,
      slug:
        formData.slug?.trim() ||
        formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
    };

    try {
      if (selectedVideo) {
        // Update
        const res = await fetch(`/api/cms/videos/${selectedVideo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchVideos();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Uložení se nezdařilo'}`);
        }
      } else {
        // Create
        const res = await fetch('/api/cms/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchVideos();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Vytvoření se nezdařilo'}`);
        }
      }
    } catch (err) {
      console.error('Chyba při ukládání videa:', err);
      alert('Chyba komunikace se serverem.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Opravdu chcete smazat video "${title}"?`)) return;
    try {
      const res = await fetch(`/api/cms/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchVideos();
      } else {
        alert('Nepodařilo se smazat video.');
      }
    } catch (err) {
      console.error('Chyba při mazání videa:', err);
    }
  };

  // Add Summary Note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setFormData({
      ...formData,
      summaryNotes: [...(formData.summaryNotes || []), newNote.trim()],
    });
    setNewNote('');
  };

  const handleRemoveNote = (index: number) => {
    const next = [...(formData.summaryNotes || [])];
    next.splice(index, 1);
    setFormData({ ...formData, summaryNotes: next });
  };

  // Add Attachment
  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const attachment: VideoAttachment = {
      name: newAttachmentName.trim(),
      size: newAttachmentSize || '1.0 MB',
    };
    setFormData({
      ...formData,
      attachments: [...(formData.attachments || []), attachment],
    });
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (index: number) => {
    const next = [...(formData.attachments || [])];
    next.splice(index, 1);
    setFormData({ ...formData, attachments: next });
  };

  // Filtered list
  const filteredVideos = videos.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.speaker.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-rose-600" />
            Videotéka & Vzdělávací videa (CMS)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Správa video lekcí, rozhovorů s odborníky, návodů a záznamů webinářů s plným SEO a materiály.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="btn-create-video"
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Přidat video
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat podle názvu, lektora nebo popisu..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Všechny stavy</option>
            <option value="PUBLISHED">Publikováno</option>
            <option value="DRAFT">Koncept</option>
            <option value="ARCHIVED">Archivováno</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Nalezeno: <strong className="text-slate-900">{filteredVideos.length}</strong> videí
        </div>
      </div>

      {/* Videos List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">Načítání videotéky...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Nebyly nalezeny žádné video záznamy.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 group">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white/90 fill-white/80" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-bold text-white px-1 rounded">
                      {video.duration}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-200/60">
                        {video.categoryLabel || video.category}
                      </span>

                      {video.status === 'PUBLISHED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Publikováno
                        </span>
                      )}
                      {video.status === 'DRAFT' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Koncept
                        </span>
                      )}
                      {video.status === 'ARCHIVED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Archive className="w-3 h-3" /> Archiv
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{video.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{video.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="text-slate-600 font-semibold">{video.speaker}</span> ({video.speakerRole})
                      <span>•</span>
                      <span>Slug: /{video.slug}</span>
                      {video.attachments && video.attachments.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Paperclip className="w-3 h-3" /> {video.attachments.length} soubor
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenPreview(video)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Náhled videa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(video)}
                    className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                    title="Upravit video"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id, video.title)}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                    title="Smazat video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-600" />
                {selectedVideo ? 'Upravit video lekci' : 'Přidat novou video lekci'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Název videa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Např. Rozhovor: Střídavá péče očima dětského psychologa"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Slug (unikátní)</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="automaticky-z-nazvu"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategorie</label>
                  <select
                    value={formData.category || 'rozhovory'}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const label =
                        cat === 'rozhovory'
                          ? 'Rozhovory s odborníky'
                          : cat === 'navody'
                          ? 'Praktické videonávody'
                          : 'Záznamy webinářů';
                      setFormData({ ...formData, category: cat, categoryLabel: label });
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="rozhovory">Rozhovory s odborníky</option>
                    <option value="navody">Praktické videonávody</option>
                    <option value="webinare">Záznamy webinářů</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lektor / Host</label>
                  <input
                    type="text"
                    value={formData.speaker || ''}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                    placeholder="PhDr. Jaroslav Šturma"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Specializace</label>
                  <input
                    type="text"
                    value={formData.speakerRole || ''}
                    onChange={(e) => setFormData({ ...formData, speakerRole: e.target.value })}
                    placeholder="Dětský klinický psycholog"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Délka videa</label>
                  <input
                    type="text"
                    value={formData.duration || '20 min'}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="28 min"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stav publikace</label>
                  <select
                    value={formData.status || 'PUBLISHED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PUBLISHED">Publikováno</option>
                    <option value="DRAFT">Koncept (Draft)</option>
                    <option value="ARCHIVED">Archivováno</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Embed URL videa (YouTube / Vimeo / MP4)</label>
                  <input
                    type="text"
                    value={formData.videoEmbedUrl || ''}
                    onChange={(e) => setFormData({ ...formData, videoEmbedUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Náhledový obrázek (Thumbnail URL)</label>
                  <input
                    type="text"
                    value={formData.thumbnailUrl || ''}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Popis videa</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Stručný obsah a klíčové teze přednášky..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Summary Notes */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Klíčové body a poznámky k videu</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                    placeholder="Nová teze (např. Dítě potřebuje mírové rodiče...)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
                  >
                    Přidat bod
                  </button>
                </div>

                <div className="space-y-1.5">
                  {formData.summaryNotes?.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700"
                    >
                      <span className="line-clamp-2">• {note}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(idx)}
                        className="text-rose-500 hover:text-rose-700 shrink-0 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Materiály ke stažení</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="Název (např. Shrnutí PDF)"
                    className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAttachmentSize}
                      onChange={(e) => setNewAttachmentSize(e.target.value)}
                      placeholder="1.2 MB"
                      className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="flex-1 px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
                    >
                      Přidat
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {formData.attachments?.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700"
                    >
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{att.name}</strong> ({att.size})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 shrink-0 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Meta */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">SEO Metadata</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Titulek pro vyhledávače a sociální sítě"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Description</label>
                    <textarea
                      rows={2}
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Meta popis pro Google a vyhledávače"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" /> Uložit video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  {selectedVideo.categoryLabel}
                </span>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200">
                <iframe
                  src={selectedVideo.videoEmbedUrl}
                  title={selectedVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{selectedVideo.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                  <strong>{selectedVideo.speaker}</strong> ({selectedVideo.speakerRole})
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedVideo.duration}</span>
                </div>
              </div>

              {selectedVideo.summaryNotes && selectedVideo.summaryNotes.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Klíčové teze:</h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {selectedVideo.summaryNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
