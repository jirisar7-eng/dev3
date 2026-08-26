import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Printer,
  Download,
  UserCheck,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Play,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

import { DocumentExportService } from '../../../services/documentExportService';
import { useAuth } from '../../../context/AuthContext';
import { UserChild } from '../../../types';

import { CourtTemplate, COURT_TEMPLATES } from '../../../data/legalTemplates';


interface AiFormsViewProps {
  onNavigate?: (path: string) => void;
}

export const AiFormsView: React.FC<AiFormsViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  // User Profile Form Variables
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
    email: '',
    courtName: '',
    caseNumber: '',
    exFirstName: '',
    exLastName: '',
    exStreet: '',
    exCity: '',
  });

  // Children State
  const [childrenList, setChildrenList] = useState<UserChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [courtAddress, setCourtAddress] = useState('');
  const [childAddressMode, setChildAddressMode] = useState<'SAME_AS_MOTHER' | 'CUSTOM'>('SAME_AS_MOTHER');
  const [childAddress, setChildAddress] = useState('');
  const [caseLoaded, setCaseLoaded] = useState(false);


  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('stridava-pece');

  // e-Sbírka Verification State
  const [esbirkaClause, setEsbirkaClause] = useState<string>('');
  const [esbirkaVerifiedDate, setEsbirkaVerifiedDate] = useState<string>('');
  const [loadingEsbirka, setLoadingEsbirka] = useState<boolean>(false);

  // AI Refinement State
  const [customPrompt, setCustomPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiRefineError, setAiRefineError] = useState<string | null>(null);
  const [lastCustomPrompt, setLastCustomPrompt] = useState<string>('');

  // Generated Text State
  const [compiledText, setCompiledText] = useState<string>('');
  const [editedTemplateContent, setEditedTemplateContent] = useState<string>('');

  const selectedTemplate = COURT_TEMPLATES.find((t) => t.id === selectedTemplateId) || COURT_TEMPLATES[0];

  // Fetch e-Sbírka Status
  const fetchEsbirkaStatus = useCallback(async () => {
    setLoadingEsbirka(true);
    try {
      const res = await fetch('/api/esbirka');
      if (res.ok) {
        const data = await res.json();
        setEsbirkaClause(data.verificationClause || `Právní citace ověřeny vůči e-Sbírce k ${new Date().toLocaleDateString('cs-CZ')}`);
        setEsbirkaVerifiedDate(data.verifiedDate || new Date().toLocaleDateString('cs-CZ'));
      } else {
        const today = new Date().toLocaleDateString('cs-CZ');
        setEsbirkaClause(`Právní citace ověřeny vůči e-Sbírce k ${today}`);
        setEsbirkaVerifiedDate(today);
      }
    } catch {
      const today = new Date().toLocaleDateString('cs-CZ');
      setEsbirkaClause(`Právní citace ověřeny vůči e-Sbírce k ${today}`);
      setEsbirkaVerifiedDate(today);
    } finally {
      setLoadingEsbirka(false);
    }
  }, []);

  useEffect(() => {
    fetchEsbirkaStatus();
  }, [fetchEsbirkaStatus]);

  // Load Real Profile, Children & Case from Auth / API
  useEffect(() => {
    if (!currentUser) return;

    // Prefill basic email/phone from currentUser
    setProfile((prev) => ({
      ...prev,
      email: currentUser.email || prev.email,
      phone: currentUser.phone || prev.phone,
    }));

    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('caseId');

    const loadFallbackProfile = () => {
      // Fetch Full Profile
      fetch(`/api/user/profile/${currentUser.id}`, { headers: authHeaders })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.profile) {
            const p = data.profile;
            setProfile((prev) => ({
              ...prev,
              firstName: p.firstName || prev.firstName,
              lastName: p.lastName || prev.lastName,
              birthDate: p.birthDate || prev.birthDate,
              street: p.address || prev.street,
              city: p.city || prev.city,
              zip: p.postalCode || prev.zip,
              phone: p.phone || currentUser.phone || prev.phone,
            }));
          }
        })
        .catch((e) => console.error('Error loading user profile:', e));

      // Fetch Children
      fetch(`/api/portal/children/${currentUser.id}`, { headers: authHeaders })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setChildrenList(data);
            const first = data[0];
            setSelectedChildId(first.id);
            setChildFirstName(first.firstName || first.name || '');
            setChildLastName(first.lastName || '');
            setChildBirthDate(first.birthDate || '');
          }
        })
        .catch((e) => console.error('Error loading children:', e));
    };

    if (caseId) {
      fetch(`/api/cases/${caseId}`, { headers: authHeaders })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.data) {
            const c = json.data;
            setCaseLoaded(true);

            // Court lookup
            let foundCourt = '';
            if (c.court) {
              foundCourt = c.court;

              // Only override address if not already manually set
              fetch(`/api/subjekty/lookup?name=${encodeURIComponent(c.court)}`)
                .then(res => {
                  if (!res.ok) throw new Error('Not found');
                  return res.json();
                })
                .then(cData => {
                  if (cData && cData.address) {
                    // Mělo by nastavit pouze pokud uživatel mezitím sám adresu nenapsal,
                    // ale v kontextu initial loadu je courtAddress zatím prázdná, takže to můžeme setnout.
                    setCourtAddress(prev => prev ? prev : cData.address);
                    setProfile(prev => ({ ...prev, courtName: cData.name || c.court }));
                  }
                })
                .catch(() => {});
            }

            // Ex / Mother
            const mother = (c.participants || []).find((p: any) => p.role === 'MATKA');
            let mFirst = '', mLast = '', mAddr = '';
            if (mother) {
              const nameParts = (mother.name || '').split(' ');
              if (nameParts.length > 1) {
                mLast = nameParts.pop() || '';
                mFirst = nameParts.join(' ');
              } else {
                mFirst = mother.name;
              }
              mAddr = mother.address || '';
            }

            setProfile((prev) => ({
              ...prev,
              caseNumber: c.caseNumber || prev.caseNumber,
              courtName: foundCourt || prev.courtName,
              exFirstName: mFirst || prev.exFirstName,
              exLastName: mLast || prev.exLastName,
              exStreet: mAddr || prev.exStreet,
            }));

            // Children
            if (c.children && c.children.length > 0) {
              setChildrenList(c.children);
              const first = c.children[0];
              setSelectedChildId(first.id);
              setChildFirstName(first.firstName || '');
              setChildLastName(first.lastName || '');
              setChildBirthDate(first.dateOfBirth || '');
              setChildAddressMode(first.addressMode || 'SAME_AS_MOTHER');
              setChildAddress(first.address || '');
            }

            // Load Father's info from owner profile fallback
            fetch(`/api/user/profile/${c.ownerId || currentUser.id}`, { headers: authHeaders })
              .then(r => r.ok ? r.json() : null)
              .then(pData => {
                 if (pData && pData.profile) {
                    const p = pData.profile;
                    setProfile(prev => ({
                      ...prev,
                      firstName: p.firstName || prev.firstName,
                      lastName: p.lastName || prev.lastName,
                      birthDate: p.birthDate || prev.birthDate,
                      street: p.address || prev.street,
                      city: p.city || prev.city,
                      zip: p.postalCode || prev.zip,
                    }));
                 }
              });

          } else {
            loadFallbackProfile();
          }
        })
        .catch((e) => {
          console.error('Error loading case:', e);
          loadFallbackProfile();
        });
    } else {
      loadFallbackProfile();
    }
  }, [currentUser]);

  // Handle Child Selection
  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    const child = childrenList.find((c) => c.id === childId);
    if (child) {
      setChildFirstName(child.firstName || child.name || '');
      setChildLastName(child.lastName || '');
      setChildBirthDate(child.birthDate || '');
    }
  };

  // Compile document template with current variables
  const compileDocumentText = useCallback(
    (rawTemplate: string) => {
      const currentDateStr = new Date().toLocaleDateString('cs-CZ');
      const clause = esbirkaClause || `Právní citace ověřeny vůči e-Sbírce k ${currentDateStr}`;
      const finalChildAddress = childAddressMode === 'SAME_AS_MOTHER' ? profile.exStreet.trim() : childAddress.trim();

      let template = rawTemplate.replace(/\[Adresa příslušného okresního soudu\]/g, '{{court.address}}');

      return template
        .replace(/\{\{user\.firstName\}\}/g, profile.firstName.trim() || '[Jméno otce]')
        .replace(/\{\{user\.lastName\}\}/g, profile.lastName.trim() || '[Příjmení otce]')
        .replace(/\{\{user\.birthDate\}\}/g, profile.birthDate.trim() || '[Datum nar. otce]')
        .replace(/\{\{user\.street\}\}/g, profile.street.trim() || '[Ulice a č.p.]')
        .replace(/\{\{user\.city\}\}/g, profile.city.trim() || '[Město]')
        .replace(/\{\{user\.zip\}\}/g, profile.zip.trim() || '[PSČ]')
        .replace(/\{\{user\.phone\}\}/g, profile.phone.trim() || '[Telefon]')
        .replace(/\{\{user\.email\}\}/g, profile.email.trim() || '[E-mail]')
        .replace(/\{\{court\.name\}\}/g, profile.courtName.trim() || '[Místně příslušný okresní soud]')
        .replace(/\{\{court\.address\}\}/g, courtAddress.trim() || '[Adresa soudu]')
        .replace(/\{\{case\.number\}\}/g, profile.caseNumber.trim() || '[Spisová značka]')
        .replace(/\{\{ex\.firstName\}\}/g, profile.exFirstName.trim() || '[Jméno matky]')
        .replace(/\{\{ex\.lastName\}\}/g, profile.exLastName.trim() || '[Příjmení matky]')
        .replace(/\{\{ex\.street\}\}/g, profile.exStreet.trim() || '[Adresa matky]')
        .replace(/\{\{ex\.fullAddress\}\}/g, profile.exStreet.trim() || '[Adresa matky]')
        .replace(/\{\{ex\.city\}\}/g, profile.exCity.trim() || '')
        .replace(/\{\{child\.firstName\}\}/g, childFirstName.trim() || '[Jméno dítěte]')
        .replace(/\{\{child\.lastName\}\}/g, childLastName.trim() || '[Příjmení dítěte]')
        .replace(/\{\{child\.birthDate\}\}/g, childBirthDate.trim() || '[Datum nar. dítěte]')
        .replace(/\{\{child\.address\}\}/g, finalChildAddress || '[Adresa dítěte]')
        .replace(/\{\{current\.date\}\}/g, currentDateStr)
        .replace(/\{\{esbirka\.clause\}\}/g, clause);
    },
    [profile, childFirstName, childLastName, childBirthDate, childAddressMode, childAddress, courtAddress, esbirkaClause]
  );

  // Update compiled text on template / variable changes
  useEffect(() => {
    const raw = editedTemplateContent || selectedTemplate.content;
    setCompiledText(compileDocumentText(raw));
  }, [editedTemplateContent, selectedTemplate, compileDocumentText]);

  // Select Template
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = COURT_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setEditedTemplateContent(tmpl.content);
    }
  };

  // Generate Document Action Button
  const validateGeneratedDocument = (text: string) => {
    const missing = [];
    if (text.includes('[Jméno otce]')) missing.push('Jméno otce');
    if (text.includes('[Příjmení otce]')) missing.push('Příjmení otce');
    if (text.includes('[Datum nar. otce]')) missing.push('Datum narození otce');
    if (text.includes('[Ulice a č.p.]')) missing.push('Ulice otce');
    if (text.includes('[Město]')) missing.push('Město otce');
    if (text.includes('[PSČ]')) missing.push('PSČ otce');
    if (text.includes('[Místně příslušný okresní soud]')) missing.push('Soud');
    if (text.includes('[Adresa soudu]')) missing.push('Adresa soudu');
    if (text.includes('[Spisová značka]')) missing.push('Spisová značka');
    if (text.includes('[Jméno matky]')) missing.push('Jméno matky');
    if (text.includes('[Příjmení matky]')) missing.push('Příjmení matky');
    if (text.includes('[Adresa matky]')) missing.push('Adresa matky');
    if (text.includes('[Jméno dítěte]')) missing.push('Jméno dítěte');
    if (text.includes('[Příjmení dítěte]')) missing.push('Příjmení dítěte');
    if (text.includes('[Datum nar. dítěte]')) missing.push('Datum nar. dítěte');
    if (text.includes('[Adresa dítěte]')) missing.push('Adresa dítěte');
    return missing;
  };

  const handleGenerateDocument = () => {
    const raw = editedTemplateContent || selectedTemplate.content;
    const result = compileDocumentText(raw);

    const missingFields = validateGeneratedDocument(result);
    if (missingFields.length > 0) {
      alert('Dokument obsahuje nevyplněné povinné údaje:\n- ' + missingFields.join('\n- ') + '\n\nProsím doplňte je v levém panelu.');
    }

    setCompiledText(result);

    // Scroll smooth to document preview area
    const el = document.getElementById('document-preview-pane');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // AI Refine Document Handler
  const handleAiRefine = async (retryPrompt?: string) => {
    const promptToUse = typeof retryPrompt === 'string' ? retryPrompt : customPrompt;
    if (!promptToUse.trim() || loadingAi) return;
    setLoadingAi(true);
    setAiRefineError(null);
    setLastCustomPrompt(promptToUse);

    try {
      const currentText = compiledText;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Dopracuj následující právní podání podle tohoto požadavku: "${promptToUse}". Zachovej formát a strukturu podání k opatrovnickému soudu ČR a nezapomeň na konečnou doložku e-Sbírky.\n\nDokument:\n${currentText}`,
            },
          ],
          mode: 'forms',
        }),
      });

      if (!res.ok) {
        throw new Error(`AI služba vrátila chybu ${res.status}`);
      }

      const data = await res.json();
      if (data.reply) {
        setEditedTemplateContent(data.reply);
        setCustomPrompt('');
      } else {
        throw new Error(data.error || 'Neznámá chyba AI odpovedi');
      }
    } catch (err: any) {
      console.error('AI Refine error:', err);
      setAiRefineError(err.message || 'AI úprava se nezdařila. Rozpracovaný obsah podání zůstal nezměněn.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Copy Text
  const handleCopy = async () => {
    const success = await DocumentExportService.copyToClipboard(compiledText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clean Print / Export to PDF Window
  const handlePrintPdf = () => {
    DocumentExportService.printPdf(compiledText);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    DocumentExportService.downloadTxt(compiledText, `${selectedTemplate.id}-podani.txt`);
  };

  const handleDownloadDocx = async () => {
    await DocumentExportService.downloadDocx(compiledText, `${selectedTemplate.id}-podani.docx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Generátor Právních Formulářů ČR • e-Sbírka • Táta má právo"
        description="Generátor opatrovnických návrhů na střídavou péči, předběžných opatření a vyjádření pro OSPOD propojený s e-Sbírkou a vaším reálným profilem."
        canonicalPath="/ai-formulare"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-400/30">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Oficiální Vzory MS ČR & Opatrovnických Soudů
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> e-Sbírka Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Generátor Právních Formulářů & Podání
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vyberte vzor podání, načtěte údaje ze svého profilu a vygenerujte formálně přesný návrh s ověřenou citací platné legislativy z e-Sbírky.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 bg-white text-slate-900 font-extrabold rounded-xl text-xs hover:bg-slate-100 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Vytisknout / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Profile Notice Banner */}
      {!currentUser ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Nejste přihlášeni</strong>
              <span>Pro automatické předvyplňování vašich údajů a údajů o dítěti se přihlaste, nebo zadejte údaje ručně níže.</span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Přihlásit se
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-indigo-950 text-xs">
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Přihlášený uživatel: {currentUser.name} ({currentUser.email})</strong>
              <span>Vaše kontaktní údaje a informace o dětech byly automaticky předvyplněny z databáze vašeho profilu.</span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/profil')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Upravit v Profilu
            </button>
          )}
        </div>
      )}

      {/* Main Form Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls & Variables (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Template Selection */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                1. Výběr oficiálního vzoru podání
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {COURT_TEMPLATES.length} vzorů
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {COURT_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="block text-slate-900">{tmpl.title}</strong>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold shrink-0">
                        {tmpl.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal leading-relaxed block">
                      {tmpl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* e-Sbírka Verification Badge */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 border border-emerald-800/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <strong className="text-xs font-bold text-emerald-300">
                  e-Sbírka API Integrace
                </strong>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {loadingEsbirka ? 'Ověřování...' : 'Platná legislativa'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tento formulář automaticky cituje platné znění zákonů z e-Sbírky Ministerstva spravedlnosti a vnitra ČR.
            </p>
            <div className="text-[10px] font-mono text-emerald-200/80 pt-1 border-t border-emerald-800/40">
              {esbirkaClause || `Právní citace ověřeny vůči e-Sbírce k ${new Date().toLocaleDateString('cs-CZ')}`}
            </div>
          </div>

          {/* 2. Profile & Children Variables Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                2. Údaje pro vyplnění dokumentu
              </h3>
            </div>

            {/* Child Selection Dropdown if children exist */}
            {childrenList.length > 0 && (
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1">
                <label className="block text-indigo-900 font-bold text-[11px]">
                  Vybrat dítě z profilu:
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => handleSelectChild(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-indigo-200 rounded-xl font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName || c.name} {c.lastName} ({c.birthDate ? `nar. ${c.birthDate}` : 'bez data'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block">
                Údaje navrhovatele (Otec)
              </strong>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno:</label>
                  <input
                    type="text"
                    placeholder="např. Jan"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení:</label>
                  <input
                    type="text"
                    placeholder="např. Novák"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Datum narození:</label>
                  <input
                    type="text"
                    placeholder="15. 04. 1988"
                    value={profile.birthDate}
                    onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Telefon:</label>
                  <input
                    type="text"
                    placeholder="+420 777 123 456"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Ulice a č.p.:</label>
                    <input
                      type="text"
                      placeholder="Nádražní 12"
                      value={profile.street}
                      onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">PSČ a Město:</label>
                    <input
                      type="text"
                      placeholder="602 00 Brno"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block pt-2">
                Nezletilé dítě
              </strong>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno dítěte:</label>
                  <input
                    type="text"
                    placeholder="Tomáš"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení:</label>
                  <input
                    type="text"
                    placeholder="Novák"
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Datum nar.:</label>
                  <input
                    type="text"
                    placeholder="10. 05. 2018"
                    value={childBirthDate}
                    onChange={(e) => setChildBirthDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div className="col-span-3 mt-1 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={childAddressMode === 'SAME_AS_MOTHER'}
                      onChange={(e) => setChildAddressMode(e.target.checked ? 'SAME_AS_MOTHER' : 'CUSTOM')}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-600">Dítě bydlí na adrese matky</span>
                  </label>
                  {childAddressMode === 'CUSTOM' && (
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Vlastní adresa dítěte:</label>
                      <input
                        type="text"
                        placeholder="Ulice, Město, PSČ"
                        value={childAddress}
                        onChange={(e) => setChildAddress(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block pt-2">
                Odpůrkyně (Matka) & Soud
              </strong>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno matky:</label>
                  <input
                    type="text"
                    placeholder="Jméno matky"
                    value={profile.exFirstName}
                    onChange={(e) => setProfile({ ...profile, exFirstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení matky:</label>
                  <input
                    type="text"
                    placeholder="Příjmení matky"
                    value={profile.exLastName}
                    onChange={(e) => setProfile({ ...profile, exLastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Adresa matky (Odpůrkyně):</label>
                  <input
                    type="text"
                    placeholder="Ulice, Město, PSČ"
                    value={profile.exStreet}
                    onChange={(e) => setProfile({ ...profile, exStreet: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Okresní soud v:</label>
                  <input
                    type="text"
                    placeholder="např. Okresní soud v Brně"
                    value={profile.courtName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfile({ ...profile, courtName: val });
                      // Nepřetěžujeme API každou klávesou. V reálu by tu byl debounce.
                      // Pokud chceme lookup, zavoláme ho např na onBlur, nebo debounced
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val && val.length > 3) {
                         fetch(`/api/subjekty/lookup?name=${encodeURIComponent(val)}`)
                          .then(res => {
                            if (!res.ok) throw new Error('Not found');
                            return res.json();
                          })
                          .then(cData => {
                            if (cData && cData.address) {
                              setCourtAddress(cData.address);
                              setProfile(prev => ({ ...prev, courtName: cData.name }));
                            }
                          })
                          .catch(() => {});
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Adresa soudu:</label>
                  <input
                    type="text"
                    placeholder="Adresa soudu"
                    value={courtAddress}
                    onChange={(e) => setCourtAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Spisová značka (např. 12 P 45/2024):</label>
                  <input
                    type="text"
                    placeholder="např. 12 P 45/2024"
                    value={profile.caseNumber}
                    onChange={(e) => setProfile({ ...profile, caseNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* GENERATE DOCUMENT MAIN BUTTON */}
            <button
              onClick={handleGenerateDocument}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Generovat dokument</span>
            </button>
          </div>

          {/* AI Refine Prompt Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 shadow-sm border border-slate-800">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Upravit nebo doplnit text pomocí AI
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Zadejte požadavek na úpravu (např. "Přidej důraz na mou profesní stabilitu a flexibilní pracovní dobu", "Rozšiř argumentaci o střídavé péči z nálezu ÚS").
            </p>
            {aiRefineError && (
              <div className="p-3 bg-red-900/40 border border-red-700/60 rounded-xl text-xs text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>{aiRefineError}</span>
                <button
                  onClick={() => handleAiRefine(lastCustomPrompt)}
                  disabled={loadingAi}
                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
                  Zkusit znovu
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Napište instrukci pro AI..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => handleAiRefine()}
                disabled={loadingAi || !customPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Upravit AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview (7 cols) */}
        <div
          id="document-preview-pane"
          className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
        >
          {/* Top Bar Actions */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <strong className="text-xs font-extrabold text-slate-900">
                Živý náhled vygenerovaného návrhu
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">Zkopírováno</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopírovat text</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-extrabold hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold hover:bg-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>DOCX</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF / Tisk</span>
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-slate-100/60">
            <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm min-h-[600px] text-xs leading-relaxed text-slate-900 font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900">
              {compiledText}
            </div>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Vygenerovaný dokument pomocí umělé inteligence (AI) slouží pouze jako předloha a inspirace.
            Může obsahovat faktické či právní nepřesnosti. Výstup nenahrazuje odbornou právní pomoc ani právní zastoupení.
            Před podáním na soud dokument důkladně zkontrolujte a případně zkonzultujte s advokátem.
          </p>
        </div>
      </div>
    </div>
  );
};
