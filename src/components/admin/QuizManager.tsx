import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../types';
import {
  HelpCircle,
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
  Sparkles,
  Award,
  Layers,
  Check,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Home,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'Právní povědomí', label: 'Právní povědomí' },
  { id: 'Komunikace', label: 'Komunikace & BIFF' },
  { id: 'Péče & Zázemí', label: 'Péče & Zázemí' },
  { id: 'Psychologie rodiny', label: 'Psychologie rodiny' },
];

export const QuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Interactive Quiz Preview State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Quiz>>({
    title: '',
    slug: '',
    category: 'Právní povědomí',
    badge: '10 Otázek',
    icon: 'ShieldCheck',
    difficulty: 'MEDIUM',
    description: '',
    recommendedStudyPath: '/studia',
    order: 0,
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
    questions: [],
  });

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/quizzes');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Chyba při načítání kvízů:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      slug: '',
      category: 'Právní povědomí',
      badge: '3 Otázky',
      icon: 'ShieldCheck',
      difficulty: 'MEDIUM',
      description: '',
      recommendedStudyPath: '/studia',
      order: quizzes.length + 1,
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
      questions: [
        {
          id: 'q1',
          quizId: '',
          questionText: 'Otázka 1: Jaký je základní princip...',
          options: ['Varianta A', 'Varianta B', 'Varianta C'],
          correctAnswerIndex: 0,
          explanation: 'Vysvětlení správné odpovědi podle zákona...',
          order: 1,
        },
      ],
    });
    setSelectedQuiz(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setFormData({
      ...quiz,
      questions: (quiz.questions || []).map((q) => ({
        ...q,
        options: [...q.options],
      })),
    });
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setHasAnswered(false);
    setScore(0);
    setIsFinished(false);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Vyplňte prosím název kvízu.');
      return;
    }

    if (!formData.questions || formData.questions.length === 0) {
      alert('Kvíz musí mít alespoň 1 otázku.');
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
      if (selectedQuiz) {
        const res = await fetch(`/api/cms/quizzes/${selectedQuiz.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchQuizzes();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Uložení se nezdařilo'}`);
        }
      } else {
        const res = await fetch('/api/cms/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchQuizzes();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Vytvoření se nezdařilo'}`);
        }
      }
    } catch (err) {
      console.error('Chyba při ukládání kvízu:', err);
      alert('Chyba komunikace se serverem.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Opravdu chcete smazat kvíz "${title}" včetně všech otázek?`)) return;
    try {
      const res = await fetch(`/api/cms/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchQuizzes();
      } else {
        alert('Nepodařilo se smazat kvíz.');
      }
    } catch (err) {
      console.error('Chyba při mazání kvízu:', err);
    }
  };

  // Question Management in Form
  const handleAddQuestion = () => {
    const questions = formData.questions || [];
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      quizId: formData.id || '',
      questionText: `Nová otázka ${questions.length + 1}`,
      options: ['Možnost 1', 'Možnost 2', 'Možnost 3'],
      correctAnswerIndex: 0,
      explanation: 'Odůvodnění správné odpovědi...',
      order: questions.length + 1,
    };
    setFormData({ ...formData, questions: [...questions, newQ] });
  };

  const handleRemoveQuestion = (index: number) => {
    const questions = [...(formData.questions || [])];
    questions.splice(index, 1);
    setFormData({ ...formData, questions });
  };

  const handleUpdateQuestion = (index: number, updated: Partial<QuizQuestion>) => {
    const questions = [...(formData.questions || [])];
    questions[index] = { ...questions[index], ...updated };
    setFormData({ ...formData, questions });
  };

  const handleAddOptionToQuestion = (qIndex: number) => {
    const questions = [...(formData.questions || [])];
    const target = { ...questions[qIndex] };
    target.options = [...target.options, `Možnost ${target.options.length + 1}`];
    questions[qIndex] = target;
    setFormData({ ...formData, questions });
  };

  const handleRemoveOptionFromQuestion = (qIndex: number, optIndex: number) => {
    const questions = [...(formData.questions || [])];
    const target = { ...questions[qIndex] };
    if (target.options.length <= 2) {
      alert('Otázka musí mít alespoň 2 možnosti.');
      return;
    }
    const newOptions = [...target.options];
    newOptions.splice(optIndex, 1);
    let correct = target.correctAnswerIndex;
    if (correct >= newOptions.length) {
      correct = newOptions.length - 1;
    }
    target.options = newOptions;
    target.correctAnswerIndex = correct;
    questions[qIndex] = target;
    setFormData({ ...formData, questions });
  };

  // Filtered List
  const filteredQuizzes = quizzes.filter((q) => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return q.title.toLowerCase().includes(s) || q.description.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Kvízy & Interaktivní trenažéry (CMS)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Správa vědomostních kvízů, modelových procesních scénářů, otázek s odůvodněním a doporučených studijních cest.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="btn-create-quiz"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Vytvořit kvíz
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat kvízy podle názvu..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
          Nalezeno: <strong className="text-slate-900">{filteredQuizzes.length}</strong> kvízů
        </div>
      </div>

      {/* Quizzes List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">Načítání kvízů...</div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Nebyly nalezeny žádné kvízy.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Award className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {quiz.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {quiz.badge || `${quiz.questions?.length || 0} Otázek`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                        {quiz.difficulty}
                      </span>

                      {quiz.status === 'PUBLISHED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Publikováno
                        </span>
                      )}
                      {quiz.status === 'DRAFT' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Koncept
                        </span>
                      )}
                      {quiz.status === 'ARCHIVED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Archive className="w-3 h-3" /> Archiv
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{quiz.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>Otázek v testu: {quiz.questions?.length || 0}</span>
                      <span>•</span>
                      <span>Slug: /{quiz.slug}</span>
                      <span>•</span>
                      <span>Doporučení: {quiz.recommendedStudyPath}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenPreview(quiz)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Spustit a otestovat kvíz"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(quiz)}
                    className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                    title="Upravit kvíz"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                    title="Smazat kvíz"
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                {selectedQuiz ? 'Upravit kvíz & otázky' : 'Vytvořit nový interaktivní kvíz'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Název kvízu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Např. Test právního povědomí: Práva rodičů v soudním řízení"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Slug</label>
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
                    value={formData.category || 'Právní povědomí'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Právní povědomí">Právní povědomí</option>
                    <option value="Komunikace">Komunikace & BIFF</option>
                    <option value="Péče & Zázemí">Péče & Zázemí</option>
                    <option value="Psychologie rodiny">Psychologie rodiny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Obtížnost</label>
                  <select
                    value={formData.difficulty || 'MEDIUM'}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="EASY">EASY (Základní)</option>
                    <option value="MEDIUM">MEDIUM (Střední)</option>
                    <option value="HARD">HARD (Pokročilá)</option>
                  </select>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Odznak / Badge</label>
                  <input
                    type="text"
                    value={formData.badge || '10 Otázek'}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="10 Otázek / Diagnostický Test"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doporučená studijní cesta (URL)</label>
                  <input
                    type="text"
                    value={formData.recommendedStudyPath || '/studia'}
                    onChange={(e) => setFormData({ ...formData, recommendedStudyPath: e.target.value })}
                    placeholder="/studia nebo /wiki nebo /pruvodce"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Popis trenažéru</label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Co se uživatel v testu naučí a jaké principy prověří..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Otázky a možnosti odpovědí ({formData.questions?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Přidat otázku
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={q.questionText}
                            onChange={(e) => handleUpdateQuestion(qIdx, { questionText: e.target.value })}
                            placeholder="Znění otázky..."
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50"
                          title="Smazat otázku"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="pl-8 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">
                          Možnosti odpovědí (zaškrtněte správnou):
                        </div>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctAnswerIndex === optIdx}
                              onChange={() => handleUpdateQuestion(qIdx, { correctAnswerIndex: optIdx })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              title="Označit jako správnou odpověď"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateQuestion(qIdx, { options: newOpts });
                              }}
                              className={`flex-1 px-3 py-1.5 border rounded-xl text-xs ${
                                q.correctAnswerIndex === optIdx
                                  ? 'border-emerald-500 bg-emerald-50/50 font-semibold'
                                  : 'border-slate-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromQuestion(qIdx, optIdx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Odstranit možnost"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddOptionToQuestion(qIdx)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" /> Přidat možnost odpovědi
                        </button>
                      </div>

                      {/* Explanation */}
                      <div className="pl-8 pt-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Právní / Psychologické odůvodnění správné odpovědi:
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                          placeholder="Např. Podle § 907 odst. 2 občanského zákoníku..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
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
                      placeholder="Titulek pro vyhledávače"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Description</label>
                    <textarea
                      rows={2}
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Meta popis pro vyhledávače"
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
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" /> Uložit kvíz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Preview Modal */}
      {isPreviewModalOpen && selectedQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedQuiz.category} • {selectedQuiz.difficulty}
                </span>
                <h3 className="text-sm font-bold">{selectedQuiz.title}</h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {!isFinished ? (
                <>
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>
                        Otázka {currentQuestionIdx + 1} z {selectedQuiz.questions.length}
                      </span>
                      <span>Skóre: {score} bodů</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${((currentQuestionIdx + 1) / selectedQuiz.questions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  {selectedQuiz.questions[currentQuestionIdx] && (
                    <div className="space-y-4">
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {selectedQuiz.questions[currentQuestionIdx].questionText}
                      </h4>

                      <div className="space-y-2">
                        {selectedQuiz.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                          const isSelected = selectedOptionIdx === optIdx;
                          const isCorrect =
                            selectedQuiz.questions[currentQuestionIdx].correctAnswerIndex === optIdx;

                          let btnClass = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnClass = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                            }
                          } else if (isSelected) {
                            btnClass = 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => setSelectedOptionIdx(optIdx)}
                              className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${btnClass}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {hasAnswered && isSelected && !isCorrect && (
                                <X className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Submit / Next Button */}
                      {!hasAnswered ? (
                        <button
                          disabled={selectedOptionIdx === null}
                          onClick={() => {
                            if (selectedOptionIdx === null) return;
                            const isCorrect =
                              selectedOptionIdx ===
                              selectedQuiz.questions[currentQuestionIdx].correctAnswerIndex;
                            if (isCorrect) setScore((prev) => prev + 1);
                            setHasAnswered(true);
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all"
                        >
                          Zkontrolovat odpověď
                        </button>
                      ) : (
                        <div className="space-y-4">
                          {selectedQuiz.questions[currentQuestionIdx].explanation && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                              <strong className="block text-slate-900 uppercase text-[10px]">Odůvodnění:</strong>
                              <p>{selectedQuiz.questions[currentQuestionIdx].explanation}</p>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (currentQuestionIdx + 1 < selectedQuiz.questions.length) {
                                setCurrentQuestionIdx((prev) => prev + 1);
                                setSelectedOptionIdx(null);
                                setHasAnswered(false);
                              } else {
                                setIsFinished(true);
                              }
                            }}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            {currentQuestionIdx + 1 < selectedQuiz.questions.length
                              ? 'Další otázka'
                              : 'Zobrazit výsledek kvízu'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Results */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Award className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Kvíz úspěšně dokončen!</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Dosáhli jste <strong>{score}</strong> správných odpovědí z{' '}
                      <strong>{selectedQuiz.questions.length}</strong> (
                      {Math.round((score / selectedQuiz.questions.length) * 100)}%).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Doporučený další krok:</span>
                    <p className="text-slate-800 font-semibold">
                      Prohloubte své znalosti v modulu: <code>{selectedQuiz.recommendedStudyPath}</code>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentQuestionIdx(0);
                      setSelectedOptionIdx(null);
                      setHasAnswered(false);
                      setScore(0);
                      setIsFinished(false);
                    }}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Spustit znovu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
