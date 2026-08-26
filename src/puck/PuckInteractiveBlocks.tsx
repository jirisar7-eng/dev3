import { apiFetch } from '../utils/apiClient';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  BarChart2,
  Send,
  HelpCircle,
  Image as ImageIcon,
  Columns as ColumnsIcon,
  LayoutGrid,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

// ==========================================
// 1. POLL COMPONENT (Anketa)
// ==========================================
export interface PollBlockProps {
  pollId: string;
  question: string;
  description?: string;
  optionsText?: string;
}

export const PollComponent: React.FC<PollBlockProps> = ({
  pollId = 'default-poll',
  question = 'Měly by úřady a soudy přednostně rozhodovat ve prospěch střídavé péče?',
  description = 'Hlasujte v naší bleskové anketě pro veřejnost.',
  optionsText = 'Ano, jednoznačně\nSpíše ano\nSpíše ne\nNie, vůbec\nNemám vyhraněný názor',
}) => {
  const options = React.useMemo(() => {
    if (!optionsText) return ['Ano', 'Ne'];
    return optionsText
      .split('\n')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
  }, [optionsText]);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [results, setResults] = useState<{ totalVotes: number; optionCounts: Record<number, number> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `puck_poll_voted_${pollId}`;

  useEffect(() => {
    const votedLocally = localStorage.getItem(storageKey);
    if (votedLocally) {
      setHasVoted(true);
      if (!isNaN(parseInt(votedLocally, 10))) {
        setSelectedOption(parseInt(votedLocally, 10));
      }
    }

    // Fetch initial poll stats
    let isMounted = true;
    setLoading(true);
    apiFetch(`/api/polls/${pollId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setResults({
            totalVotes: data.totalVotes || 0,
            optionCounts: data.optionCounts || {},
          });
        }
      })
      .catch((err) => console.warn('Could not load poll stats:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pollId, storageKey]);

  const handleVoteSubmit = async () => {
    if (selectedOption === null || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          optionIndex: selectedOption,
        }),
      });

      if (!res.ok) {
        throw new Error('Chyba při ukládání hlasu');
      }

      const data = await res.json();
      setResults({
        totalVotes: data.totalVotes || 0,
        optionCounts: data.optionCounts || {},
      });
      setHasVoted(true);
      localStorage.setItem(storageKey, String(selectedOption));
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se odeslat hlas.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalVotes = results?.totalVotes || 0;

  return (
    <div className="my-8 p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl border border-slate-700/60 shadow-xl max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 text-indigo-400 mb-3">
        <BarChart2 className="w-5 h-5" />
        <span className="text-xs font-bold tracking-wider uppercase">Veřejná anketa</span>
      </div>

      <h3 className="text-xl md:text-2xl font-bold mb-2 leading-snug">{question}</h3>
      {description && <p className="text-sm text-slate-300 mb-6">{description}</p>}

      {!hasVoted ? (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <label
              key={idx}
              onClick={() => setSelectedOption(idx)}
              className={`flex items-center p-3.5 px-4 rounded-xl border transition-all cursor-pointer ${
                selectedOption === idx
                  ? 'bg-indigo-600/30 border-indigo-400 text-white ring-2 ring-indigo-500/50'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name={`poll-${pollId}`}
                checked={selectedOption === idx}
                onChange={() => setSelectedOption(idx)}
                className="w-4 h-4 text-indigo-500 focus:ring-indigo-400 bg-slate-900 border-slate-600"
              />
              <span className="ml-3 text-sm md:text-base font-medium">{opt}</span>
            </label>
          ))}

          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {totalVotes > 0 ? `Zatím hlasovalo ${totalVotes} lidí` : 'Buďte první, kdo bude hlasovat'}
            </span>
            <button
              onClick={handleVoteSubmit}
              disabled={selectedOption === null || submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {submitting ? 'Odesílám...' : 'Hlasovat'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Děkujeme za váš hlas! Zde jsou aktuální výsledky ankety:</span>
          </div>

          {options.map((opt, idx) => {
            const votesCount = results?.optionCounts?.[idx] || 0;
            const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
            const isUserChoice = selectedOption === idx;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className={`font-medium ${isUserChoice ? 'text-indigo-300 font-bold' : 'text-slate-200'}`}>
                    {opt} {isUserChoice && '(Váš hlas)'}
                  </span>
                  <span className="font-semibold text-slate-400">
                    {percentage}% ({votesCount})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUserChoice ? 'bg-indigo-500' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Celkem hlasů: <strong className="text-white">{totalVotes}</strong></span>
            <button
              onClick={() => {
                setHasVoted(false);
                localStorage.removeItem(storageKey);
              }}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Změnit hlas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. FORM COMPONENT (Formulář)
// ==========================================
export interface FormBlockProps {
  formId: string;
  formName: string;
  title: string;
  description?: string;
  fieldsText?: string;
  submitButtonText?: string;
  successMessage?: string;
}

interface ParsedFormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export const FormComponent: React.FC<FormBlockProps> = ({
  formId = 'default-form',
  formName = 'Kontaktní formulář',
  title = 'Napište nám',
  description = 'Máte dotaz nebo podnět? Vyplňte formulář a my se vám co nejdříve ozveme.',
  fieldsText = 'Jméno a příjmení | text | true\nE-mailová adresa | email | true\nTelefonní číslo | tel | false\nVaše zpráva | textarea | true',
  submitButtonText = 'Odeslat zprávu',
  successMessage = 'Děkujeme, váš formulář byl úspěšně doručen. Ozveme se vám zpět.',
}) => {
  const fields = React.useMemo<ParsedFormField[]>(() => {
    if (!fieldsText) {
      return [
        { key: 'name', label: 'Jméno', type: 'text', required: true },
        { key: 'email', label: 'E-mail', type: 'email', required: true },
        { key: 'message', label: 'Zpráva', type: 'textarea', required: true },
      ];
    }

    return fieldsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => {
        const parts = line.split('|').map((p) => p.trim());
        const label = parts[0] || `Pole ${idx + 1}`;
        const type = parts[1] ? parts[1].toLowerCase() : 'text';
        const required = parts[2] ? parts[2].toLowerCase() === 'true' || parts[2] === '1' : false;
        const key = `field_${idx}_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        return { key, label, type, required };
      });
  }, [fieldsText]);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          formName,
          dataJson: JSON.stringify(formData),
        }),
      });

      if (!res.ok) {
        throw new Error('Odeslání formuláře selhalo.');
      }

      setSubmitted(true);
      setFormData({});
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se odeslat formulář.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="my-8 p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg max-w-2xl mx-auto text-slate-800 dark:text-slate-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        {description && <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>}
      </div>

      {submitted ? (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Formulář byl odeslán</h4>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Odeslat další odpověď
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {f.label} {f.required && <span className="text-rose-500">*</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  required={f.required}
                  value={formData[f.key] || ''}
                  onChange={(e) => handleInputChange(f.key, e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  placeholder={`Zadejte ${f.label.toLowerCase()}...`}
                />
              ) : (
                <input
                  type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.type === 'number' ? 'number' : 'text'}
                  required={f.required}
                  value={formData[f.key] || ''}
                  onChange={(e) => handleInputChange(f.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  placeholder={`Zadejte ${f.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Odesílám...' : submitButtonText}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ==========================================
// 3. IMAGE BLOCK (Obrázek)
// ==========================================
export interface ImageBlockProps {
  url: string;
  alt?: string;
  caption?: string;
  aspectRatio?: 'auto' | '16/9' | '4/3' | '1/1' | '21/9';
  align?: 'left' | 'center' | 'right' | 'full';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  linkUrl?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ImageBlockComponent: React.FC<ImageBlockProps> = ({
  url = 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200',
  alt = 'Ilustrační obrázek',
  caption,
  aspectRatio = 'auto',
  align = 'center',
  maxWidth = 'lg',
  borderRadius = 'xl',
  linkUrl,
  shadow = 'md',
}) => {
  const alignClass =
    align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : align === 'full' ? 'w-full' : 'mx-auto';

  const widthClass =
    maxWidth === 'sm'
      ? 'max-w-sm'
      : maxWidth === 'md'
      ? 'max-w-md'
      : maxWidth === 'lg'
      ? 'max-w-3xl'
      : maxWidth === 'xl'
      ? 'max-w-5xl'
      : 'max-w-full';

  const radiusClass =
    borderRadius === 'none'
      ? 'rounded-none'
      : borderRadius === 'sm'
      ? 'rounded-sm'
      : borderRadius === 'md'
      ? 'rounded-md'
      : borderRadius === 'lg'
      ? 'rounded-lg'
      : borderRadius === 'xl'
      ? 'rounded-xl'
      : borderRadius === '2xl'
      ? 'rounded-2xl'
      : 'rounded-full';

  const aspectClass =
    aspectRatio === '16/9'
      ? 'aspect-video object-cover'
      : aspectRatio === '4/3'
      ? 'aspect-4/3 object-cover'
      : aspectRatio === '1/1'
      ? 'aspect-square object-cover'
      : aspectRatio === '21/9'
      ? 'aspect-21/9 object-cover'
      : 'h-auto';

  const shadowClass =
    shadow === 'sm'
      ? 'shadow-sm'
      : shadow === 'md'
      ? 'shadow-md'
      : shadow === 'lg'
      ? 'shadow-lg'
      : shadow === 'xl'
      ? 'shadow-xl'
      : '';

  const imgElement = (
    <img
      src={url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200'}
      alt={alt || ''}
      className={`w-full ${aspectClass} ${radiusClass} ${shadowClass} transition-transform duration-300 hover:scale-[1.005]`}
      loading="lazy"
    />
  );

  return (
    <figure className={`my-6 ${widthClass} ${alignClass} space-y-2`}>
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {imgElement}
        </a>
      ) : (
        imgElement
      )}
      {caption && (
        <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// ==========================================
// 4. COLUMNS BLOCK (Layoutové sloupce)
// ==========================================
export interface ColumnsBlockProps {
  columnsCount: '2' | '3' | '4';
  ratio?: 'equal' | '70-30' | '30-70' | '60-40' | '40-60';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  col1Title?: string;
  col1Text?: string;
  col1Image?: string;
  col1ButtonText?: string;
  col1ButtonUrl?: string;

  col2Title?: string;
  col2Text?: string;
  col2Image?: string;
  col2ButtonText?: string;
  col2ButtonUrl?: string;

  col3Title?: string;
  col3Text?: string;
  col3Image?: string;
  col3ButtonText?: string;
  col3ButtonUrl?: string;

  col4Title?: string;
  col4Text?: string;
  col4Image?: string;
  col4ButtonText?: string;
  col4ButtonUrl?: string;
}

export const ColumnsBlockComponent: React.FC<ColumnsBlockProps> = ({
  columnsCount = '2',
  ratio = 'equal',
  gap = 'md',
  col1Title = 'První sloupec',
  col1Text = 'Obsah prvního sloupce. Můžete zde sdílet podrobnosti, články nebo výhody.',
  col1Image,
  col1ButtonText,
  col1ButtonUrl,

  col2Title = 'Druhý sloupec',
  col2Text = 'Obsah druhého sloupce vedle prvního pro přehledné porovnání nebo layout.',
  col2Image,
  col2ButtonText,
  col2ButtonUrl,

  col3Title = 'Třetí sloupec',
  col3Text = 'Obsah třetího sloupce.',
  col3Image,
  col3ButtonText,
  col3ButtonUrl,

  col4Title = 'Čtvrtý sloupec',
  col4Text = 'Obsah čtvrtého sloupce.',
  col4Image,
  col4ButtonText,
  col4ButtonUrl,
}) => {
  const gapClass =
    gap === 'sm' ? 'gap-3' : gap === 'lg' ? 'gap-8' : gap === 'xl' ? 'gap-10' : 'gap-6';

  const colsData = [
    { title: col1Title, text: col1Text, image: col1Image, btnText: col1ButtonText, btnUrl: col1ButtonUrl },
    { title: col2Title, text: col2Text, image: col2Image, btnText: col2ButtonText, btnUrl: col2ButtonUrl },
    { title: col3Title, text: col3Text, image: col3Image, btnText: col3ButtonText, btnUrl: col3ButtonUrl },
    { title: col4Title, text: col4Text, image: col4Image, btnText: col4ButtonText, btnUrl: col4ButtonUrl },
  ];

  const count = parseInt(columnsCount, 10) || 2;
  const activeCols = colsData.slice(0, count);

  // Grid layout styles
  let gridStyleClass = 'grid-cols-1 md:grid-cols-2';
  if (count === 3) gridStyleClass = 'grid-cols-1 md:grid-cols-3';
  if (count === 4) gridStyleClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  if (count === 2 && ratio === '70-30') gridStyleClass = 'grid-cols-1 md:grid-cols-12';
  if (count === 2 && ratio === '30-70') gridStyleClass = 'grid-cols-1 md:grid-cols-12';
  if (count === 2 && ratio === '60-40') gridStyleClass = 'grid-cols-1 md:grid-cols-12';
  if (count === 2 && ratio === '40-60') gridStyleClass = 'grid-cols-1 md:grid-cols-12';

  return (
    <div className={`my-8 grid ${gridStyleClass} ${gapClass} items-stretch`}>
      {activeCols.map((col, idx) => {
        let colSpanClass = '';
        if (count === 2 && ratio === '70-30') colSpanClass = idx === 0 ? 'md:col-span-8' : 'md:col-span-4';
        if (count === 2 && ratio === '30-70') colSpanClass = idx === 0 ? 'md:col-span-4' : 'md:col-span-8';
        if (count === 2 && ratio === '60-40') colSpanClass = idx === 0 ? 'md:col-span-7' : 'md:col-span-5';
        if (count === 2 && ratio === '40-60') colSpanClass = idx === 0 ? 'md:col-span-5' : 'md:col-span-7';

        return (
          <div
            key={idx}
            className={`p-6 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col justify-between shadow-xs ${colSpanClass}`}
          >
            <div className="space-y-3">
              {col.image && (
                <img
                  src={col.image}
                  alt={col.title || ''}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />
              )}
              {col.title && (
                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{col.title}</h4>
              )}
              {col.text && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {col.text}
                </p>
              )}
            </div>

            {col.btnText && (
              <div className="pt-4 mt-auto">
                <a
                  href={col.btnUrl || '#'}
                  className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {col.btnText} &rarr;
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
