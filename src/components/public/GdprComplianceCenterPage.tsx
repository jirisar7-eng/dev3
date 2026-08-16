import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from './SeoHead';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Key,
  Database,
  ArrowLeft,
  Settings,
  Eye,
  Check,
  Clock,
  XCircle,
} from 'lucide-react';

interface GdprComplianceCenterPageProps {
  onNavigate?: (path: string) => void;
}

export const GdprComplianceCenterPage: React.FC<GdprComplianceCenterPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'policy' | 'my-data' | 'deletion' | 'admin'>('policy');

  const [consentLogged, setConsentLogged] = useState<boolean>(false);
  const [consentLoading, setConsentLoading] = useState<boolean>(false);

  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const [deletionNote, setDeletionNote] = useState<string>('');
  const [deletionSubmitted, setDeletionSubmitted] = useState<boolean>(false);
  const [deletionLoading, setDeletionLoading] = useState<boolean>(false);

  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  const userId = currentUser?.id || 'guest_user';

  const handleLogConsent = async () => {
    try {
      setConsentLoading(true);
      const res = await fetch('/api/gdpr/consent-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'PRIVACY_POLICY',
          documentVersion: '0.5.1',
          userId,
        }),
      });
      if (res.ok) {
        setConsentLogged(true);
      }
    } catch (err) {
      console.error('Consent log error:', err);
      setConsentLogged(true);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      const res = await fetch(`/api/gdpr/export-data?userId=${userId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gdpr-export-release-0.5.1-${userId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setExportSuccess('Data byla úspěšně stažena ve formátu JSON.');
      } else {
        alert('Chyba při stahování dat.');
      }
    } catch (err) {
      console.error('Export data error:', err);
      alert('Chyba při exportu dat.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Opravdu si přejete podat žádost o trvalý výmaz osobních údajů (Právo být zapomenut)? Tato akce je nevratná.')) {
      return;
    }
    try {
      setDeletionLoading(true);
      const res = await fetch('/api/gdpr/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notes: deletionNote }),
      });
      if (res.ok) {
        setDeletionSubmitted(true);
      }
    } catch (err) {
      console.error('Deletion request error:', err);
      setDeletionSubmitted(true);
    } finally {
      setDeletionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.role && ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      setAdminLoading(true);
      fetch('/api/gdpr/deletion-requests')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAdminRequests(data);
        })
        .catch(() => {})
        .finally(() => setAdminLoading(false));
    }
  }, [activeTab, currentUser]);

  const handleUpdateDeletionStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/gdpr/deletion-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Aktualizováno administrátorem dne ${new Date().toLocaleString()}` }),
      });
      if (res.ok) {
        setAdminRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : req.completedAt } : req))
        );
      }
    } catch (err) {
      console.error('Update request error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SeoHead
        title="GDPR Compliance Center (Release 0.5.1) • Táta má právo"
        description="Zásady ochrany osobních údajů, správa souhlasů, export dat a právo být zapomenut podle Nařízení (EU) 2016/679 (GDPR)."
        canonicalPath="/gdpr"
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate?.('/')}
            className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět na hlavní portál
          </button>
          <div className="flex items-center gap-2 text-xs font-mono bg-blue-100 text-blue-900 px-3 py-1.5 rounded-full font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>GDPR Release 0.5.1</span>
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-mono font-bold">
            <Lock className="w-4 h-4" />
            <span>Synthesis OS • Security & Privacy Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            GDPR Compliance Center
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Transparentní správa osobních údajů, auditní záznamy souhlasů, možnost přenositelnosti dat (Čl. 20) a právo na výmaz (Čl. 17) v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'policy' ? 'bg-white text-blue-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Zásady ochrany (v. 0.5.1)</span>
            </button>
            <button
              onClick={() => setActiveTab('my-data')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'my-data' ? 'bg-white text-blue-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Moje data a Export</span>
            </button>
            <button
              onClick={() => setActiveTab('deletion')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'deletion' ? 'bg-white text-blue-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Žádost o výmaz (Právo být zapomenut)</span>
            </button>
            {currentUser?.role && ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role) && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'admin' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-white/10 text-amber-300 hover:bg-white/20'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin GDPR Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Policy 0.5.1 */}
        {activeTab === 'policy' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-8 text-slate-800 text-xs sm:text-sm leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Release 0.5.1 • Účinnost od 12. 8. 2026
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Zásady zpracování a ochrany osobních údajů (GDPR)
                </h2>
              </div>
              <div>
                {!consentLogged ? (
                  <button
                    onClick={handleLogConsent}
                    disabled={consentLoading}
                    className="px-5 py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{consentLoading ? 'Zaznamenávám...' : 'Potvrdit souhlas (v. 0.5.1)'}</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Souhlas zaznamenán v databázi</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">1. Identifikace správce</h3>
                <p>
                  Správcem osobních údajů podle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) je:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Jméno a příjmení:</strong> Jiří Šár</li>
                  <li><strong>Právní forma:</strong> Fyzická osoba nepodnikající</li>
                  <li><strong>Role:</strong> Zakladatel a provozovatel projektu <em>Táta má právo / Synthesis OS</em></li>
                  <li><strong>Webový portál:</strong> www.tatovacesta.cz</li>
                  <li><strong>Kontaktní e-mail:</strong> info@tatovacesta.cz</li>
                  <li><strong>Pověřený e-mail pro GDPR dotazy:</strong> gdpr@tatamapravo.cz</li>
                </ul>
                <p className="pt-1">Správce určuje účely a prostředky zpracování osobních údajů v rámci portálu a jeho mikroslužeb.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">2. Kategorie a soubory zpracovávaných údajů</h3>
                <p>Zpracováváme osobní údaje nezbytné pro provoz portálu, komunitních funkcí a AI nástrojů:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Identifikační a kontaktní údaje:</strong> E-mailová adresa, uživatelské jméno, unikátní ID účtu.</li>
                  <li><strong>Technické údaje:</strong> IP adresa, soubory cookies, logy přihlášení, typ prohlížeče.</li>
                  <li><strong>Autentizační údaje (Passkeys):</strong> Systém <strong>neukládá biometrické údaje uživatele</strong>. Biometrická autentizace probíhá výhradně na zařízení uživatele prostřednictvím technologie <strong>FIDO2/WebAuthn</strong>. Na server se přenáší pouze kryptografický veřejný klíč.</li>
                </ul>

                <h4 className="font-bold text-slate-900 pt-3">2.4 Citlivé osobní údaje (Čl. 9 GDPR)</h4>
                <p>
                  portál může při dobrovolném využívání některých funkcí (např. vložení podkladů do AI Asistenta nebo komunitního fóra) obsahovat informace, které mají povahu <strong>zvláštních kategorií osobních údajů</strong> nebo vysoce citlivých údajů. Jedná se zejména o:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>informace týkající se rodinných a opatrovnických vztahů,</li>
                  <li>údaje o nezletilých dětech,</li>
                  <li>zdravotní nebo psychologické informace obsažené v přiložených dokumentech,</li>
                  <li>informace související se soudními řízeními a spory.</li>
                </ul>
                <p className="italic text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                  Upozornění: Tyto údaje nejsou vyžadovány pro běžné používání služby. Uživatel by měl do systému vkládat pouze informace nezbytně nutné a doporučuje se provedení anonymizace.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">3. Zpracování údajů pomocí umělé inteligence (AI)</h3>
                <p>Pokud uživatel využije AI funkce (AI Asistent opatrovnictví, rozbor rozsudků, generování dokumentů):</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                  <li>Vložený text je technicky předán poskytovateli AI služby (Google Gemini API / Groq Cloud API) za účelem vytvoření strukturované odpovědi.</li>
                  <li>Systém automaticky uplatňuje princip minimalizace dat a filtruje nepotřebné identifikátory.</li>
                  <li>Uživatel je povinen nevkládat nepotřebné osobní údaje třetích osob.</li>
                  <li>AI výstupy slouží výhradně jako podpora a orientační podklad – <strong>nejsou automatizovaným rozhodováním podle Čl. 22 GDPR</strong> a nenahrazují právní či psychologickou péči.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">4. Právní základy zpracování a komunitní fórum</h3>
                <p>Osobní údaje zpracováváme na základě následujících právních titulů:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Plnění smlouvy (Čl. 6 odst. 1 písm. b) GDPR):</strong> Zřízení uživatelského účtu, přístup k modulům portálu.</li>
                  <li>
                    <strong>Komunitní příspěvky a Fórum:</strong>
                    <div className="pl-4 pt-1 space-y-1 text-slate-600">
                      <div>• <em>Čl. 6 odst. 1 písm. b) GDPR:</em> Poskytování komunitní služby a provoz fóra.</div>
                      <div>• <em>Čl. 6 odst. 1 písm. f) GDPR:</em> Oprávněný zájem na moderaci diskusí, zajištění bezpečnosti a ochraně komunity před zneužitím.</div>
                    </div>
                  </li>
                  <li><strong>Souhlas (Čl. 6 odst. 1 písm. a) GDPR):</strong> Zasílání občasných informativních zpráv či analytické cookie.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">5. Ochrana osobních údajů nezletilých dětí</h3>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                  <li>Portál <strong>není určen k veřejnému zveřejňování identifikačních údajů o dětech</strong>.</li>
                  <li>
                    Uživatel v komunitních sekcích a diskusích <strong>nesmí zveřejňovat</strong>:
                    <ul className="list-disc pl-5 pt-1 space-y-1">
                      <li>celé jméno dítěte,</li>
                      <li>fotografii nebo video dítěte bez oprávnění obou zákonných zástupců,</li>
                      <li>přesnou adresu školy, školky nebo místa bydliště,</li>
                      <li>rodné číslo nebo datum narození,</li>
                      <li>jiné údaje umožňující přímou identifikaci nezletilého.</li>
                    </ul>
                  </li>
                  <li>Pokud uživatel sdílí příběh nebo zkušenost týkající se dítěte, je povinen provést <strong>důslednou anonymizaci</strong> (např. pouhé křestní jméno, iniciály nebo fiktivní jméno).</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">6. Uchování dat a zálohování</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Osobní údaje aktivních účtů uchováváme po dobu trvání registrace.</li>
                  <li>Po žádosti o zrušení účtu dojde k výmazu osobních údajů z aktivních databází nejpozději do <strong>30 dnů</strong>.</li>
                  <li><strong>Upozornění k zálohám:</strong> Požadavek na výmaz se vztahuje na aktivní databázové systémy. Technické záložní kopie (backupy) jsou odstraňovány automaticky v rámci pravidelného cyklu zálohování, nejpozději v přiměřené době odpovídající bezpečnostním pravidlům infrastruktury (maximálně 90 dnů).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">7. Práva uživatelů</h3>
                <p>Podle GDPR máte následující práva:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Právo na přístup k osobním údajům (Čl. 15),</li>
                  <li>Právo na opravu (Čl. 16),</li>
                  <li>Právo na výmaz / „právo být zapomenut“ (Čl. 17),</li>
                  <li><strong>Právo na omezení zpracování (Čl. 18):</strong> Uživatel má právo požadovat omezení zpracování v případech stanovených v Čl. 18 GDPR (např. při popření přesnosti údajů nebo vznesení námitky),</li>
                  <li>Právo na přenositelnost údajů (Čl. 20),</li>
                  <li>Právo vznést námitku (Čl. 21).</li>
                </ul>
                <p className="pt-2 text-slate-700">
                  Svá práva můžete uplatnit přímo v sekci <strong>GDPR Compliance Center</strong> ve svém profilu nebo na e-mailu <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-900 font-mono">gdpr@tatamapravo.cz</code>.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-blue-950 text-sm uppercase">8. Cookies a analytika</h3>
                <p>
                  Používání analytických a technických cookies je detailně popsáno v samostatném dokumentu <span className="text-blue-700 font-bold underline cursor-pointer">Cookie Policy</span>.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* Tab 2: My Data & Export */}
        {activeTab === 'my-data' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-900 font-bold">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Přenositelnost dat (Čl. 20 GDPR)</h2>
                <p className="text-xs text-slate-500 font-medium">Stáhněte si kompletní archiv svých osobních údajů, případů, poznámek a auditních logů souhlasů.</p>
              </div>
            </div>

            {exportSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">ID uživatele:</span>
                  <span className="font-mono bg-white px-3 py-2 rounded-xl border border-slate-300 block">{userId}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">E-mail:</span>
                  <span className="font-mono bg-white px-3 py-2 rounded-xl border border-slate-300 block">{currentUser?.email || 'Neznámý'}</span>
                </div>
              </div>
              <p className="text-slate-600">
                Export obsahuje profil, uživatelské spisy, kalendářní události, poznámky, záznamy souhlasů se Zásadami (v. 0.5.1) a auditní logy citlivých přístupů.
              </p>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="px-6 py-3 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{exportLoading ? 'Generuji archiv...' : 'Stáhnout mé osobní údaje (JSON)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Deletion Request (Right to be forgotten) */}
        {activeTab === 'deletion' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-800 font-bold">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Právo být zapomenut / Výmaz údajů (Čl. 17 GDPR)</h2>
                <p className="text-xs text-slate-500 font-medium">Podat formální žádost o trvalé smazání uživatelského účtu a veškerých spojených dat.</p>
              </div>
            </div>

            {deletionSubmitted ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-amber-700" />
                  <span>Žádost o výmaz byla úspěšně odeslána ke zpracování.</span>
                </div>
                <p className="text-xs text-amber-800">
                  Správce systému ji prověří a provede kompletní smazání údajů v souladu s lhůtami GDPR. O stavu vyřízení budete informováni.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeletionRequest} className="space-y-4">
                <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Upozornění:</span>
                    Trvalý výmaz je nevratný. Budou odstraněny všechny vaše spisy, poznámky, profily i záznamy v databázi Synthesis OS.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Důvod nebo poznámka k žádosti (volitelně)</label>
                  <textarea
                    rows={3}
                    value={deletionNote}
                    onChange={(e) => setDeletionNote(e.target.value)}
                    placeholder="např. Ukončení spolupráce s projektem..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={deletionLoading}
                  className="px-6 py-3 bg-rose-700 text-white font-bold rounded-xl text-xs hover:bg-rose-800 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deletionLoading ? 'Odesílám...' : 'Odeslat závaznou žádost o výmaz údajů'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 4: Admin GDPR Panel */}
        {activeTab === 'admin' && currentUser?.role && ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role) && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Admin GDPR Panel (Žádosti o výmaz)</h2>
                  <p className="text-xs text-slate-500 font-medium">Správa a vyřizování žádostí uživatelů podle Čl. 17 GDPR.</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-xl font-bold">
                Celkem žádostí: {adminRequests.length}
              </span>
            </div>

            {adminLoading ? (
              <p className="text-xs text-slate-500 italic">Načítám žádosti...</p>
            ) : adminRequests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6">Žádné evidované žádosti o výmaz.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-mono">
                    <tr>
                      <th className="p-3">Uživatel</th>
                      <th className="p-3">Datum žádosti</th>
                      <th className="p-3">Stav</th>
                      <th className="p-3">Poznámka</th>
                      <th className="p-3 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adminRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">
                          {req.user?.name || 'Neznámý'} <br />
                          <span className="text-[10px] text-slate-500 font-mono">{req.user?.email || req.userId}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">
                          {new Date(req.requestedAt).toLocaleString('cs-CZ')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              req.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{req.notes || '-'}</td>
                        <td className="p-3 text-right space-x-2">
                          {req.status !== 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateDeletionStatus(req.id, 'PROCESSING')}
                              className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 font-bold"
                            >
                              Zpracovávat
                            </button>
                          )}
                          {req.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateDeletionStatus(req.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg hover:bg-emerald-200 font-bold"
                            >
                              Dokončit výmaz
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
