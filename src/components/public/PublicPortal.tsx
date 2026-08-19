import React, { useState, useEffect } from 'react';
import { VolunteersPage } from './VolunteersPage';
import { Hero } from './Hero';
import { CorePrincipleCard } from './CorePrincipleCard';
import { ArticlesSection } from './ArticlesSection';
import { FaqSection } from './FaqSection';
import { ModulesSection } from './ModulesSection';
import { CmsPageRenderer } from './CmsPageRenderer';
import { PublicComplianceView } from './PublicComplianceView';
import { VolunteerAgreementPage } from './VolunteerAgreementPage';
import { VolunteerCodexPage } from './VolunteerCodexPage';
import { GdprComplianceCenterPage } from './GdprComplianceCenterPage';
import { FounderStoryPage } from './FounderStoryPage';
import { UserManualPage } from './UserManualPage';
import { SitemapPage } from './SitemapPage';
import { StudyLibraryPage } from './StudyLibraryPage';
import { StateLawsView } from './StateLawsView';
import { StateStatisticsView } from './StateStatisticsView';
import { CaseDatabaseView } from './CaseDatabaseView';
import { PartnersView } from './PartnersView';
import { AboutView } from './AboutView';
import { ContactView } from './ContactView';
import { SponsorsView } from './SponsorsView';
import { ArticleDetailView } from './ArticleDetailView';
import { LegalHubPage } from '../../pages/LegalHubPage';
import { LegalDocsPage } from '../../pages/LegalDocsPage';
import { MyCasePage } from '../../pages/MyCasePage';
import { CoParentHubPage } from '../../pages/CoParentHubPage';
import SupportUsPage from "../../pages/SupportUsPage";
import { AiContextView } from './AiContextView';
import {
  CrisisCommunityPortal,
  SosPlanView,
  ForumView,
  CaseStoriesView,
  MementoView,
  LegalHelpView,
  SupportView
} from './community';
import { RegistrSubjektu } from './RegistrSubjektu';
import {
  AiAssistantView,
  AiGuideView,
  AiCaseManagerView,
  AiSimulatorView,
  AiFormsView
} from './ai';
import {
  AgendaView,
  RightsView,
  CaseLawView,
  DocumentsView
} from './legal';
import {
  StudiesView,
  VideothequeView,
  QuizzesView,
  WikiView
} from './academy';
import { SeoHead } from './SeoHead';
import { useText } from '../../context/TextContext';
import { Send, CheckCircle2, MessageSquare, Phone, Mail, MapPin } from 'lucide-react';

interface PublicPortalProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser?: { id: string; email?: string; name?: string } | null;
  onOpenCookieSettings?: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ currentPath, onNavigate, currentUser, onOpenCookieSettings }) => {
  const { t } = useText();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactMessage, setContactMessage] = useState({ name: '', email: '', phone: '', subject: '', text: '' });

  // Extract slug from path (e.g. "/o-projektu" -> "o-projektu")
  const rawPath = currentPath.split('?')[0].split('#')[0];
  const cleanPath = rawPath === '' || rawPath === '/' ? '/' : rawPath;
  const slug = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

  const COMPLIANCE_SLUGS = [
    'podminky-uzivani',
    'gdpr',
    'cookies',
    'moje-pravni-dokumenty',
    'dobrovolnicky-kodex',
    'ai-prohlaseni',
    'terms',
    'privacy',
    'legal',
    'volunteer_code',
    'ai_statement',
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactMessage({ name: '', email: '', phone: '', subject: '', text: '' });
    }, 5000);
  };

  // 0. Volunteers Route (/dobrovolnici, /o-projektu/dobrovolnici)
  if (slug === 'dobrovolnici' || slug === 'hledame-kolegy' || slug === 'o-projektu/dobrovolnici') {
    return <VolunteersPage onNavigate={onNavigate} />;
  }

  // 0.1 My Case / Osobní spis otce (/muj-pripad)
  if (slug === 'muj-pripad' || slug === 'pripad' || slug === 'moje-slozka') {
    return (
      <div className="space-y-4 pt-2">
        <SeoHead
          title="Můj případ • Osobní klientská složka otce"
          description="Komplexní digitální spis otce pro správu dětí, termínů, soudních řízení, zpráv OSPOD a důkazních materiálů."
          canonicalPath="/muj-pripad"
        />
        <MyCasePage onNavigate={onNavigate} />
      </div>
    );
  }

  // 0.3 AI Context & Machine Index (/ai-context)
  if (slug === 'ai-context') {
    return <AiContextView onNavigate={onNavigate} />;
  }

  // 0.2 CoParent Hub (/coparent-hub, /coparent)
  if (slug === 'coparent-hub' || slug === 'coparent' || slug === 'spolurodicovsky-hub') {
    return <CoParentHubPage onNavigate={onNavigate} />;
  }

  // 1. Homepage Route
  if (cleanPath === '/' || slug === 'domu') {
    return (
      <div className="space-y-4">
        <SeoHead
          title="Táta má právo • Pro nejlepší zájem dítěte"
          description="Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE."
          canonicalPath="/"
        />
        <Hero />
        <CorePrincipleCard />
        <ArticlesSection onNavigate={onNavigate} />
        <ModulesSection onNavigate={onNavigate} />
        <FaqSection />
      </div>
    );
  }

  // 2. Articles Route (/clanky, /clanky/:slug, /metodika, /metodika/:slug)
  if (slug === 'clanky' || slug.startsWith('clanky/') || slug === 'metodika' || slug.startsWith('metodika/')) {
    if (slug.startsWith('clanky/') || slug.startsWith('metodika/')) {
      const articleSlug = slug.replace(/^clanky\//, '').replace(/^metodika\//, '');
      return <ArticleDetailView slug={articleSlug} onNavigate={onNavigate} />;
    }
    return (
      <div className="space-y-4 pt-4">
        <SeoHead
          title="Články & Judikatura"
          description="Odborné články, rozbory soudních rozhodnutí a praktická doporučení pro otce v opatrovnické praxi."
          canonicalPath="/clanky"
        />
        <ArticlesSection onNavigate={onNavigate} />
      </div>
    );
  }

  // 3. FAQ Route (/faq)
  if (slug === 'faq') {
    return (
      <div className="space-y-4 pt-4">
        <SeoHead
          title="Časté dotazy (FAQ)"
          description="Odpovědi na nejčastější otázky otců ohledně střídavé péče, výživného, OSPOD a opatrovnických soudů."
          canonicalPath="/faq"
        />
        <FaqSection />
      </div>
    );
  }

  // 3a. Krizová pomoc & Komunita Routes
  if (slug === 'krizova-pomoc') {
    return <CrisisCommunityPortal onNavigate={onNavigate} />;
  }
  if (slug === 'sos-plan' || slug === 'crisis') {
    return <SosPlanView onNavigate={onNavigate} />;
  }
  if (slug === 'forum') {
    return <ForumView onNavigate={onNavigate} />;
  }
  if (slug === 'pribehy' || slug === 'stories') {
    return <CaseStoriesView onNavigate={onNavigate} />;
  }
  if (slug === 'memento') {
    return <MementoView onNavigate={onNavigate} />;
  }
  if (slug === 'pravni-poradna' || slug === 'advice') {
    return <LegalHelpView onNavigate={onNavigate} />;
  }
  if (slug === 'podpora' || slug === 'support') {
    return <SupportView onNavigate={onNavigate} />;
  }

  // 3a1. AI Nástroje Routes
  if (slug === 'ai-asistent' || slug === 'ai-assistant') {
    return <AiAssistantView onNavigate={onNavigate} />;
  }
  if (slug === 'ai-pruvodce' || slug === 'ai-guide' || slug === 'pruvodce') {
    return <AiGuideView onNavigate={onNavigate} />;
  }
  if (slug === 'ai-case-manager' || slug === 'case-manager' || slug === 'rozbor-spisu') {
    return <AiCaseManagerView onNavigate={onNavigate} />;
  }
  if (slug === 'ai-simulator' || slug === 'simulator' || slug === 'plan-pece' || slug === 'kalkulacka-vyzivneho' || slug === 'simulator-predavani') {
    return <AiSimulatorView onNavigate={onNavigate} />;
  }
  if (slug === 'ai-formulare' || slug === 'centrum-formularu' || slug === 'formulare') {
    return <AiFormsView onNavigate={onNavigate} />;
  }

  // 3a2. Opatrovnictví & Právo Routes (/agenda, /prava, /judikatura, /dokumenty, /registr-subjektu)
  if (slug === 'registr-subjektu' || slug === 'subjekty' || slug === 'hodnoceni-subjektu' || slug === 'hodnoceni') {
    return <RegistrSubjektu onNavigate={onNavigate} />;
  }
  if (slug === 'agenda' || slug === 'opatrovnicka-agenda') {
    return <AgendaView onNavigate={onNavigate} />;
  }
  if (slug === 'prava' || slug === 'rights') {
    return <RightsView onNavigate={onNavigate} />;
  }
  if (slug === 'judikatura' || slug === 'pripadova-databaze' || slug === 'rozsudky' || slug === 'pripady') {
    return <CaseLawView onNavigate={onNavigate} />;
  }
  if (slug === 'dokumenty' || slug === 'ke-stazeni' || slug === 'vzory') {
    return <DocumentsView onNavigate={onNavigate} />;
  }

  // 3a3. Akademie Routes (/studia, /videoteka, /kvizy, /wiki)
  if (slug === 'studia' || slug === 'knihovna-studii' || slug === 'kurzy') {
    return <StudiesView onNavigate={onNavigate} />;
  }
  if (slug === 'videoteka' || slug === 'videa' || slug === 'webinare') {
    return <VideothequeView onNavigate={onNavigate} />;
  }
  if (slug === 'kvizy' || slug === 'vzdelavani' || slug === 'trenazer') {
    return <QuizzesView onNavigate={onNavigate} />;
  }
  if (slug === 'wiki' || slug === 'legal-wiki' || slug === 'slovnik' || slug === 'pojmy') {
    return <WikiView onNavigate={onNavigate} />;
  }

  // 3b. Scientific Studies Route (/studie)
  if (slug === 'studie' || slug.startsWith('studie/')) {
    return (
      <div className="space-y-4 pt-2">
        <SeoHead
          title="Vědecké studie • Táta má právo"
          description="Knihovna recenzovaných vědeckých studií o přespávání kojenců, střídavé péči a citové vazbě pro opatrovnické soudy a OSPOD."
          canonicalPath="/studie"
        />
        <StudyLibraryPage />
      </div>
    );
  }

  // 3c. State Data Routes: e-Sbírka / Laws (/state-laws, /e-sbirka, /zakony)
  if (slug === 'state-laws' || slug === 'e-sbirka' || slug === 'zakony' || slug === 'e-legislativa') {
    return <StateLawsView />;
  }

  // 3d. State Data Routes: Statistics (/state-statistics, /statistiky, /statistika)
  if (slug === 'state-statistics' || slug === 'statistiky' || slug === 'statistika') {
    return <StateStatisticsView />;
  }

  // 3f. About Project Routes (/o-nas, /kontakt, /sponzori, /partneri)
  if (slug === 'o-nas' || slug === 'o-projektu') {
    const isPuckEnabled = typeof window !== 'undefined' && localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true';
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="o-projektu" onNavigate={onNavigate} />;
    }
    return <AboutView onNavigate={onNavigate} />;
  }
  if (slug === 'kontakt') {
    return <ContactView onNavigate={onNavigate} />;
  }
  if (slug === 'podporte-nas' || slug === 'podpora-a-spolek') { return <SupportUsPage />; }

  if (slug === 'partneri' || slug === 'partners') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_PARTNERI_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="partneri" onNavigate={onNavigate} fallbackComponent={<PartnersView />} />;
    }
    return <PartnersView />;
  }

  if (slug === 'sponzori' || slug === 'sponsors') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_SPONZORI_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="sponzori" onNavigate={onNavigate} fallbackComponent={<PartnersView />} />;
    }
    return <PartnersView />;
  }

  // 3c. Volunteer Agreement Route (/dohoda-o-spolupraci, /e-dohoda, /volunteer-agreement, /e-dohoda-dobrovolnika)
  if (
    slug === 'dohoda-o-spolupraci' ||
    slug === 'e-dohoda' ||
    slug === 'volunteer-agreement' ||
    slug === 'dohoda-o-dobrovolne-spolupraci' ||
    slug === 'e-dohoda-dobrovolnika' ||
    slug === 'dohoda-dobrovolnika'
  ) {
    return <VolunteerAgreementPage onNavigate={onNavigate} />;
  }

  // 3d. Volunteer Codex Route (/kodex-dobrovolnika, /volunteer-code)
  if (slug === 'kodex-dobrovolnika' || slug === 'volunteer-code') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="kodex-dobrovolnika" onNavigate={onNavigate} fallbackComponent={<VolunteerCodexPage onNavigate={onNavigate} />} />;
    }
    return <VolunteerCodexPage onNavigate={onNavigate} />;
  }

  // 3e. GDPR Compliance Center & Privacy Policy Route (/zasady-ochrany-osobnich-udaju, /privacy-policy, /gdpr, /gdpr-center)
  if (slug === 'zasady-ochrany-osobnich-udaju' || slug === 'privacy-policy' || slug === 'gdpr' || slug === 'gdpr-center') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_PRIVACY_POLICY_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="zasady-ochrany-osobnich-udaju" onNavigate={onNavigate} fallbackComponent={<GdprComplianceCenterPage onNavigate={onNavigate} />} />;
    }
    return <GdprComplianceCenterPage onNavigate={onNavigate} />;
  }

  // 3f. Founder Story Route (/cesta-zakladatele)
  if (slug === 'cesta-zakladatele') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');
    if (isPuckEnabled) {
      return <CmsPageRenderer slug="cesta-zakladatele" onNavigate={onNavigate} fallbackComponent={<FounderStoryPage onNavigate={onNavigate} />} />;
    }
    return <FounderStoryPage onNavigate={onNavigate} />;
  }

  // 4. Contact Route (/kontakt) with Interactive Form & CMS Renderer
  if (slug === 'kontakt') {
    return (
      <div className="space-y-8">
        <CmsPageRenderer slug="kontakt" onNavigate={onNavigate} />

        {/* Contact Interactive Form Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Napište nám
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                Kontaktní formulář poradny
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Máte dotaz k opatrovnickému řízení, jednání s OSPOD nebo potřebujete nasměrovat? Napište nám a náš tým se vám ozve zpět.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">E-mail</span>
                    <strong className="text-slate-900">info@tatovacesta.cz</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Infolinka</span>
                    <strong className="text-slate-900">+420 800 123 456</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sídlo spolku</span>
                    <strong className="text-slate-900">Praha, Česká republika</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              {contactSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Zpráva byla úspěšně odeslána</h4>
                  <p className="text-xs text-slate-600">
                    Děkujeme za váš dotaz. Naši poradci váš požadavak zpracují a ozvou se vám na zadaný e-mail.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jméno a příjmení
                    </label>
                    <input
                      type="text"
                      required
                      value={contactMessage.name}
                      onChange={(e) => setContactMessage({ ...contactMessage, name: e.target.value })}
                      placeholder="Jan Svoboda"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        required
                        value={contactMessage.email}
                        onChange={(e) => setContactMessage({ ...contactMessage, email: e.target.value })}
                        placeholder="jan@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Telefon (volitelné)
                      </label>
                      <input
                        type="tel"
                        value={contactMessage.phone}
                        onChange={(e) => setContactMessage({ ...contactMessage, phone: e.target.value })}
                        placeholder="+420 777 ..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Předmět dotazu
                    </label>
                    <input
                      type="text"
                      required
                      value={contactMessage.subject}
                      onChange={(e) => setContactMessage({ ...contactMessage, subject: e.target.value })}
                      placeholder="Např. Příprava na jednání OSPOD"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Text dotazu
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage.text}
                      onChange={(e) => setContactMessage({ ...contactMessage, text: e.target.value })}
                      placeholder="Popište stručně svou situaci..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Odeslat zprávu do poradny</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4b. Central Legal Hub & Compliance Documents Route (/pravni-dokumenty, /smlouva-dobrovolnik, and all individual compliance slugs)
  if (slug === 'pravni-dokumenty' || slug === 'smlouva-dobrovolnik' || COMPLIANCE_SLUGS.includes(slug)) {
    const initialKey = slug === 'smlouva-dobrovolnik' ? 'dohoda-o-spolupraci' : (slug === 'pravni-dokumenty' ? undefined : slug);
    return <LegalDocsPage onNavigate={onNavigate} initialDocKey={initialKey} />;
  }

  // 5. User Manual Route (/user-manual)
  if (slug === 'user-manual') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_USER_MANUAL_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');

    if (isPuckEnabled) {
      return <CmsPageRenderer slug="user-manual" onNavigate={onNavigate} fallbackComponent={<UserManualPage onNavigate={onNavigate} />} />;
    }
    return <UserManualPage onNavigate={onNavigate} />;
  }

  // 6. Sitemap Route (/sitemap)
  if (slug === 'sitemap') {
    const isPuckEnabled =
      typeof window !== 'undefined' &&
      (localStorage.getItem('PUCK_SITEMAP_RENDERER_ENABLED') === 'true' ||
       localStorage.getItem('PUCK_PUBLIC_RENDERER_ENABLED') === 'true');

    if (isPuckEnabled) {
      return <CmsPageRenderer slug="sitemap" onNavigate={onNavigate} fallbackComponent={<SitemapPage onNavigate={onNavigate} />} />;
    }
    return <SitemapPage onNavigate={onNavigate} />;
  }

  // 7. Default CMS Page Router for all other slugs (/o-projektu, /zivotni-situace, /dobrovolnictvi, etc.)
  return <CmsPageRenderer slug={slug} onNavigate={onNavigate} />;
};
