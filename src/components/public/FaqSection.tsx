import React, { useEffect, useState } from 'react';
import { Faq } from '../../types';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchCmsPublic } from '../../lib/cmsCache';

export const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchCmsPublic('/api/cms/faqs')
      .then((data) => { if (Array.isArray(data)) setFaqs(data); })
      .catch((err) => console.error('Error fetching FAQs:', err));
  }, []);

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Časté Dotazy (FAQ)</span>
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
          Nejčastější otázky v opatrovnickém řízení
        </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="bg-white border border-[var(--color-border,#e2e8f0)] rounded-2xl overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full text-left p-5 font-bold text-slate-900 flex items-center justify-between gap-4 text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
