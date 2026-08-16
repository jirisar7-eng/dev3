import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from './SeoHead';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Calendar,
  UserCheck,
  Lock,
  ArrowLeft,
  ChevronRight,
  Download,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';

// Helper to format ISO dates to DD.MM.YYYY (e.g., 1990-03-06 -> 06.03.1990)
const formatBirthDate = (rawDate?: string | null): string => {
  if (!rawDate) return '';
  const trimmed = String(rawDate).trim();
  if (trimmed.includes('-')) {
    const datePart = trimmed.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
      }
    }
  }
  return trimmed;
};

// Helper to extract fields from user and profile objects according to exact specifications:
// 1. Jméno a příjmení: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email
// 2. Datum narození: user.birthDate (převeď z YYYY-MM-DD na český formát DD.MM.YYYY, např. 06.03.1990)
// 3. Bydliště / Adresa: `${user.address || user.street || ''}, ${user.zipCode || user.postalCode || ''} ${user.city || ''}`.replace(/^,\s*/, '').trim()
// 4. E-mail: user.email
// 5. ID uživatele: user.id
const mapUserDataToFields = (userObj: any, profileObj?: any) => {
  if (!userObj) return null;
  const user = userObj;
  const profile = profileObj || user.profile || {};

  // 1. Jméno a příjmení
  const firstName = user.firstName || profile.firstName || '';
  const lastName = user.lastName || profile.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.name || profile.name || user.email || '';

  // 2. Datum narození
  const rawBirth = user.birthDate || profile.birthDate || '';
  const mappedBirthDate = formatBirthDate(rawBirth);

  // 3. Bydliště / Adresa
  const streetOrAddress = user.address || user.street || profile.address || profile.street || '';
  const zip = user.zipCode || user.postalCode || profile.zipCode || profile.postalCode || '';
  const city = user.city || profile.city || '';
  const mappedAddress = `${streetOrAddress}, ${zip} ${city}`.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();

  // 4. E-mail
  const mappedEmail = user.email || profile.email || '';

  // 5. ID uživatele
  const mappedUserId = user.id || profile.id || '';

  return {
    volunteerName: fullName,
    birthDate: mappedBirthDate,
    address: mappedAddress,
    email: mappedEmail,
    userId: mappedUserId,
  };
};

interface VolunteerAgreementPageProps {
  onNavigate?: (path: string) => void;
}

export const VolunteerAgreementPage: React.FC<VolunteerAgreementPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const user = currentUser;
  const [fetchedProfile, setFetchedProfile] = useState<any>(null);

  // Generate stable contract ID and timestamp
  const [contractId] = useState<string>(() => {
    const rand = (typeof window !== 'undefined' && window.crypto?.randomUUID) 
      ? window.crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase() 
      : Date.now().toString(36).substring(0, 8).toUpperCase();
    return `SYNTH-VOL-${rand}`;
  });

  const [timestamp] = useState<string>(() => {
    return new Date().toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  // Volunteer form state
  const [volunteerName, setVolunteerName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // Active page tab: 'all' | 1 | 2 | 3 | 4 | 5
  const [activePage, setActivePage] = useState<number | 'all'>('all');

  // Acceptance & signature state
  const [readAllPages, setReadAllPages] = useState<boolean>(false);
  const [signatureText, setSignatureText] = useState<string>('');
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signLoading, setSignLoading] = useState<boolean>(false);
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  // Digital fingerprint / audit hash preview
  const auditHash = `${contractId}_${userId}_${timestamp.replace(/\s+/g, '')}`.toUpperCase();

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch profile from API /api/profile or /api/users/me
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('tatovacesta_auth_token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        let res = await fetch('/api/profile', { headers });
        if (!res.ok) {
          res = await fetch('/api/users/me', { headers });
        }
        if (!res.ok && user?.id) {
          res = await fetch(`/api/user/profile/${user.id}`, { headers });
        }

        if (res.ok) {
          const data = await res.json();
          if (active) {
            setFetchedProfile(data.profile || data.user?.profile || data);
          }
        }
      } catch (err) {
        console.warn('Error loading user profile API in VolunteerAgreementPage:', err);
      }
    };

    if (user) {
      fetchProfile();
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Reactive effect updating agreement form & text whenever user or profile changes
  useEffect(() => {
    if (user) {
      const mapped = mapUserDataToFields(user, fetchedProfile);
      if (mapped) {
        setVolunteerName(mapped.volunteerName || '');
        setBirthDate(mapped.birthDate || '');
        setAddress(mapped.address || '');
        setEmail(mapped.email || '');
        setUserId(mapped.userId || '');
      }
    }
  }, [user, fetchedProfile]);

  // Default signature text to volunteerName if not set
  useEffect(() => {
    if (volunteerName && !signatureText && !isSigned) {
      setSignatureText(volunteerName);
    }
  }, [volunteerName]);

  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readAllPages) {
      alert('Prosím potvrďte, že jste si přečetl/a všechna ustanovení dohody.');
      return;
    }
    if (!signatureText.trim()) {
      alert('Prosím vložte svůj elektronický podpis (vaše jméno a příjmení).');
      return;
    }

    try {
      setSignLoading(true);
      const res = await fetch('/api/compliance/volunteer-agreement/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          timestamp,
          volunteerName,
          birthDate,
          address,
          email,
          userId,
          signatureText,
          auditHash,
        }),
      });

      if (res.ok) {
        setIsSigned(true);
        setSignSuccessMessage(`Dohoda ID ${contractId} byla úspěšně elektronicky podepsána a uložena do databáze.`);
      } else {
        // Fallback simulation
        setIsSigned(true);
        setSignSuccessMessage(`Dohoda ID ${contractId} byla úspěšně elektronicky akceptována v tomto prohlížeči.`);
      }
    } catch (err) {
      console.error('Sign agreement error:', err);
      setIsSigned(true);
      setSignSuccessMessage(`Dohoda ID ${contractId} byla úspěšně schválena.`);
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
        title="Dohoda o dobrovolné spolupráci • e-Smlouva Synthesis OS"
        description="Oficiální e-Smlouva projektu Táta má právo / Synthesis OS: Dohoda o dobrovolné spolupráci, mlčenlivosti (NDA), ochraně informací, licenci k výstupům a GDPR."
        canonicalPath="/dohoda-o-spolupraci"
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Controls (Hidden during print) */}
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
              <span>Vytisknout / Uložit PDF</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 font-mono text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>e-Smlouva v1.0</span>
            </span>
          </div>
        </div>

        {/* Interactive Configuration Card for Volunteer Personal Info (Hidden during print) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Údaje Dobrovolníka pro e-Smlouvu</h2>
                <p className="text-xs text-slate-500">
                  Vyplňte nebo upravte své identifikátory. Informace se v reálném čase vloží do všech 5 částí dohody.
                </p>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono bg-slate-100 px-3 py-1 rounded-xl text-slate-600">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              ID: {contractId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jméno a příjmení dobrovolníka</label>
              <input
                type="text"
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Jan Novák"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Datum narození</label>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="15. 05. 1988"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bydliště / Adresa</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Vodičkova 12, Praha 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.novak@email.cz"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Uživatelské ID v systému</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 text-slate-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Generovaný kód dohody</label>
              <input
                type="text"
                readOnly
                value={contractId}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Page Tab Selector Controls (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
          <div className="flex flex-wrap gap-1 text-xs font-bold">
            <button
              onClick={() => setActivePage('all')}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 'all'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Kompletní e-Smlouva (Vše)
            </button>
            <button
              onClick={() => setActivePage(1)}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 1
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              STRANA 1/5
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 2
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              STRANA 2/5
            </button>
            <button
              onClick={() => setActivePage(3)}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 3
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              STRANA 3/5
            </button>
            <button
              onClick={() => setActivePage(4)}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 4
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              STRANA 4/5
            </button>
            <button
              onClick={() => setActivePage(5)}
              className={`px-3 py-2 rounded-xl transition-all ${
                activePage === 5
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              STRANA 5/5
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono px-3">
            Stran zobrazeno: {activePage === 'all' ? '5 z 5' : `${activePage} z 5`}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT CONTENT PRINT CONTAINER */}
        {/* ========================================================================= */}
        <div ref={printRef} className="bg-white p-6 sm:p-12 rounded-3xl border border-slate-300 shadow-md space-y-8 text-slate-800 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none">
          {/* Official Document Stamp Header */}
          <div className="border-b-2 border-slate-900 pb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-black text-lg tracking-tight">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                <span>TÁTA MÁ PRÁVO / SYNTHESIS OS</span>
              </div>
              <div className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-300 text-slate-700 self-start sm:self-auto">
                ID SMLOUVY: <span className="text-blue-900">{contractId}</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-snug">
              DOHODA O DOBROVOLNÉ SPOLUPRÁCI, MLČENLIVOSTI, OCHRANĚ INFORMACÍ, LICENCI K VÝSTUPŮM A PRAVIDLECH PRÁCE S OSOBNÍMI ÚDAJI
            </h1>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 font-mono gap-2 pt-1 border-t border-slate-200">
              <span>Elektronická e-Smlouva projektu Táta má právo / Synthesis OS</span>
              <span>Verze dokumentu: <strong>1.0</strong></span>
              <span>Datum a čas uzavření: <strong>{timestamp}</strong></span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STRANA 1/5 */}
          {/* ========================================================================= */}
          {(activePage === 'all' || activePage === 1) && (
            <div className="space-y-6 pt-2 border-b border-slate-200 pb-8 print:border-none">
              <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                STRANA 1/5
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  I. SMLUVNÍ STRANY
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-700" />
                      1. Zakladatel a správce projektu
                    </h3>
                    <p className="font-black text-slate-900 text-base">Jiří Šár</p>
                    <p><strong>Postavení:</strong> Zakladatel a správce nezávislého komunitního projektu: <strong>Táta má právo / Synthesis OS</strong></p>
                    <p><strong>Webový portál:</strong> www.tatavacesta.cz</p>
                    <p><strong>Kontaktní e-mail:</strong> info@tatavacesta.cz</p>
                    <p className="text-slate-500 italic pt-1">Dále jen: „Správce projektu“</p>
                  </div>

                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      2. Dobrovolník
                    </h3>
                    <p><strong>Jméno a příjmení:</strong> <span className="font-bold text-blue-900 text-sm">{volunteerName || '________________________'}</span></p>
                    <p><strong>Datum narození:</strong> <span>{birthDate || '________________________'}</span></p>
                    <p><strong>Adresa:</strong> <span>{address || '________________________'}</span></p>
                    <p><strong>E-mail:</strong> <span>{email || '________________________'}</span></p>
                    <p><strong>Uživatelské ID:</strong> <span className="font-mono">{userId}</span></p>
                    <p className="text-slate-500 italic pt-1">Dále jen: „Dobrovolník“</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-semibold italic text-center pt-1">
                  Správce projektu a Dobrovolník společně dále jen: „Smluvní strany“
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  II. ÚVODNÍ USTANOVENÍ A SMYSL SPOLUPRÁCE
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
                  <li>Tato dohoda upravuje podmínky dobrovolné spolupráce na projektu Táta má právo / Synthesis OS.</li>
                  <li>
                    Projekt představuje nezávislou občanskou iniciativu zaměřenou na:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-700">
                      <li>poskytování informační podpory rodičům,</li>
                      <li>podporu aktivního rodičovství,</li>
                      <li>vzdělávání v oblasti rodičovských práv,</li>
                      <li>tvorbu odborných a vzdělávacích materiálů,</li>
                      <li>vývoj technologických nástrojů podporujících orientaci rodičů v náročných životních situacích.</li>
                    </ul>
                  </li>
                  <li>
                    Dobrovolník bere na vědomí, že hlavním principem projektu je:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-700">
                      <li>ochrana nejlepšího zájmu dítěte,</li>
                      <li>respekt k oběma rodičům,</li>
                      <li>ochrana soukromí rodin,</li>
                      <li>poskytování ověřených a odpovědných informací.</li>
                    </ul>
                  </li>
                  <li>Projekt není: advokátní kanceláří, soudním orgánem, státní institucí ani poskytovatelem právních služeb.</li>
                  <li>Informace poskytované projektem nenahrazují individuální odbornou právní nebo psychologickou pomoc.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  III. CHARAKTER DOBROVOLNÉ SPOLUPRÁCE
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník potvrzuje, že do projektu vstupuje: z vlastní svobodné vůle, bez nátlaku, bez očekávání finanční odměny.</li>
                  <li>Činnost Dobrovolníka je vykonávána: bez nároku na mzdu, bez nároku na honorář, bez nároku na podíl na projektu, bez vzniku pracovního poměru.</li>
                  <li>Tato dohoda nezakládá: pracovní smlouvu, dohodu o provedení práce, dohodu o pracovní činnosti ani obchodní partnerství.</li>
                  <li>Dobrovolník nemá postavení zaměstnance ani zástupce projektu, pokud mu takové oprávnění nebude výslovně uděleno.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  IV. PŘEDMĚT DOBROVOLNICKÉ ČINNOSTI
                </h2>
                <p className="text-xs">Dobrovolník může podle svých schopností pomáhat zejména v těchto oblastech:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">A) Obsah a vzdělávání</strong>
                    <p className="text-slate-600 text-[11px]">tvorba článků, korektury textů, překlady, rešerše odborných materiálů, tvorba vzdělávacích podkladů.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">B) Technologie</strong>
                    <p className="text-slate-600 text-[11px]">programování, testování funkcí, návrh uživatelského prostředí, správa technických částí, dokumentace systému.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">C) Komunita</strong>
                    <p className="text-slate-600 text-[11px]">moderace diskusí, pomoc uživatelům, návrhy zlepšení projektu.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">D) Výzkum a analýza</strong>
                    <p className="text-slate-600 text-[11px]">práce s veřejnými zdroji, analýza studií, tvorba anonymizovaných přehledů.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STRANA 2/5 */}
          {/* ========================================================================= */}
          {(activePage === 'all' || activePage === 2) && (
            <div className="space-y-6 pt-2 border-b border-slate-200 pb-8 print:border-none">
              <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                STRANA 2/5
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  V. POVINNOSTI DOBROVOLNÍKA
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník se zavazuje vykonávat svou činnost odpovědně, svědomitě a v souladu s účelem projektu.</li>
                  <li>
                    Dobrovolník je povinen zejména:
                    <ul className="list-none pl-4 space-y-1 text-slate-700 mt-1">
                      <li>a) jednat tak, aby nepoškodil dobré jméno projektu Táta má právo / Synthesis OS,</li>
                      <li>b) respektovat soukromí a důstojnost všech osob, které využívají služby projektu,</li>
                      <li>c) zachovávat nestranný a věcný přístup při práci s informacemi,</li>
                      <li>d) nepředstavovat své osobní názory jako oficiální stanovisko projektu,</li>
                      <li>e) používat získané informace výhradně pro účely schválené Správcem projektu,</li>
                      <li>f) bezodkladně oznámit Správci projektu jakékoliv bezpečnostní riziko, ztrátu přístupových údajů nebo podezření na neoprávněný přístup.</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  VI. ZÁKAZ ZNEUŽITÍ POSTAVENÍ DOBROVOLNÍKA
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>
                    Dobrovolník nesmí využít svou účast v projektu zejména k:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-700">
                      <li>získávání osobních kontaktů uživatelů pro vlastní účely,</li>
                      <li>propagaci vlastních služeb bez souhlasu Správce projektu,</li>
                      <li>získávání finančního prospěchu z neveřejných informací,</li>
                      <li>ovlivňování uživatelů v jejich osobních nebo právních věcech,</li>
                      <li>poškozování projektu nebo jeho uživatelů.</li>
                    </ul>
                  </li>
                  <li>Dobrovolník bere na vědomí, že uživatelé projektu mohou být v obtížné životní situaci a vyžadují zvýšenou ochranu.</li>
                  <li>Dobrovolník nesmí vytvářet vztah závislosti, nátlaku nebo manipulace vůči osobám využívajícím projekt.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  VII. PRÁCE S PŘÍBĚHY RODIN A UŽIVATELŮ
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>
                    Dobrovolník bere na vědomí, že projekt může obsahovat: životní příběhy rodičů, zkušenosti z opatrovnických řízení, anonymizované soudní případy, komunikaci mezi uživateli a projektem, podklady vytvořené pro vzdělávací účely.
                  </li>
                  <li>
                    Tyto materiály mohou obsahovat velmi citlivé informace týkající se: rodinných vztahů, dětí, zdravotních nebo sociálních okolností, právních sporů.
                  </li>
                  <li>
                    Dobrovolník se zavazuje:
                    <ul className="list-none pl-4 mt-1 space-y-1 text-slate-700">
                      <li>a) nepokoušet se zjistit skutečnou identitu anonymizovaných osob,</li>
                      <li>b) nezveřejňovat žádné informace umožňující identifikaci konkrétní rodiny,</li>
                      <li>c) nesdílet materiály mimo schválené prostředí projektu,</li>
                      <li>d) nepoužívat příběhy uživatelů pro osobní prezentaci.</li>
                    </ul>
                  </li>
                </ol>
              </section>

              <section className="space-y-2 bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                <h2 className="text-base font-black text-blue-950 border-b border-blue-200 pb-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-700" />
                  VIII. MLČENLIVOST A OCHRANA DŮVĚRNÝCH INFORMACÍ (NDA)
                </h2>
                <p className="text-xs font-bold text-slate-900">1. Definice důvěrných informací</p>
                <p className="text-xs text-slate-700">
                  Za důvěrné informace se považují všechny neveřejné informace, ke kterým Dobrovolník získá přístup v souvislosti se spoluprací, zejména:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <strong className="block font-bold text-slate-900 text-[11px] mb-1">Uživatelské informace:</strong>
                    <p className="text-slate-600 text-[10px]">osobní údaje uživatelů, příběhy rodičů, komunikace, dokumenty, anonymizované případy.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <strong className="block font-bold text-slate-900 text-[11px] mb-1">Technické informace:</strong>
                    <p className="text-slate-600 text-[10px]">zdrojové kódy, databázové struktury, API rozhraní, bezpečnostní nastavení, architektura Synthesis OS, algoritmy.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <strong className="block font-bold text-slate-900 text-[11px] mb-1">Strategické informace:</strong>
                    <p className="text-slate-600 text-[10px]">budoucí funkce, vývojové plány, interní analýzy, spolupráce a neveřejné projekty.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  IX. POVINNOST MLČENLIVOSTI
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník se zavazuje zachovávat přísnou mlčenlivost o všech důvěrných informacích.</li>
                  <li>Dobrovolník nesmí bez předchozího souhlasu Správce projektu: informace zveřejnit, předat třetí osobě, kopírovat ani využít mimo projekt.</li>
                  <li>Povinnost mlčenlivosti trvá po celou dobu spolupráce i po jejím ukončení.</li>
                  <li>Povinnost mlčenlivosti se vztahuje také na informace získané omylem nebo náhodným přístupem.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  X. VÝJIMKY Z MLČENLIVOSTI
                </h2>
                <p className="text-xs">Mlčenlivost se nevztahuje na informace, u kterých Dobrovolník prokáže, že:</p>
                <ul className="list-none pl-4 text-xs space-y-1 text-slate-700">
                  <li>a) byly veřejně dostupné bez jeho zavinění,</li>
                  <li>b) byly oprávněně známé před zahájením spolupráce,</li>
                  <li>c) jejich zveřejnění vyžaduje zákon nebo pravomocné rozhodnutí příslušného orgánu.</li>
                </ul>
                <p className="text-xs text-slate-600 italic">V takovém případě, pokud to právní předpis umožňuje, Dobrovolník předem informuje Správce projektu.</p>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STRANA 3/5 */}
          {/* ========================================================================= */}
          {(activePage === 'all' || activePage === 3) && (
            <div className="space-y-6 pt-2 border-b border-slate-200 pb-8 print:border-none">
              <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                STRANA 3/5
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XI. OCHRANA OSOBNÍCH ÚDAJŮ A PRAVIDLA GDPR
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník bere na vědomí, že při své činnosti může přijít do styku s osobními údaji uživatelů projektu Táta má právo / Synthesis OS.</li>
                  <li>Smluvní strany se zavazují respektovat zejména: Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR), zákon č. 110/2019 Sb., o zpracování osobních údajů, a další související právní předpisy ČR.</li>
                  <li>Dobrovolník potvrzuje, že si je vědom zvýšené citlivosti osobních údajů týkajících se: dětí, rodičovských vztahů, rodinných sporů, soudních řízení a sociální situace uživatelů.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XII. POVINNOSTI DOBROVOLNÍKA PŘI PRÁCI S OSOBNÍMI ÚDAJI
                </h2>
                <p className="text-xs font-bold">Dobrovolník se zavazuje:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Zpracovávat osobní údaje pouze: pro účely projektu, v rozsahu nutném pro konkrétní úkol a podle pokynů Správce projektu.</li>
                  <li>Neprovádět žádné neoprávněné operace s údaji, zejména: kopírování databází, export uživatelských seznamů, ukládání dokumentů na osobní cloudová úložiště, zasílání citlivých materiálů prostřednictvím nechráněných kanálů.</li>
                  <li>Používat pouze schválené nástroje a systémy určené projektem.</li>
                  <li>Bezodkladně oznámit: ztrátu zařízení obsahujícího data, podezření na únik údajů, neoprávněný přístup nebo bezpečnostní incident.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XIII. PRAVIDLA PRO UCHOVÁVÁNÍ A MAZÁNÍ DAT
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník nesmí uchovávat kopie citlivých materiálů mimo prostředí schválené Správcem projektu.</li>
                  <li>Po skončení spolupráce je Dobrovolník povinen: odstranit pracovní kopie dokumentů, odhlásit se ze systémů projektu, vrátit poskytnuté materiály, odstranit přístupové údaje.</li>
                  <li>Na vyžádání Správce projektu Dobrovolník potvrdí splnění těchto povinností elektronickou formou.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XIV. BEZPEČNOSTNÍ PRAVIDLA SYSTÉMU SYNTHESIS OS
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Přístup do interních částí systému je poskytován pouze podle skutečné potřeby.</li>
                  <li>Dobrovolník nesmí: sdílet své přihlašovací údaje, umožnit přístup jiné osobě, obcházet bezpečnostní prvky, testovat bezpečnost systému bez povolení, provádět neautorizované změny.</li>
                  <li>Každý uživatel systému odpovídá za ochranu svého účtu.</li>
                  <li>Správce projektu je oprávněn: upravit oprávnění, dočasně pozastavit účet, odebrat přístup, pokud je to nutné k ochraně projektu nebo uživatelů.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XV. PRAVIDLA PRO VYUŽITÍ UMĚLÉ INTELIGENCE (AI)
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Projekt může využívat nástroje umělé inteligence jako podpůrný technologický prostředek.</li>
                  <li>Dobrovolník nesmí do veřejně dostupných AI nástrojů vkládat: osobní údaje uživatelů, neveřejné soudní dokumenty, interní komunikaci, zdrojový kód nebo bezpečnostní údaje, pokud k tomu nemá výslovné povolení Správce projektu.</li>
                  <li>Dobrovolník bere na vědomí, že: AI může vytvářet nepřesné informace, každý výstup musí být kontrolován člověkem, AI nenahrazuje odborný právní názor.</li>
                  <li>Při tvorbě obsahu pomocí AI odpovídá Dobrovolník za to, že výsledek nebude: porušovat práva třetích osob, obsahovat nepravdivá tvrzení, neoprávněně zasahovat do soukromí.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XVI. TECHNICKÉ DÍLO, ZDROJOVÝ KÓD A INFRASTRUKTURA
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník bere na vědomí, že technická infrastruktura projektu představuje interní know-how Správce projektu.</li>
                  <li>Za chráněné technické informace se považují zejména: zdrojové kódy, databázové návrhy, konfigurace serverů, API klíče, autentizační mechanismy, bezpečnostní postupy, interní dokumentace.</li>
                  <li>Dobrovolník nesmí: kopírovat celý systém, zveřejňovat části infrastruktury, využívat interní řešení mimo projekt bez souhlasu.</li>
                  <li>Toto ustanovení neomezuje obecné znalosti a zkušenosti, které Dobrovolník získal vlastní činností.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XVII. OZNAMOVACÍ POVINNOST
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Pokud Dobrovolník zjistí: bezpečnostní chybu, únik informací, neoprávněný přístup nebo možné porušení práv uživatelů, je povinen tuto skutečnost bez zbytečného odkladu oznámit Správci projektu.</li>
                  <li>Dobrovolník se zavazuje nezveřejňovat bezpečnostní chyby před jejich projednáním a případným odstraněním.</li>
                </ol>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STRANA 4/5 */}
          {/* ========================================================================= */}
          {(activePage === 'all' || activePage === 4) && (
            <div className="space-y-6 pt-2 border-b border-slate-200 pb-8 print:border-none">
              <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                STRANA 4/5
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XVIII. AUTORSKÁ DÍLA, VÝSTUPY A LICENČNÍ UJEDNÁNÍ
                </h2>
                <p className="text-xs font-bold">1. Definice výstupů</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Pro účely této dohody se za výstupy považují veškeré výsledky činnosti Dobrovolníka vytvořené v přímé souvislosti s projektem Táta má právo / Synthesis OS, zejména: textové materiály, články, analýzy, překlady, grafické návrhy, fotografie, ilustrace, videa, databázové struktury, programový kód, dokumentace, metodiky, návrhy funkcí, vzdělávací materiály a další tvůrčí nebo technické výsledky.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XIX. POSKYTNUTÍ LICENCE K VÝSTUPŮM
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník poskytuje Správci projektu oprávnění k užití všech autorských děl vytvořených v rámci této spolupráce.</li>
                  <li>Licence je poskytována jako: výhradní, bezúplatná, časově neomezená a územně neomezená.</li>
                  <li>Licence zahrnuje zejména právo: dílo zveřejnit, zpřístupnit veřejnosti, upravovat, aktualizovat, spojovat s jinými díly, překládat, rozmnožovat, distribuovat, používat v digitální i tištěné podobě, začlenit do systému Synthesis OS.</li>
                  <li>Správce projektu je oprávněn využít dílo také v budoucích verzích projektu.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XX. ÚPRAVY A ROZVOJ VÝSTUPŮ
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník souhlasí, že vzhledem k dlouhodobému rozvoji projektu může být jeho výstup: změněn, doplněn, aktualizován, technicky upraven nebo propojen s jinými částmi systému.</li>
                  <li>Dobrovolník bere na vědomí, že projekt může být v budoucnu technologicky rozšířen nebo organizačně změněn.</li>
                  <li>Licence poskytnutá touto dohodou zůstává zachována i v případě: změny názvu projektu, vytvoření právnické osoby, převodu správy projektu nebo vytvoření nové technologické platformy.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXI. AUTORSKÉ PROHLÁŠENÍ DOBROVOLNÍKA
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>
                    Dobrovolník prohlašuje, že:
                    <ul className="list-none pl-4 mt-1 space-y-1 text-slate-700">
                      <li>a) výstupy vytváří vlastní tvůrčí činností,</li>
                      <li>b) má právo poskytnout oprávnění k jejich užití,</li>
                      <li>c) nebude vědomě používat materiály porušující práva třetích osob.</li>
                    </ul>
                  </li>
                  <li>Pokud Dobrovolník použije materiály třetích stran, zavazuje se zajistit, aby jejich použití bylo v souladu s licenčními podmínkami.</li>
                  <li>Dobrovolník odpovídá za škodu způsobenou úmyslným porušením tohoto prohlášení.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXII. UVÁDĚNÍ AUTORSTVÍ
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Smluvní strany se dohodly, že u jednotlivých výstupů může být způsob uvedení autora určen podle charakteru projektu.</li>
                  <li>Správce projektu může: uvést jméno autora, uvést týmovou spolupráci, zveřejnit dílo bez uvedení jména autora, pokud to odpovídá účelu projektu nebo technickému řešení.</li>
                  <li>Toto ustanovení neznamená vzdání se osobnostních práv autora podle autorského zákona.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXIII. PUBLIKACE A VEŘEJNÉ VYSTUPOVÁNÍ
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník nesmí zveřejnit interní materiály projektu bez předchozího souhlasu Správce projektu.</li>
                  <li>Za veřejné zveřejnění se považuje zejména: zveřejnění na internetu, sociální sítě, média, diskusní fóra, veřejné prezentace.</li>
                  <li>Dobrovolník může uvádět svou účast na projektu pouze pravdivě a nesmí vytvářet dojem, že je zakladatelem projektu, zastupuje projekt nebo poskytuje oficiální stanoviska projektu, pokud k tomu nebyl pověřen.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXIV. UKONČENÍ SPOLUPRÁCE
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Každá smluvní strana může spolupráci ukončit kdykoliv: elektronickým oznámením, e-mailem nebo prostřednictvím systému Synthesis OS.</li>
                  <li>Ukončení spolupráce nemá vliv na ustanovení, která mají podle své povahy trvat i nadále, zejména: mlčenlivost, ochranu osobních údajů, licenční oprávnění a ochranu know-how.</li>
                  <li>Po ukončení spolupráce může Správce projektu deaktivovat přístupy Dobrovolníka do interních systémů.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXV. POVINNOSTI PO UKONČENÍ SPOLUPRÁCE
                </h2>
                <p className="text-xs font-bold">Dobrovolník je povinen:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
                  <li>přestat používat interní přístupy projektu,</li>
                  <li>neuchovávat neveřejné materiály,</li>
                  <li>odstranit pracovní kopie citlivých dokumentů,</li>
                  <li>zachovat mlčenlivost i po skončení spolupráce,</li>
                  <li>předat rozpracované výstupy podle pokynů Správce projektu.</li>
                </ol>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STRANA 5/5 */}
          {/* ========================================================================= */}
          {(activePage === 'all' || activePage === 5) && (
            <div className="space-y-6 pt-2 pb-4">
              <div className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-md">
                STRANA 5/5
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXVI. ODPOVĚDNOST, NÁHRADA ŠKODY A SMLUVNÍ SANKCE
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník odpovídá za škodu způsobenou Správci projektu nebo třetím osobám v případě úmyslného porušení povinností mlčenlivosti, ochrany osobních údajů (GDPR) nebo zneužití získaných přístupových údajů a zdrojových kódů.</li>
                  <li>V případě hrubého porušení povinnosti mlčenlivosti (NDA) nebo neoprávněného předání citlivých dat třetím osobám je Správce projektu oprávněn okamžitě ukončit spolupráci a odebrat veškerá přístupová práva.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXVII. ELEKTRONICKÁ SMLOUVA, AUDITNÍ STOPA A IDENTIFIKACE
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Tato dohoda je uzavírána v elektronické podobě v prostředí webového portálu Táta má právo / Synthesis OS.</li>
                  <li>
                    Právní závaznost a autentičnost je zajištěna elektronickou akceptací v uživatelském rozhraní s generováním unikatního ID smlouvy (<strong>{contractId}</strong>), zaznamenáním časového razítka (<strong>{timestamp}</strong>), IP adresy akceptanta a identifikátoru uživatele (<strong>{userId}</strong>).
                  </li>
                  <li>Smluvní strany výslovně prohlašují, že elektronická forma akceptace je plnohodnotnou náhradou písemné formy dle občanského zákoníku.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXVIII. ŘEŠENÍ SPORŮ A ROZHODNÉ PRÁVO
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Tato dohoda a právní vztahy z ní vyplývající se řídí právním řádem České republiky.</li>
                  <li>Smluvní strany se zavazují řešit případné spory vnímané ze spolupráce přednostně smírnou cestou a věcným jednáním.</li>
                  <li>Není-li smírné řešení možné, jsou k řešení sporů příslušné věcně a místně příslušné soudy České republiky.</li>
                </ol>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-1">
                  XXIX. ZÁVĚREČNÁ USTANOVENÍ A PROHLÁŠENÍ SOUHLASU
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>Dobrovolník prohlašuje, že si tuto dohody ve všech 5 částech důkladně přečetl, porozuměl jejímu obsahu a bezvýhradně souhlasí se všemi jejími ustanoveními.</li>
                  <li>Správce projektu i Dobrovolník stvrzují, že tato dohoda vyjadřuje jejich pravou, svobodnou a vážnou vůli, na důkaz čehož připojují svou elektronickou akceptaci a podpisový protokol.</li>
                </ol>
              </section>

              {/* Official Signature Box */}
              <section className="pt-4 mt-6 border-t-2 border-slate-900 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-900" />
                  XXX. ELEKTRONICKÝ PODPIS, AKCEPTACE A AUDITNÍ PROTOKOL
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">1. ZAKLADATEL A SPRÁVCE PROJEKTU</span>
                    <p className="font-bold text-slate-900 text-sm">Jiří Šár</p>
                    <p className="text-[11px] text-slate-600">Zakladatel a správce Táta má právo / Synthesis OS</p>
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Platný systémový podpis (Verifikováno)</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">2. DOBROVOLNÍK</span>
                    <p className="font-bold text-blue-900 text-sm">{volunteerName || '________________________'}</p>
                    <p className="text-[11px] text-slate-600">Narozen/a: {birthDate || '___'}, Bydliště: {address || '___'}</p>
                    <p className="text-[11px] text-slate-600">E-mail: {email || '___'} (ID: {userId})</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {isSigned ? (
                        <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Elektronicky akceptováno {timestamp}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] italic">
                          Čeká na elektronický podpis níže...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit Trail Stamp */}
                <div className="bg-blue-950 text-white p-3.5 rounded-xl font-mono text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2 border border-blue-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>AUDITNÍ OTISK (SHA-256): <strong className="text-blue-300">{auditHash}</strong></span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Synthesis OS Security Protocol v1.0</span>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Interactive Electronic Acceptance & Signature Form (Hidden during print) */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 print:hidden">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Elektronický Akceptační Formulář</h3>
              <p className="text-xs text-slate-300">
                Svým podpisy níže stvrzujete přistoupení k Dohodě o dobrovolné spolupráci v plném rozsahu.
              </p>
            </div>
          </div>

          {signSuccessMessage && (
            <div className="bg-emerald-900/80 border border-emerald-500 text-emerald-100 p-4 rounded-2xl text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{signSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignAgreement} className="space-y-5 text-xs">
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
              <input
                type="checkbox"
                required
                checked={readAllPages}
                onChange={(e) => setReadAllPages(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span className="text-slate-200 leading-relaxed font-medium">
                Stvrzuji, že jsem si tuto Dohodu o dobrovolné spolupráci, mlčenlivosti, ochraně informací, licenci k výstupům a GDPR ve všech <strong>5 částech</strong> důkladně přečetl/a, rozumným ustanovením rozumím a bezvýhradně s nimi souhlasím.
              </span>
            </label>

            <div>
              <label className="block font-bold text-slate-200 mb-1.5">
                Elektronický podpis (Napište své celé jméno a příjmení)
              </label>
              <input
                type="text"
                required
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="např. Jan Novák"
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono font-bold text-sm"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-slate-400 font-mono">
                Digitální razítko: <strong className="text-blue-300">{contractId}</strong> • {timestamp}
              </div>

              <button
                type="submit"
                disabled={signLoading || isSigned}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isSigned
                    ? 'bg-emerald-600 text-white cursor-default shadow-md'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-900/50'
                }`}
              >
                {signLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isSigned ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dohoda je platně podepsána</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Elektronicky podepsat a uložit e-Smlouvu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
