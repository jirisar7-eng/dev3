import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToDoc?: (path: string) => void;
}

interface ChildInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  notes: string;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToDoc,
}) => {
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleAddChild = () => {
    setChildren([...children, { firstName: '', lastName: '', birthDate: '', notes: '' }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildInput, value: string) => {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  };

  const validateStep1 = () => {
    setErrorMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Prosím zadejte e-mailovou adresu.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Zadejte platný tvar e-mailové adresy.');
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Heslo musí mít minimálně 6 znaků.');
      return false;
    }
    if (password !== passwordConfirm) {
      setErrorMsg('Zadaná hesla se neshodují.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!fillProfileNow) return true;

    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!/^(\+?[0-9]{9,15})$/.test(cleanPhone)) {
        setErrorMsg('Zadejte platné telefonní číslo (např. +420777123456).');
        return false;
      }
    }

    if (postalCode) {
      const cleanPsc = postalCode.replace(/\s+/g, '');
      if (!/^[0-9]{5}$/.test(cleanPsc)) {
        setErrorMsg('PSČ musí obsahovat 5 číslic (např. 11000).');
        return false;
      }
    }

    return true;
  };

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSkipProfile = () => {
    setFillProfileNow(false);
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreeTerms || !agreePrivacy) {
      setErrorMsg('Pro dokončení registrace musíte souhlasit s Podmínkami užívání a Zásadami ochrany osobních údajů.');
      return;
    }

    setLoading(true);

    try {
      const profileData = fillProfileNow
        ? {
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
            birthDate: birthDate || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            postalCode: postalCode.replace(/\s+/g, '') || undefined,
            autoFillDocs: true,
          }
        : undefined;

      const childrenData = fillProfileNow
        ? children
            .filter((c) => c.firstName.trim() || c.lastName.trim())
            .map((c) => ({
              name: `${c.firstName} ${c.lastName}`.trim(),
              firstName: c.firstName.trim(),
              lastName: c.lastName.trim(),
              birthDate: c.birthDate || undefined,
              notes: c.notes.trim() || undefined,
            }))
        : undefined;

      const consents = [
        { docKey: 'TERMS', docVersion: '1.0.0' },
        { docKey: 'PRIVACY', docVersion: '1.0.0' },
      ];

      const success = await register(
        name.trim() || (firstName ? `${firstName} ${lastName}`.trim() : email.split('@')[0]),
        email.trim(),
        password,
        'USER',
        profileData,
        childrenData,
        consents
      );

      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg('Registrace selhala. Zkontrolujte zadané údaje.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Při registraci došlo k chybě.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              T
            </div>
            <div>
              <h3 className="text-xl font-bold">Registrace do portálu</h3>
              <p className="text-xs text-slate-400">Táta má právo — Opatrovnický pomocník</p>
            </div>
          </div>

          {/* Stepper progress */}
          <div className="mt-6 flex items-center justify-between text-xs font-medium border-t border-slate-800 pt-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                1
              </span>
              <span>Účet</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-800"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              <span>Profil (volitelné)</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-800"></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                3
              </span>
              <span>Souhlasy</span>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <form onSubmit={handleNextToStep2} className="space-y-5">
              <div className="text-xs text-slate-600 mb-2">
                Krok 1: Zadejte základní e-mail a heslo pro vytvoření vašeho uživatelského účtu.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-mailová adresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan.novak@email.cz"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Heslo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimálně 6 znaků"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Potvrzení hesla <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Zadejte heslo znovu"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Jméno a příjmení / Zobrazované jméno (dobrovolné)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Novák"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Pokračovat na rozšíření profilu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Volitelné předvyplnění osobních údajů
                </div>
                <p>
                  Vyplnění těchto údajů je zcela dobrovolné. Pokud je vyplníte, systém vám v budoucnu automaticky předvyplní právní podání a žádosti na soud či OSPOD.
                </p>
              </div>

              {!fillProfileNow ? (
                <div className="text-center py-6 space-y-4 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <UserCheck className="w-10 h-10 text-blue-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">Chcete vyplnit rozšířený profil nyní?</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Můžete jej vyplnit hned teď nebo registraci rychle dokončit a údaje doplnit kdykoliv později ve svém profilu.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFillProfileNow(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4" />
                      Vyplnit profil nyní
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipProfile}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Přeskočit a pokračovat
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Osobní údaje otce / matky
                    </h4>
                    <button
                      type="button"
                      onClick={() => setFillProfileNow(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Skrýt tyto formuláře
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jméno</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jan"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Příjmení</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Novák"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Datum narození
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> Telefonní číslo
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+420 777 123 456"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> Ulice a číslo popisné
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Hlavní 123/4"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Město</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Praha"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">PSČ (5 čísel)</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="11000"
                          maxLength={5}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Children Section */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Baby className="w-4 h-4 text-blue-600" />
                        Údaje o dítěti / dětech
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddChild}
                        className="px-3 py-1 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Přidat dítě
                      </button>
                    </div>

                    {children.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Zatiaľ ste nepridali žiadne dieťa. Kliknite na tlačidlo "Přidat dítě".</p>
                    ) : (
                      <div className="space-y-3">
                        {children.map((child, index) => (
                          <div key={index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-700">Dítě #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveChild(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Jméno (např. Jakub)"
                                value={child.firstName}
                                onChange={(e) => handleChildChange(index, 'firstName', e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Příjmení (např. Novák)"
                                value={child.lastName}
                                onChange={(e) => handleChildChange(index, 'lastName', e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                              />
                              <input
                                type="date"
                                value={child.birthDate}
                                onChange={(e) => handleChildChange(index, 'birthDate', e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Zpět
                    </button>
                    <button
                      type="button"
                      onClick={handleNextToStep3}
                      className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Pokračovat k souhlasům</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Krok 3: Právní dokumenty a souhlasy
                </div>
                <p className="text-xs text-slate-600">
                  Pro dokončení registrace je nutné vyjádřit souhlas s právními dokumenty portálu:
                </p>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">Souhlasím s Podmínkami užívání služby (TERMS)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dokument specifikuje pravidla užívání neveřejné zóny a portálu.{' '}
                        <button
                          type="button"
                          onClick={() => onNavigateToDoc && onNavigateToDoc('/podminky-uzivani')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Zobrazit dokument
                        </button>
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">Souhlasím se Zásadami ochrany osobních údajů (PRIVACY / GDPR)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Potvrzuji, že jsem se seznámil se zpracováním osobních údajů v souladu s GDPR.{' '}
                        <button
                          type="button"
                          onClick={() => onNavigateToDoc && onNavigateToDoc('/gdpr')}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Zobrazit GDPR prohlášení
                        </button>
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zpět
                </button>
                <button
                  type="submit"
                  disabled={loading || !agreeTerms || !agreePrivacy}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? 'Vytvářím účet...' : 'Dokončit registraci'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
