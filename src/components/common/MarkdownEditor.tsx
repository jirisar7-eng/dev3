import React, { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Code,
  CheckSquare,
  Minus,
  Table,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  label?: string;
  id?: string;
  error?: string;
  required?: boolean;
  showPreviewToggle?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Napište text (podporuje Markdown formátování)...',
  rows = 6,
  minHeight = '160px',
  className = '',
  disabled = false,
  readOnly = false,
  label,
  id,
  error,
  required = false,
  showPreviewToggle = true,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Helper function to insert or wrap markdown syntax around current selection
   */
  const insertFormat = useCallback(
    (prefix: string, suffix: string = '', defaultText: string = '') => {
      if (disabled || readOnly) return;
      const textarea = textareaRef.current;
      const currentVal = value || '';

      if (!textarea) {
        onChange(currentVal + prefix + defaultText + suffix);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = currentVal.substring(start, end);

      const textToWrap = selectedText || defaultText;
      const replacement = `${prefix}${textToWrap}${suffix}`;

      const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      onChange(newVal);

      // Restore cursor position / selection asynchronously
      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          // Keep the wrapped text selected
          textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        } else {
          // Position cursor where the user should type
          const newCursorPos = start + prefix.length + defaultText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [value, onChange, disabled, readOnly]
  );

  /**
   * Insert line-based prefix (e.g. for lists, quotes, headings)
   */
  const insertLinePrefix = useCallback(
    (linePrefix: string, defaultText: string = '') => {
      if (disabled || readOnly) return;
      const textarea = textareaRef.current;
      const currentVal = value || '';

      if (!textarea) {
        onChange(currentVal + '\n' + linePrefix + defaultText);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Find the start of the current line
      const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = currentVal.indexOf('\n', end);
      const actualLineEnd = lineEnd === -1 ? currentVal.length : lineEnd;

      const currentLine = currentVal.substring(lineStart, actualLineEnd);

      let replacement: string;
      if (currentLine.startsWith(linePrefix)) {
        // Toggle off
        replacement = currentLine.substring(linePrefix.length);
      } else {
        // Toggle on or append
        replacement = currentLine ? `${linePrefix}${currentLine}` : `${linePrefix}${defaultText}`;
      }

      const newVal = currentVal.substring(0, lineStart) + replacement + currentVal.substring(actualLineEnd);
      onChange(newVal);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lineStart + replacement.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange, disabled, readOnly]
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled || readOnly) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertFormat('**', '**', 'tučný text');
          break;
        case 'i':
          e.preventDefault();
          insertFormat('*', '*', 'kurzíva');
          break;
        case 'k':
          e.preventDefault();
          insertFormat('[', '](https://example.cz)', 'text odkazu');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
          error
            ? 'border-red-300 ring-2 ring-red-100'
            : 'border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100'
        }`}
      >
        {/* Toolbar Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-slate-600">
          {/* Formatting Controls */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormat('**', '**', 'tučný text')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Tučné (Ctrl+B)"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertFormat('*', '*', 'kurzíva')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Kurzíva (Ctrl+I)"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5" />

            <button
              type="button"
              onClick={() => insertLinePrefix('## ', 'Nadpis 2')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Nadpis 2"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertLinePrefix('### ', 'Nadpis 3')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Nadpis 3"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5" />

            <button
              type="button"
              onClick={() => insertLinePrefix('- ', 'Položka seznamu')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Odrážkový seznam"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertLinePrefix('1. ', 'První položka')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Číslovaný seznam"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertLinePrefix('- [ ] ', 'Úkol k vyřízení')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Zaškrtávací seznam"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5" />

            <button
              type="button"
              onClick={() => insertLinePrefix('> ', 'Citace nebo důležitá poznámka')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Citace"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Quote className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertFormat('`', '`', 'kód')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Kód"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Code className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertFormat('[', '](https://)', 'text odkazu')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Vložit odkaz (Ctrl+K)"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n\n| Sloupec 1 | Sloupec 2 |\n| --- | --- |\n| Hodnota 1 | Hodnota 2 |\n\n')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Tabulka"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Table className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n\n---\n\n')}
              disabled={disabled || readOnly || mode === 'preview'}
              title="Oddělovač"
              className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary / Mode Controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              title="Nápověda formátování"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showHelp ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showPreviewToggle && (
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'edit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Upravit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Náhled</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formatting Quick Help Bar */}
        {showHelp && (
          <div className="bg-blue-50/80 border-b border-blue-100 p-3 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>Nápověda k formátování Markdown:</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-blue-700 hover:text-blue-950 underline text-[11px] cursor-pointer"
              >
                Zavřít
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <code>**tučný text**</code>
              </div>
              <div>
                <code>*kurzíva*</code>
              </div>
              <div>
                <code>## Nadpis 2</code>
              </div>
              <div>
                <code>- Položka seznamu</code>
              </div>
              <div>
                <code>1. Číslovaný seznam</code>
              </div>
              <div>
                <code>- [ ] Zaškrtávací úkol</code>
              </div>
              <div>
                <code>&gt; Citace textu</code>
              </div>
              <div>
                <code>[Odkaz](https://...)</code>
              </div>
            </div>
          </div>
        )}

        {/* Text Area / Preview Content */}
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            readOnly={readOnly}
            style={{ minHeight }}
            className="w-full p-3.5 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none resize-y leading-relaxed font-sans"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 bg-white text-sm text-slate-800 leading-relaxed overflow-y-auto prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-lg prose-h3:text-base prose-a:text-blue-700 prose-a:underline"
          >
            {value.trim() ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <span className="text-slate-400 italic">Žádný obsah k zobrazení. Napište text v režimu "Upravit".</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
};
