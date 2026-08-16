import React, { useState } from 'react';
import {
  SchemaDrivenContent,
  SchemaComponent,
  SchemaComponentItem,
} from '../../types';
import {
  ShieldAlert,
  FileText,
  Users,
  Scale,
  HelpCircle,
  Box,
  Heart,
  Phone,
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Zap,
  ExternalLink,
  Send,
  Sparkles,
} from 'lucide-react';

interface SchemaDrivenRendererProps {
  contentJson: string | SchemaDrivenContent;
  title?: string;
  category?: string;
  onNavigate?: (path: string) => void;
}

// Helper to render dynamic Lucide icons by name
export const DynamicIcon: React.FC<{ name?: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  if (!name) return <Box className={className} />;

  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    ShieldAlert,
    Shield: ShieldAlert,
    FileText,
    Users,
    Scale,
    HelpCircle,
    Box,
    Heart,
    Phone,
    Calendar,
    MessageSquare,
    CheckCircle2,
    AlertTriangle,
    BookOpen,
    Zap,
    Info,
    Sparkles,
  };

  const IconComp = iconMap[name] || iconMap[name.charAt(0).toUpperCase() + name.slice(1)] || Box;
  return <IconComp className={className} />;
};

export const SchemaDrivenRenderer: React.FC<SchemaDrivenRendererProps> = ({
  contentJson,
  title: fallbackTitle,
  category,
  onNavigate,
}) => {
  const [formSubmissions, setFormSubmissions] = useState<Record<string, boolean>>({});
  const [openAccordions, setOpenAccordions] = useState<Record<string, number | null>>({});

  const handleNav = (link?: string) => {
    if (!link) return;
    if (onNavigate) {
      onNavigate(link);
    } else if (typeof window !== 'undefined') {
      window.location.href = link;
    }
  };

  // Parse schema JSON safely
  let schemaData: SchemaDrivenContent = { sections: [] };
  try {
    if (typeof contentJson === 'string') {
      schemaData = JSON.parse(contentJson);
    } else {
      schemaData = contentJson;
    }
  } catch (err) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
        <div className="font-bold flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Chyba v zápisu JSON schématu
        </div>
        <p className="font-mono text-[11px] opacity-80">Nelze zobrazení sestavit. Zkontrolujte strukturu JSON modulu.</p>
      </div>
    );
  }

  const sections = schemaData.sections || [];

  const getBadgeColorClass = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'slate':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'blue':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const toggleAccordion = (sectionIdx: number, itemIdx: number) => {
    setOpenAccordions((prev) => {
      const current = prev[sectionIdx];
      return {
        ...prev,
        [sectionIdx]: current === itemIdx ? null : itemIdx,
      };
    });
  };

  const handleFormSubmit = (e: React.FormEvent, formKey: string) => {
    e.preventDefault();
    setFormSubmissions((prev) => ({ ...prev, [formKey]: true }));
    setTimeout(() => {
      setFormSubmissions((prev) => ({ ...prev, [formKey]: false }));
    }, 6000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Category header if present */}
      {(category || schemaData.title || fallbackTitle) && (
        <div className="pb-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div>
            {category && (
              <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                {category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {schemaData.title || fallbackTitle}
            </h1>
            {schemaData.description && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {schemaData.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Render Dynamic Sections */}
      {sections.map((sec: SchemaComponent, secIdx: number) => {
        const secKey = sec.id || `section-${secIdx}`;

        switch (sec.type) {
          // ================= HERO SECTION =================
          case 'hero':
            return (
              <div
                key={secKey}
                className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800"
              >
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-4">
                  {sec.badge && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${getBadgeColorClass(
                        sec.badgeColor
                      )}`}
                    >
                      {sec.badge}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {sec.subtitle}
                    </p>
                  )}
                  {sec.buttonText && sec.buttonLink && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleNav(sec.buttonLink)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
                      >
                        <span>{sec.buttonText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );

          // ================= GRID / CARDS SECTION =================
          case 'grid':
          case 'cards':
            const cols = sec.columns || 3;
            const gridColsClass =
              cols === 1
                ? 'grid-cols-1'
                : cols === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : cols === 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

            return (
              <div key={secKey} className="space-y-4">
                {(sec.title || sec.subtitle) && (
                  <div>
                    {sec.title && (
                      <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>
                    )}
                    {sec.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5">{sec.subtitle}</p>
                    )}
                  </div>
                )}
                <div className={`grid ${gridColsClass} gap-4`}>
                  {(sec.items || []).map((item: SchemaComponentItem, itemIdx: number) => (
                    <div
                      key={itemIdx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                            <DynamicIcon name={item.icon} className="w-5 h-5 text-blue-700" />
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColorClass(
                                item.badgeColor
                              )}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.title && (
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-900 transition-colors">
                            {item.title}
                          </h4>
                        )}
                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.link && (
                        <button
                          onClick={() => handleNav(item.link)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer pt-2"
                        >
                          <span>{item.linkText || 'Detail'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );

          // ================= ACCORDION / FAQ SECTION =================
          case 'accordion':
          case 'faq':
            return (
              <div key={secKey} className="space-y-4">
                {sec.title && <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>}
                <div className="space-y-2.5">
                  {(sec.items || []).map((item: SchemaComponentItem, itemIdx: number) => {
                    const isOpen = openAccordions[secIdx] === itemIdx;
                    return (
                      <div
                        key={itemIdx}
                        className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs"
                      >
                        <button
                          onClick={() => toggleAccordion(secIdx, itemIdx)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-bold text-slate-900 text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span>{item.question || item.title}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-blue-700 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed bg-slate-50/50">
                            {item.answer || item.content || item.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );

          // ================= ALERT / CALLOUT SECTION =================
          case 'callout':
          case 'alert':
            const variant = sec.variant || 'info';
            const alertStyles = {
              info: 'bg-blue-50 border-blue-200 text-blue-900',
              warning: 'bg-amber-50 border-amber-200 text-amber-900',
              success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
              danger: 'bg-rose-50 border-rose-200 text-rose-900',
              primary: 'bg-slate-900 text-white border-slate-800',
              secondary: 'bg-slate-100 text-slate-900 border-slate-200',
            }[variant];

            return (
              <div
                key={secKey}
                className={`p-5 rounded-2xl border ${alertStyles} shadow-2xs flex items-start gap-3.5`}
              >
                <div className="shrink-0 mt-0.5">
                  <DynamicIcon name={sec.icon || (variant === 'danger' ? 'AlertTriangle' : 'Info')} className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  {sec.title && <h4 className="font-bold">{sec.title}</h4>}
                  {(sec.description || sec.content) && (
                    <p className="leading-relaxed opacity-90">{sec.description || sec.content}</p>
                  )}
                </div>
              </div>
            );

          // ================= STATS SECTION =================
          case 'stats':
            return (
              <div key={secKey} className="space-y-4">
                {sec.title && <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(sec.items || []).map((item: SchemaComponentItem, itemIdx: number) => (
                    <div
                      key={itemIdx}
                      className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-2xs"
                    >
                      <div className="text-2xl sm:text-3xl font-black text-blue-900">
                        {item.value}
                      </div>
                      <div className="text-xs font-bold text-slate-700">{item.label || item.title}</div>
                      {item.subtitle && <div className="text-[10px] text-slate-500">{item.subtitle}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );

          // ================= FORM SECTION =================
          case 'form':
            const formKey = `form-${secIdx}`;
            const isSubmitted = formSubmissions[formKey];

            return (
              <div key={secKey} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                {sec.title && <h3 className="text-lg font-bold text-slate-900">{sec.title}</h3>}
                {sec.description && <p className="text-xs text-slate-600">{sec.description}</p>}

                {isSubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{sec.submitMessage || 'Formulář byl úspěšně odeslán. Děkujeme!'}</span>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, formKey)} className="space-y-3">
                    {(sec.fields || []).map((field, fIdx) => (
                      <div key={fIdx}>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            required={field.required}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Vyberte...</option>
                            {(field.options || []).map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sec.submitLabel || 'Odeslat'}</span>
                    </button>
                  </form>
                )}
              </div>
            );

          // ================= CTA SECTION =================
          case 'cta':
            return (
              <div
                key={secKey}
                className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800"
              >
                <div className="space-y-1 text-center sm:text-left">
                  {sec.title && <h3 className="text-xl font-bold">{sec.title}</h3>}
                  {sec.description && <p className="text-xs text-slate-300">{sec.description}</p>}
                </div>
                {sec.buttonText && sec.buttonLink && (
                  <button
                    onClick={() => handleNav(sec.buttonLink)}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {sec.buttonText}
                  </button>
                )}
              </div>
            );

          // ================= TEXT / CONTENT SECTION =================
          case 'text':
          default:
            return (
              <div key={secKey} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                {sec.title && <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>}
                {sec.subtitle && <h4 className="text-sm font-semibold text-slate-600">{sec.subtitle}</h4>}
                {(sec.content || sec.description) && (
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {sec.content || sec.description}
                  </div>
                )}
              </div>
            );
        }
      })}
    </div>
  );
};

export default SchemaDrivenRenderer;
