import { apiFetch } from '../../../utils/apiClient';
import React, { useState, useEffect, useCallback } from 'react';
import { SeoHead } from '../SeoHead';
import { MarkdownEditor } from '../../MarkdownEditor';
import {
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  AlertOctagon,
  ArrowLeft,
  User,
  Clock,
  Send,
  CheckCircle2,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { ForumThread, ForumPost } from '../../../types';

interface ForumViewProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  care: 'Péče & Styk',
  court: 'OSPOD & Soudní řízení',
  finance: 'Výživné & Finance',
  psychology: 'Psychologie & Dítě',
  groups: 'Regionální Táta-Grupy',
};

export const ForumView: React.FC<ForumViewProps> = ({ onNavigate }) => {
  const categories = [
    { id: 'all', name: 'Všechny diskuze', icon: '🌐' },
    { id: 'care', name: 'Péče & Styk', icon: '👨‍👦' },
    { id: 'court', name: 'OSPOD & Soudní řízení', icon: '⚖️' },
    { id: 'finance', name: 'Výživné & Finance', icon: '💳' },
    { id: 'psychology', name: 'Psychologie & Dítě', icon: '🧠' },
    { id: 'groups', name: 'Regionální Táta-Grupy', icon: '📍' },
  ];

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState<boolean>(false);

  // New Thread Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('care');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('AnonymniOtec');
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null);
  const [isSubmittingThread, setIsSubmittingThread] = useState<boolean>(false);

  // Reply Form
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // Helper for formatting Czech dates
  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString('cs-CZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  // Fetch threads from DB API
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCategory !== 'all' 
        ? `/api/forum/threads?category=${encodeURIComponent(selectedCategory)}` 
        : '/api/forum/threads';
      
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setThreads(data || []);
      } else {
        console.error('Chyba při načítání diskusí:', res.statusText);
      }
    } catch (err) {
      console.error('Chyba sítě při načítání diskusí:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Fetch thread detail when selected
  useEffect(() => {
    if (!selectedThreadId) {
      setActiveThread(null);
      return;
    }

    const fetchThreadDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiFetch(`/api/forum/threads/${selectedThreadId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveThread(data);
        } else {
          // Fallback to local thread in array
          const found = threads.find((t) => t.id === selectedThreadId);
          setActiveThread(found || null);
        }
      } catch (err) {
        console.error('Chyba při načítání detailu diskuse:', err);
        const found = threads.find((t) => t.id === selectedThreadId);
        setActiveThread(found || null);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchThreadDetail();
  }, [selectedThreadId, threads]);

  // Sensitive Data Detector Regexes
  const checkSensitiveData = (text: string) => {
    const rcRegex = /\b\d{6}\/\d{3,4}\b/; // Rodné číslo
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/; // E-mail
    const phoneRegex = /(\+420)?\s*[1-9]\d{2}\s*\d{3}\s*\d{3}/; // Telefonní číslo
    const fullNameRegex = /(PhDr\.|JUDr\.|Mgr\.|Ing\.)?\s+[A-Z][a-chčďéěíňóřšťúůýž]+\s+[A-Z][a-chčďéěíňóřšťúůýž]+/; // Plné jméno

    if (rcRegex.test(text)) {
      return '⚠️ Pozor! V textu bylo zjištěno Rodné číslo. Z důvodu ochrany soukromí jej odstraňte.';
    }
    if (emailRegex.test(text)) {
      return '⚠️ Pozor! V textu byl zjištěn e-mail. Z důvodu anonymity jej prosím nedávejte do veřejné diskuse.';
    }
    if (phoneRegex.test(text)) {
      return '⚠️ Pozor! V textu bylo zjištěno telefonní číslo. Odstraňte jej před publikací.';
    }
    if (fullNameRegex.test(text)) {
      return '⚠️ Zjištěno plné jméno / tituly. Doporučujeme použít anonymizovaná jména (např. Matka / Otec / Dítě X).';
    }
    return null;
  };

  const handleContentChange = (text: string) => {
    setNewContent(text);
    const warning = checkSensitiveData(text) || checkSensitiveData(newTitle);
    setSensitiveWarning(warning);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const warning = checkSensitiveData(newContent) || checkSensitiveData(newTitle);
    if (warning) {
      alert('Před odesláním opravte zjištěné citlivé údaje: ' + warning);
      return;
    }

    setIsSubmittingThread(true);
    try {
      const res = await apiFetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          content: newContent.trim(),
          author: newAuthor.trim() || 'AnonymniOtec',
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setShowNewThreadModal(false);
        setSensitiveWarning(null);
        await fetchThreads();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Chyba při zakládání diskuse.');
      }
    } catch (err) {
      console.error('Chyba při zakládání diskuse:', err);
      alert('Chyba sítě při zakládání diskuse.');
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const handleAddReply = async (threadId: string) => {
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const res = await apiFetch(`/api/forum/threads/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText.trim(),
          content: replyText.trim(),
          author: 'AnonymniOtec',
        }),
      });

      if (res.ok) {
        setReplyText('');
        // Refresh active thread details
        const detailRes = await apiFetch(`/api/forum/threads/${threadId}`);
        if (detailRes.ok) {
          const updatedDetail = await detailRes.json();
          setActiveThread(updatedDetail);
        }
        await fetchThreads();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Chyba při odesílání odpovědi.');
      }
    } catch (err) {
      console.error('Chyba při odesílání odpovědi:', err);
      alert('Chyba sítě při odesílání odpovědi.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Komunitní Fórum • Táta má právo"
        description="Diskuze a zkušenosti otců v opatrovnických řízeních. Přísně anonymizované prostředí pro konstruktivní poradenství bez útoků."
        canonicalPath="/forum"
      />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => onNavigate('/krizova-pomoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na rozcestník Krizové pomoci</span>
        </button>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider mb-2">
              <MessageSquare className="w-5 h-5" />
              <span>Komunitní Diskuze Otců</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
              Fórum & Sdílení zkušeností
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Bezpečný prostor pro výměnu zkušeností s opatrovnickými soudy, OSPOD, péčí o dětí a financemi.
            </p>
          </div>

          <button
            onClick={() => setShowNewThreadModal(true)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Založit nové téma</span>
          </button>
        </div>
      </div>

      {/* Pravidla Komunity Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <strong className="text-sm font-black text-white block">
                Kodex & Pravidla komunitního fóra
              </strong>
              <p className="text-xs text-slate-300 leading-relaxed">
                • <strong>Přísná anonymizace:</strong> Nikdy neuvádějte rodná čísla, celá jména dětí, partnerů ani adresy. <br />
                • <strong>Zákaz eskalace:</strong> Konstruktivní diskuse bez vulgarit, osobních útoků na matky, úředníky či soudce. Nápomocné rady mají přednost před agresí.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter & Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Categories */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-2">
            Kategorie fóra
          </h3>
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs space-y-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedThreadId(null);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Area: Threads List or Active Thread Detail */}
        <div className="lg:col-span-3 space-y-4">
          {selectedThreadId ? (
            /* Thread Detail View */
            loadingDetail ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-bold">Načítám detail diskuse...</p>
              </div>
            ) : activeThread ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Zpět na seznam vláken</span>
                </button>

                <div className="border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold uppercase text-[10px]">
                      {CATEGORY_LABELS[activeThread.category] || activeThread.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <strong>{activeThread.author}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(activeThread.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">
                    {activeThread.title}
                  </h2>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {activeThread.content}
                  </div>
                </div>

                {/* Replies */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-indigo-600" />
                    <span>
                      Odpovědi a doporučení ({activeThread.posts?.length || activeThread.replies?.length || activeThread.repliesCount || 0})
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {activeThread.posts && activeThread.posts.length > 0 ? (
                      activeThread.posts.map((post: ForumPost) => (
                        <div key={post.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>{post.author}</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{post.content || post.text}</p>
                        </div>
                      ))
                    ) : activeThread.replies && activeThread.replies.length > 0 ? (
                      activeThread.replies.map((reply, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>{reply.author}</span>
                            <span>{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{reply.text || reply.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">Zatím žádné odpovědi. Buďte první, kdo odpoví!</p>
                    )}
                  </div>

                  {/* Add Reply Form */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Přidat vaši anonymní odpověď
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Napište věcnou odpověď..."
                        rows={2}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleAddReply(activeThread.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {isSubmittingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Odeslat</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                Diskuse nebyla nalezena.
              </div>
            )
          ) : (
            /* Threads List */
            loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-3 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="font-bold">Načítám diskuse z databáze...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              /* Clean Empty State */
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-1">
                    V této kategorii zatím nejsou žádné diskuse.
                  </h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Buďte první, kdo založí téma a získejte podporu a reakce od ostatních otců a komunity.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewThreadModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-2 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Založit první diskusi</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreads.map((thread) => {
                  const replyCount = thread.posts?.length || thread.replies?.length || thread.repliesCount || 0;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {CATEGORY_LABELS[thread.category] || thread.category}
                          </span>
                          <span>•</span>
                          <span>{thread.author}</span>
                          <span>•</span>
                          <span>{formatDate(thread.createdAt)}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {thread.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 shrink-0 self-start sm:self-center">
                        <MessageCircle className="w-4 h-4 text-indigo-500" />
                        <span>{replyCount} {replyCount === 1 ? 'odpověď' : replyCount >= 2 && replyCount <= 4 ? 'odpovědi' : 'odpovědí'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>Založit nové diskuzní téma</span>
              </h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="care">Péče & Styk</option>
                  <option value="court">OSPOD & Soudní řízení</option>
                  <option value="finance">Výživné & Finance</option>
                  <option value="psychology">Psychologie & Dítě</option>
                  <option value="groups">Regionální Táta-Grupy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Přezdívka (Anonymní)
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="např. Otec_Jan_Brno"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Název diskuzního témata *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setSensitiveWarning(checkSensitiveData(e.target.value) || checkSensitiveData(newContent));
                  }}
                  placeholder="Stručný výstižný název..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <MarkdownEditor
                  label="Text příspěvku (s automatickou kontrolou na citlivé údaje) *"
                  required
                  rows={5}
                  value={newContent}
                  onChange={(val) => handleContentChange(val)}
                  placeholder="Popište vaši otázku nebo zkušenost. Neuvádějte rodná čísla, e-maily ani celá jména dětí..."
                />
              </div>

              {sensitiveWarning && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{sensitiveWarning}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={!!sensitiveWarning || isSubmittingThread}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  {isSubmittingThread && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Publikovat vlákno</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
