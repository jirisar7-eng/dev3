import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useText } from '../../context/TextContext';
import {
  UserCheck,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  MapPin,
  Calendar,
  Baby,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

interface ChildInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  isStudying?: boolean;
  notes?: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t } = useText();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Volby pohlaví a dětí (Pohlaví & Děti)
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [hasChildrenInitial, setHasChildrenInitial] = useState<boolean>(true);

  // Krok 1: Basic Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');

  // Krok 2: Optional Profile
  const [fillProfileNow, setFillProfileNow] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [children, setChildren] = useState<ChildInput[]>([]);

  // Krok 3: Legal Consents
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);

  const handleAddChild = () => {
    setChildren([...children, { firstName: '', lastName: '', birthDate: '', isStudying: false, notes: '' }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildInput, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const validateStep1 = () => {
    setErrorMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg(t('auth.register.error.email', 'Prosím zadejte e-mailovou adresu.'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg(t('auth.register.error.emailFormat', 'Zadejte platný tvar e-mailové adresy.'));
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMsg(t('auth.register.error.passwordLength', 'Heslo musí mít minimálně 6 znaků.'));
      return false;
    }
    if (password !== passwordConfirm) {
      setErrorMsg(t('auth.register.error.passwordMatch', 'Zadaná hesla se neshodují.'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!fillProfileNow) return true;

    if (phone.trim()) {
      const phoneClean = phone.replace(/\s+/g, '');
      const phoneRegex = /^(\+?[0-9]{9,15})$/;
      if (!phoneRegex.test(phoneClean)) {
        setErrorMsg(t('auth.register.error.phone', 'Zadejte platné telefonní číslo (např. +420777123456).'));
        return false;
      }
    }

    if (postalCode.trim()) {
      const pscClean = postalCode.replace(/\s+/g, '');
      if (!/^[0-9]{5}$/.test(pscClean)) {
        setErrorMsg(t('auth.register.error.postalCode', 'PSČ musí obsahovat 5 číslic (např. 11000).'));
        return false;
      }
    }

    return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextStep2 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!agreeTerms || !agreePrivacy) {
      setErrorMsg(t('auth.register.error.consents', 'Pro dokončení registrace musíte souhlasit s Podmínkami použití a Zásadami ochrany soukromí.'));
      return;
    }

    setLoading(true);

    try {
      const profileData = fillProfileNow
        ? {
            firstName,
            lastName,
            birthDate,
            phone,
            address,
            city,
            postalCode,
            autoFillDocs: true,
          }
        : undefined;

      const consentsData = [
        { docKey: 'terms_and_conditions', docVersion: '1.0.0', action: 'ACCEPTED' },
        { docKey: 'privacy_policy', docVersion: '1.0.0', action: 'ACCEPTED' },
      ];

      await register(
        name.trim() || (firstName ? `${firstName} ${lastName}`.trim() : email.split('@')[0]),
        email.trim(),
        password,
        'USER',
        {
          ...(profileData || {}),
          gender,
          hasChildrenInitial,
        },
        hasChildrenInitial ? children : [],
        consentsData,
        gender,
        hasChildrenInitial
      );

      onNavigate('/portal');
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.register.error.general', 'Chyba při registraci. Zkuste to znovu.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background,#f8fafc)]">
      <div className="max-w-2xl w-full bg-[var(--color-surface,#ffffff)] rounded-3xl border border-[var(--color-border,#e2e8f0)] shadow-xl p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--color-primary,#1e3a8a)] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
            {t('auth.register.title', 'Registrace nového účtu')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('auth.register.subtitle', 'Vytvořte si účet pro přístup k právním vzorům, generátoru podání a kalkulačkám.')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--color-primary,#1e3a8a)]' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 1 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
              1
            </span>
            <span className="hidden sm:inline">{t('auth.register.step1Label', 'Přihlašovací údaje')}</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--color-primary,#1e3a8a)]' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 2 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
              2
            </span>
            <span className="hidden sm:inline">{t('auth.register.step2Label', 'Profil a rodina (volitelné)')}</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[var(--color-primary,#1e3a8a)]' : 'text-slate-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step >= 3 ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'}`}>
              3
            </span>
            <span className="hidden sm:inline">{t('auth.register.step3Label', 'Právní souhlasy')}</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-mailová adresa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="např. otec@seznam.cz"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jméno a příjmení / Nickname
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="např. Jan Svoboda"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Heslo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimálně 6 znaků"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Potvrzení hesla <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Zopakujte heslo"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Přepínače pro Přizpůsobení portálu */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Přizpůsobení portálu
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jsem:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('MALE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        gender === 'MALE'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      👨 Muž (Otec)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('FEMALE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        gender === 'FEMALE'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      👩 Žena (Matka)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mám děti:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHasChildrenInitial(true)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        hasChildrenInitial === true
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      👶 Ano
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasChildrenInitial(false);
                        setChildren([]);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        hasChildrenInitial === false
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🚫 Ne
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep1}
                className="py-3 px-6 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white font-bold text-sm hover:bg-blue-900 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Pokračovat k profilu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Vyplnit údaje pro automatické generování dokumentů?</h4>
                <p className="text-xs text-slate-600">Údaje usnadní předvyplňování návrhů k soudu a právních podání.</p>
              </div>
              <input
                type="checkbox"
                checked={fillProfileNow}
                onChange={(e) => setFillProfileNow(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {fillProfileNow ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jméno</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Příjmení</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Novák"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Datum narození</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+420 777 123 456"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ulica a ČP</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Hlavní 123"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Město</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Praha"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                {/* Children List */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Baby className="w-4 h-4 text-blue-600" />
                      <span>Děti (pro kalkulačky a vzory podání)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddChild}
                      className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Přidat dítě</span>
                    </button>
                  </div>

                  {children.map((child, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Dítě #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChild(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Jméno dítěte"
                          value={child.firstName}
                          onChange={(e) => handleChildChange(idx, 'firstName', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Příjmení dítěte"
                          value={child.lastName}
                          onChange={(e) => handleChildChange(idx, 'lastName', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="date"
                          value={child.birthDate}
                          onChange={(e) => handleChildChange(idx, 'birthDate', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`isStudying-${idx}`}
                          checked={child.isStudying || false}
                          onChange={(e) => handleChildChange(idx, 'isStudying', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor={`isStudying-${idx}`} className="text-xs text-slate-700 cursor-pointer select-none">
                          Studující dítě (zletilé do 26 let – výživné & nezaopatřenost)
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Tento krok můžete přeskočit. Profilové údaje a děti lze doplnit kdykoliv později v Můj účet - Profil.
              </p>
            )}

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zpět</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep2}
                className="py-3 px-6 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white font-bold text-sm hover:bg-blue-900 transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Pokračovat k souhlasům</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4 border border-slate-200 p-5 rounded-2xl bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Povinné právní dokumenty a souhlasy</span>
              </h4>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  Souhlasím s <strong>Podmínkami použití služby (v1.0.0)</strong>. Rozumím, že portál poskytuje výhradně právní informace a vzory podání, nikoliv individuální advokátní služby.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700">
                  Souhlasím se <strong>Zásadami zpracování osobních údajů (GDPR v1.0.0)</strong> pro účely správy uživatelského účtu a předvyplňování dokumentů.
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zpět</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !agreeTerms || !agreePrivacy}
                className="py-3.5 px-8 rounded-xl bg-emerald-700 text-white font-extrabold text-sm hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Dokončit registrace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Already have account */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs">
          <span className="text-slate-600">Již máte vytvořený účet?</span>
          <button
            onClick={() => onNavigate('/login')}
            className="ml-1 text-[var(--color-primary,#1e3a8a)] font-bold hover:underline"
          >
            Přihlaste se
          </button>
        </div>
      </div>
    </div>
  );
};
