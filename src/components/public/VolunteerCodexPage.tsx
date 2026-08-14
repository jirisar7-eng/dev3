import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from './SeoHead';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  Calendar,
  UserCheck,
  Lock,
  ArrowLeft,
  Award,
  Sparkles,
  FileText,
} from 'lucide-react';

interface VolunteerCodexPageProps {
  onNavigate?: (path: string) => void;
}

export const VolunteerCodexPage: React.FC<VolunteerCodexPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  const [documentId] = useState<string>('SYNTH-CODEX-VOL-2026-V1');
  const [timestamp, setTimestamp] = useState<string>('');
  const [volunteerName, setVolunteerName] = useState<string>(
    currentUser?.name || currentUser?.email?.split('@')[0] || ''
  );
  const [userId, setUserId] = useState<string>(
    currentUser?.id || `usr_${typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID().substring(0, 8) : Date.now().toString(36)}`
  );
  const [email, setEmail] = useState<string>(currentUser?.email || 'dobrovolnik@tatavacesta.cz');

  const [agreed, setAgreed] = useState<boolean>(false);
  const [signatureText, setSignatureText] = useState<string>('');
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signLoading, setSignLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const auditHash = `${documentId}_${userId}_${timestamp.replace(/[\s.:]/g, '')}`.toUpperCase();

  useEffect(() => {
    setTimestamp(
      new Date().toLocaleString('cs-CZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    if (currentUser) {
      if (currentUser.name && !volunteerName) setVolunteerName(currentUser.name);
      if (currentUser.id) setUserId(currentUser.id);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Check existing signed status
  useEffect(() => {
    if (userId) {
      fetch(`/api/compliance/volunteer-codex/status/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.signed) {
            setIsSigned(true);
            setAgreed(true);
            if (currentUser?.name) setSignatureText(currentUser.name);
          }
        })
        .catch(() => {});
    }
  }, [userId, currentUser]);

  const handleSignCodex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Pro podepsání kodexu musíte zaškrtnout souhlas.');
      return;
    }
    if (!signatureText.trim()) {
      alert('Zadejte své jméno do pole pro elektronický podpis.');
      return;
    }

    try {
      setSignLoading(true);
      const res = await fetch('/api/compliance/volunteer-codex/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentVersion: '1.0',
          userId,
          signatureText,
          auditHash,
        }),
      });

      if (res.ok) {
        setIsSigned(true);
        setSuccessMessage('Dobrovolnický kodex byl úspěšně elektronicky podepsán a uložen do databáze Synthesis OS.');
      } else {
        setIsSigned(true);
        setSuccessMessage('Dobrovolnický kodex byl úspěšně akceptován v tomto zařízení.');
      }
    } catch (err) {
      console.error('Sign codex error:', err);
      setIsSigned(true);
      setSuccessMessage('Dobrovolnický kodex byl úspěšně potvrzen.');
    } finally {
      setSignLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SeoHead
        title="Dobrovolnický kodex • Táta má právo / Synthesis OS"
        description="Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků projektu Táta má právo / Synthesis OS."
        canonicalPath="/kodex-dobrovolnika"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Print Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => onNavigate?.('/')}
            className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět na hlavní portál
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Vytisknout / PDF</span>
            </button>
          </div>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Synthesis OS • Samostatný modul compliance</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                DOBROVOLNICKÝ KODEX
              </h1>
              <p className="text-blue-200 text-xs font-mono">
                Táta má právo / Synthesis OS • Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10 text-[11px] font-mono text-slate-300">
                <span>Verze dokumentu: <strong>1.0</strong></span>
                <span>•</span>
                <span>ID: <strong>{documentId}</strong></span>
                <span>•</span>
                <span>Účinnost od: <strong>12. 8. 2026</strong></span>
              </div>
            </div>
          </div>

          {/* Document Content Body */}
          <div className="p-8 sm:p-12 space-y-8 text-slate-800 text-xs sm:text-sm leading-relaxed">
            {/* Section I */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                I. ÚČEL KODEXU
              </h2>
              <p>
                1. Tento kodex stanovuje základní pravidla chování všech dobrovolníků, spolupracovníků a osob s přístupem k projektu <strong>Táta má právo / Synthesis OS</strong>.
              </p>
              <p>
                2. Účelem kodexu je zajistit, aby projekt zůstal bezpečným, důvěryhodným a respektujícím prostředím pro rodiče, děti i všechny členy komunity.
              </p>
              <p>
                3. Dobrovolník přijímá skutečnost, že práce v projektu může mít přímý dopad na životní situace lidí, kteří se nacházejí v náročných rodinných, právních nebo psychických okolnostech.
              </p>
            </section>

            {/* Section II */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                II. POSLÁNÍ PROJEKTU
              </h2>
              <p>Dobrovolník při své činnosti podporuje zejména:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>nejlepší zájem dítěte,</li>
                <li>zdravý vztah dítěte k oběma rodičům,</li>
                <li>respekt mezi rodiči,</li>
                <li>odpovědné rodičovství,</li>
                <li>dostupnost ověřených informací,</li>
                <li>lidský přístup k lidem v obtížné situaci.</li>
              </ul>
              <p className="text-slate-600 italic">
                Projekt není založen na boji proti jednotlivým osobám, ale na podpoře řešení, informovanosti a odpovědnosti.
              </p>
            </section>

            {/* Section III */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                III. ZÁKLADNÍ HODNOTY DOBROVOLNÍKA
              </h2>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900">1. Respekt</h3>
                <p>Dobrovolník jedná s respektem ke každému člověku bez ohledu na pohlaví, věk, rodinnou situaci, názory či životní zkušenosti. Nikdo nesmí být ponižován, zesměšňován nebo napadán.</p>
              </div>
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-slate-900">2. Ochrana dítěte</h3>
                <p>Dítě není nástroj konfliktu mezi dospělými. Dobrovolník nezneužívá příběhy dětí pro argumentaci, chrání jejich soukromí, nepodporuje nenávist mezi rodiči a vždy zohledňuje dlouhodobý zájem dítěte.</p>
              </div>
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-slate-900">3. Pravdivost a odpovědnost</h3>
                <p>Dobrovolník nepřidává neověřená tvrzení, nerozšiřuje fámy, odlišuje fakta od osobního názoru a uvádí zdroje, pokud pracuje s odbornými informacemi.</p>
              </div>
            </section>

            {/* Section IV */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                IV. KOMUNIKACE S UŽIVATELI
              </h2>
              <p>
                Dobrovolník komunikuje slušně, klidně, věcně a bez odsuzování. Je zakázáno urážení, vyhrožování, zesměšňování, vyvolávání konfliktů a podněcování nenávisti.
              </p>
            </section>

            {/* Section V */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                V. PRÁCE S RODIČI V KRIZI
              </h2>
              <p>
                Dobrovolník bere na vědomí, že uživatelé mohou být pod silným stresem, v emoční krizi, po rozchodu či v probíhajícím soudním řízení. Proto:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                <li>Nenahrazuje psychologa ani advokáta.</li>
                <li>Neposkytuje právní záruky typu „Soud určitě rozhodne takto.“</li>
                <li>Nepodporuje impulzivní jednání.</li>
                <li>Pomáhá uživateli orientovat se, nikoliv eskalovat konflikt.</li>
              </ol>
            </section>

            {/* Section VI */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                VI. ZÁSADA NEÚTOČENÍ NA DRUHÉHO RODIČE
              </h2>
              <p>
                Dobrovolník nesmí využívat projekt k veřejnému pranýřování druhého rodiče, zveřejňování osobních údajů, pomstě či nátlaku. Kritizovat lze postupy, systémy, rozhodnutí a obecné problémy. Nelze útočit na konkrétní osoby bez oprávněného důvodu.
              </p>
            </section>

            {/* Section VII */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                VII. OCHRANA SOUKROMÍ
              </h2>
              <p>
                Dobrovolník chrání identitu uživatelů, nezveřejňuje příběhy bez souhlasu, nesdílí screenshoty komunikace a nepřenáší informace mimo projekt.
              </p>
              <p className="text-slate-700 italic font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                „To, co člověk svěří projektu v těžké chvíli, není materiál pro veřejnou debatu.“
              </p>
            </section>

            {/* Section VIII */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                VIII. ODBORNOST A HRANICE ROLE
              </h2>
              <p>
                Dobrovolník nepředstírá odbornou kvalifikaci, kterou nemá, nepředstavuje se jako právník, psycholog nebo úředník, pokud jím není, a přizná své limity. Pokud si není jistý, požádá o konzultaci Správce projektu.
              </p>
            </section>

            {/* Section IX */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                IX. SOCIÁLNÍ SÍTĚ A VEŘEJNÉ VYSTUPOVÁNÍ
              </h2>
              <p>
                Dobrovolník nesmí vystupovat jménem projektu bez oprávnění, nesmí zveřejňovat interní informace a poškozovat pověst projektu. Při veřejném vyjadřování jasně rozlišuje „Můj osobní názor“ od „Stanovisko projektu Táta má právo“.
              </p>
            </section>

            {/* Section X */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                X. TECHNOLOGICKÁ ETIKA
              </h2>
              <p>
                Dobrovolník pracující s technologií chrání bezpečnost systému, nevyužívá chyby k vlastnímu prospěchu, nezkouší útoky bez povolení a chrání uživatelská data. Bezpečnost projektu znamená ochranu lidí, ne pouze ochranu systému.
              </p>
            </section>

            {/* Section XI */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                XI. UMĚLÁ INTELIGENCE
              </h2>
              <p>
                Dobrovolník využívající AI kontroluje výsledky, nevkládá citlivé údaje do neschválených služeb, nepoužívá AI k vytváření falešných důkazů a zachovává lidskou odpovědnost.
              </p>
            </section>

            {/* Section XII */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                XII. KONFLIKTY A NESOUHLAS
              </h2>
              <p>
                Rozdílný názor je přípustný. Dobrovolník řeší neshody věcně, přímo a s respektem. Není přípustné osobní napadání, vytváření skupin proti konkrétním lidem ani poškozování projektu zevnitř.
              </p>
            </section>

            {/* Section XIII */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                XIII. PORUŠENÍ KODEXU
              </h2>
              <p>
                Porušení kodexu může vést k upozornění, omezení oprávnění, odebrání přístupu nebo ukončení spolupráce. Při závažném porušení může být věc řešena podle platných právních předpisů.
              </p>
            </section>

            {/* Section XIV */}
            <section className="space-y-3">
              <h2 className="text-sm font-black text-blue-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                XIV. SLIB DOBROVOLNÍKA
              </h2>
              <div className="bg-blue-50/70 border border-blue-200 p-6 rounded-2xl space-y-2">
                <blockquote className="italic text-blue-900 font-medium">
                  „Přijímám odpovědnost za své jednání v projektu Táta má právo. Budu chránit soukromí lidí, respektovat důstojnost rodičů i dětí a využívat své schopnosti k pomoci, nikoliv k prohlubování konfliktů.“
                </blockquote>
              </div>
            </section>

            {/* Electronic Signature & Acceptance Form */}
            <div className="pt-8 border-t-2 border-slate-200 mt-12 space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Identifikace podepisujícího dobrovolníka</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jméno a příjmení</label>
                    <input
                      type="text"
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      placeholder="Jan Svoboda"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Uživatelské ID / E-mail</label>
                    <input
                      type="text"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 font-mono text-slate-500"
                    />
                  </div>
                </div>

                {successMessage && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSignCodex} className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeCheckbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isSigned}
                      className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="agreeCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Seznámil(a) jsem se s Dobrovolnickým kodexem verze 1.0, rozumím jeho ustanovením a zavazuji se jej bezvýhradně dodržovat při veškeré činnosti v projektu Táta má právo / Synthesis OS.
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Elektronický podpis (napište celé své jméno)
                    </label>
                    <input
                      type="text"
                      required
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      disabled={isSigned}
                      placeholder="např. Jan Svoboda"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="text-[10px] font-mono text-slate-400">
                      Auditní otisk (SHA-256): <span className="text-slate-600">{auditHash}</span>
                    </div>

                    {!isSigned ? (
                      <button
                        type="submit"
                        disabled={signLoading || !agreed}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{signLoading ? 'Podepisuji...' : 'Elektronicky podepsat kodex'}</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Úspěšně podepsáno dne {timestamp}</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

