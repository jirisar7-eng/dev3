import React, { useState, useEffect } from 'react';
import { User, UserChild, UserProfile } from '../../types';
import {
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  MapPin,
  Calendar,
  Baby,
  Plus,
  Trash2,
  Edit2,
  FileSearch,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Lock,
  Shield,
  Key,
  Copy,
  QrCode,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface UserProfileViewProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
  const token = localStorage.getItem('tatovacesta_auth_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'autofill' | 'security'>('profile');

  // 2FA TOTP States
  const [is2faEnabled, setIs2faEnabled] = useState(user.totpEnabled ?? false);
  const [mfaSetupStep, setMfaSetupStep] = useState<number>(0); // 0 = off, 1 = qr code / key, 2 = code verify, 3 = backup codes
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpVerifyCode, setTotpVerifyCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string>('');
  const [mfaSuccess, setMfaSuccess] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync state if user prop changes
  useEffect(() => {
    setIs2faEnabled(user.totpEnabled ?? false);
  }, [user.totpEnabled]);

  // Profile Form States
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');

  // Extended UserProfile States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [autoFillDocs, setAutoFillDocs] = useState(true);

  // Children State
  const [children, setChildren] = useState<UserChild[]>([]);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childNotes, setChildNotes] = useState('');

  // AutoFill Live Preview State
  const [templateSample, setTemplateSample] = useState<string>(
    `OKRESNÍ SOUD V {{user.city}}\n\nNavrhovatel: {{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}, bytem {{user.address}}, {{user.postalCode}} {{user.city}}\nKontakt: {{user.phone}}, {{user.email}}\n\nNezletilé dítě: {{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}\n\nVěc: Návrh na úpravu poměrů k nezletilému dítěti.`
  );
  const [previewResult, setPreviewResult] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Full Profile and Children on Mount / User change
  useEffect(() => {
    loadProfileData();
    loadChildrenData();
  }, [user.id]);

  const loadProfileData = async () => {
    try {
      const res = await fetch(`/api/user/profile/${user.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const p: UserProfile | undefined = data.profile;

        if (p) {
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          setBirthDate(p.birthDate || '');
          setPhone(p.phone || user.phone || '');
          setAddress(p.address || '');
          setCity(p.city || '');
          setPostalCode(p.postalCode || '');
          setAutoFillDocs(p.autoFillDocs ?? true);
        }
      }
    } catch (e) {
      console.error('Error loading full user profile:', e);
    }
  };

  const loadChildrenData = async () => {
    try {
      const res = await fetch(`/api/portal/children/${user.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setChildren(data);
        }
      }
    } catch (e) {
      console.error('Error loading children data:', e);
    }
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setAvatar(newAvatarUrl);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    // Frontend Validations
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!/^(\+?[0-9]{9,15})$/.test(cleanPhone)) {
        setStatusMsg({ type: 'error', text: 'Zadejte platné telefonní číslo (např. +420777123456).' });
        setSaving(false);
        return;
      }
    }

    if (postalCode) {
      const cleanPsc = postalCode.replace(/\s+/g, '');
      if (!/^[0-9]{5}$/.test(cleanPsc)) {
        setStatusMsg({ type: 'error', text: 'PSČ musí obsahovat 5 číslic (např. 11000).' });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: name || (firstName ? `${firstName} ${lastName}`.trim() : user.name),
          email,
          phone,
          bio,
          avatar,
          firstName,
          lastName,
          birthDate,
          address,
          city,
          postalCode,
          autoFillDocs,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        onProfileUpdated(result.user || result);
        setStatusMsg({ type: 'success', text: 'Profil a osobní údaje byly úspěšně uloženy.' });
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Uložení profilu selhalo.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba sítě při ukládání profilu.' });
    } finally {
      setSaving(false);
    }
  };

  // Child Management
  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFirstName.trim() && !childLastName.trim()) {
      setStatusMsg({ type: 'error', text: 'Zadejte alespoň jméno dítěte.' });
      return;
    }

    setStatusMsg(null);
    try {
      if (editingChildId) {
        // Edit existing child
        const res = await fetch(`/api/portal/children/${editingChildId}`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            firstName: childFirstName.trim(),
            lastName: childLastName.trim(),
            birthDate: childBirthDate,
            notes: childNotes.trim(),
          }),
        });
        if (res.ok) {
          setStatusMsg({ type: 'success', text: 'Záznam dítěte byl upraven.' });
          loadChildrenData();
          resetChildForm();
        } else {
          const err = await res.json();
          setStatusMsg({ type: 'error', text: err.error || 'Úprava selhala.' });
        }
      } else {
        // Create new child
        const res = await fetch('/api/portal/children', {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            userId: user.id,
            firstName: childFirstName.trim(),
            lastName: childLastName.trim(),
            birthDate: childBirthDate,
            notes: childNotes.trim(),
          }),
        });
        if (res.ok) {
          setStatusMsg({ type: 'success', text: 'Dítě bylo úspěšně přidáno do profilu.' });
          loadChildrenData();
          resetChildForm();
        } else {
          const err = await res.json();
          setStatusMsg({ type: 'error', text: err.error || 'Přidání dítěte selhalo.' });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Chyba sítě.' });
    }
  };

  const handleEditChildClick = (c: UserChild) => {
    setEditingChildId(c.id);
    setChildFirstName(c.firstName || c.name.split(' ')[0] || '');
    setChildLastName(c.lastName || c.name.split(' ').slice(1).join(' ') || '');
    setChildBirthDate(c.birthDate || '');
    setChildNotes(c.notes || '');
  };

  const handleDeleteChild = async (childId: string) => {
    if (!window.confirm('Opravdu chcete odebrat toto dítě z profilu?')) return;
    try {
      const res = await fetch(`/api/portal/children/${childId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Záznam dítěte byl odebrán.' });
        loadChildrenData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetChildForm = () => {
    setEditingChildId(null);
    setChildFirstName('');
    setChildLastName('');
    setChildBirthDate('');
    setChildNotes('');
  };

  // Preview Document Auto-fill
  const handleGeneratePreview = async () => {
    try {
      const res = await fetch('/api/portal/documents/autofill-preview', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ templateText: templateSample }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewResult(data.previewText);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'autofill') {
      handleGeneratePreview();
    }
  }, [activeTab, firstName, lastName, birthDate, address, city, postalCode, children]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Můj Profil & Předvyplnění dokumentů
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Správa vašich osobních údajů, údajů o dětech a nastavení automatického generování právních podání.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            ID: {user.id}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Osobní & Kontaktní údaje
        </button>

        <button
          onClick={() => setActiveTab('children')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'children' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Baby className="w-4 h-4" />
          Správa dětí ({children.length})
        </button>

        <button
          onClick={() => setActiveTab('autofill')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'autofill' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Předvyplňování dokumentů
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          Zabezpečení (2FA)
        </button>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* TAB 1: OSOBNÍ ÚDAJE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar & Account Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <img
              src={avatar || user.avatar}
              alt={name}
              className="w-20 h-20 rounded-2xl border-2 border-blue-600 object-cover bg-white shadow-xs"
            />
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="text-xs font-bold text-slate-900">Profilová fotografie / Avatar</h4>
              <p className="text-[11px] text-slate-500">Vygenerujte nový bezpečný náhodný avatar pro anonymizované diskuse.</p>
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Vygenerovat nový
              </button>
            </div>
          </div>

          {/* Account Essentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mailová adresa (Účet)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefonní číslo
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 777 123 456"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* Extended Document Data Section */}
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div>
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Rozšířené údaje pro předvyplnění žádostí a dokumentů
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tyto údaje slouží výhradně k předvyplňování vašich formulářů a právních podání.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                <span className="text-[11px] font-bold text-slate-700">Automatické předvyplnění:</span>
                <button
                  type="button"
                  onClick={() => setAutoFillDocs(!autoFillDocs)}
                  className="text-blue-600 cursor-pointer"
                >
                  {autoFillDocs ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jméno</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jan"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Příjmení</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Novák"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Město / Obec</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Praha 1"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Osobní poznámka k případu
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Stručný popis situace, příslušný OSPOD nebo jméno advokáta..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Ukládám...' : 'Uložit profil'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SPRÁVA DĚTÍ */}
      {activeTab === 'children' && (
        <div className="space-y-8">
          {/* Existing Children Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Baby className="w-4 h-4 text-blue-600" />
              Seznam evidovaných dětí
            </h3>

            {children.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Baby className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Zatím nemáte v profilu evidováno žádné dítě.</p>
                <p className="text-[11px] text-slate-400 mt-1">Použijte formulář níže pro přidání dítěte.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children.map((child) => (
                  <div key={child.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{child.name}</h4>
                      {child.birthDate && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Narozen(a): {child.birthDate}
                        </p>
                      )}
                      {child.notes && <p className="text-[11px] text-slate-600 italic mt-1">{child.notes}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditChildClick(child)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Upravit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child.id)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Odebrat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Child Form */}
          <form onSubmit={handleSaveChild} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              {editingChildId ? 'Úprava dítěte' : 'Přidat nové dítě do profilu'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jméno dítěte</label>
                <input
                  type="text"
                  placeholder="např. Jakub"
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Příjmení dítěte</label>
                <input
                  type="text"
                  placeholder="např. Novák"
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Datum narození</label>
                <input
                  type="date"
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poznámka / Zvláštní potřeby</label>
              <input
                type="text"
                placeholder="např. Škola ZŠ Nová, OSPOD MěÚ Nymburk..."
                value={childNotes}
                onChange={(e) => setChildNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {editingChildId && (
                <button
                  type="button"
                  onClick={resetChildForm}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Zrušit úpravy
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {editingChildId ? 'Uložit změny' : 'Uložit dítě'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUTO-FILL PREVIEW */}
      {activeTab === 'autofill' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Předvyplňovací modul dokumentů (Document Engine)
            </div>
            <p>
              Tento modul automaticky nahrazuje systémové značky (proměnné) ve vzorech dokumentů vašimi uloženými osobními údaji a údaji o dítěti.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Template */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Vzor šablony s proměnnými:</span>
                <span className="text-[10px] text-slate-400 font-mono">Např. &#123;&#123;user.firstName&#125;&#125;</span>
              </label>
              <textarea
                rows={10}
                value={templateSample}
                onChange={(e) => setTemplateSample(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[11px] text-slate-500">
                Dostupné proměnné: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;user.firstName&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;user.lastName&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;user.address&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;user.city&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;child.firstName&#125;&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">&#123;&#123;child.birthDate&#125;&#125;</code>.
              </p>
            </div>

            {/* Output Live Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-blue-600" />
                Živý náhled vygenerovaného dokumentu:
              </label>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 h-[240px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {previewResult || 'Generuji náhled...'}
              </div>
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="w-full py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Obnovit náhled dokumentu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab (2FA) */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-850" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Dvoufázové ověření (2FA / MFA)</h3>
              <p className="text-xs text-slate-500">Zabezpečte svůj účet pomocí jednorázových časových kódů (TOTP).</p>
            </div>
          </div>

          {/* MFA Required Status Notice */}
          {['SUPER_ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR', 'MODERATOR', 'ADMIN'].includes(user.role) && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-xs text-amber-800 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">Povinné zabezpečení:</span> Vaše role (<span className="font-mono">{user.role}</span>) vyžaduje aktivní dvoufázové ověření. Pokud jej vypnete nebo nenastavíte, systém vás nepustí do chráněných sekcí.
              </div>
            </div>
          )}

          {mfaError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100">
              {mfaError}
            </div>
          )}

          {mfaSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-100">
              {mfaSuccess}
            </div>
          )}

          {/* 1. NOT ENABLED AND NOT SETUP IN PROGRESS */}
          {!is2faEnabled && mfaSetupStep === 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                2FA není aktivní
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dvoufázové ověření přidává dodatečnou vrstvu zabezpečení k vašemu účtu. Po zadání hesla budete vyzváni k zadání jednorázového 6místného kódu z vaší mobilní aplikace (např. Google Authenticator, Microsoft Authenticator nebo 1Password).
              </p>
              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  setMfaError('');
                  setIsGenerating(true);
                  try {
                    const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || 'Nepodařilo se vygenerovat 2FA klíč.');
                    }
                    const data = await res.json();
                    setQrCodeData(data.qrCode);
                    setSecretKey(data.secret);
                    setBackupCodes(data.backupCodes);
                    setMfaSetupStep(1);
                  } catch (err: any) {
                    setMfaError(err.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="px-5 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {isGenerating ? 'Generuji...' : 'Aktivovat dvoufázové ověření'}
              </button>
            </div>
          )}

          {/* 2. SETUP STEP 1: SHOW QR CODE & KEY */}
          {!is2faEnabled && mfaSetupStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Krok 1: Naskenujte QR kód</h4>
                <p className="text-xs text-slate-500">
                  Otevřete svou autentizační aplikaci v telefonu a naskenujte tento QR kód.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="2FA QR Code" className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-36 h-36 bg-slate-200 flex items-center justify-center rounded-xl text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                <div className="space-y-3 flex-1 w-full text-left">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500">Tajný klíč (pokud nelze naskenovat):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 select-all flex-1 break-all">
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Kopírovat klíč"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Název účtu v aplikaci: <strong className="text-slate-700">TataMaPravo:{user.email}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(0)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(2)}
                  className="px-4 py-2 text-xs font-bold bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Pokračovat na ověření
                </button>
              </div>
            </div>
          )}

          {/* 3. SETUP STEP 2: VERIFY CODE */}
          {!is2faEnabled && mfaSetupStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Krok 2: Ověřte kód</h4>
                <p className="text-xs text-slate-500">
                  Zadejte 6místný kód, který se právě zobrazuje ve vaší aplikaci, aby se dokončilo nastavení.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">6místný kód z aplikace:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\s+/g, ''))}
                  className="w-full sm:w-48 p-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Zpět
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMfaError('');
                    try {
                      const res = await fetch('/api/auth/2fa/enable', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: totpVerifyCode }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        if (data.error === '2FA nebyla inicializována') {
                           setMfaSetupStep(0);
                           setMfaError('Platnost relace klíče vypršela. Vygenerujte prosím nový QR kód.');
                        } else {
                           throw new Error(data.error || 'Neplatný kód. Zkuste to prosím znovu.');
                        }
                        return;
                      }
                      setIs2faEnabled(true);
                      onProfileUpdated({ ...user, totpEnabled: true, totpBackupCodes: backupCodes });
                      setMfaSetupStep(3);
                    } catch (err: any) {
                      setMfaError(err.message);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Ověřit a zapnout
                </button>
              </div>
            </div>
          )}

          {/* 4. SETUP STEP 3: BACKUP CODES */}
          {mfaSetupStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">Dvoufázové ověření bylo úspěšně zapnuto!</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Záložní kódy pro nouzové obnovení</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pokud ztratíte přístup ke své autentizační aplikaci, můžete k přihlášení použít jeden z těchto záložních kódů. 
                  <strong className="block mt-1 text-slate-700">Každý záložní kód lze použít pouze jednou! Bezpečně si je uložte nebo vytiskněte.</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-xs text-slate-700 text-center">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white py-1.5 px-3 rounded-lg border border-slate-200 shadow-3xs font-bold">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMfaSetupStep(0);
                    setMfaSuccess('2FA je aktivní a plně nastavená.');
                  }}
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Hotovo, mám uloženo
                </button>
              </div>
            </div>
          )}

          {/* 5. ALREADY ENABLED */}
          {is2faEnabled && mfaSetupStep !== 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-emerald-900 text-xs">Zabezpečení 2FA je AKTIVNÍ</span>
                  <span className="text-[11px] text-emerald-700">Váš účet je chráněn časovými kódy.</span>
                </div>
              </div>

              {/* Disable Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-700">Vypnout dvoufázové ověření</h4>
                  <p className="text-xs text-slate-500">
                    Pokud dvoufázové ověření vypnete, snížíte tím bezpečnost svého účtu.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Pro vypnutí zadejte aktuální 6místný kód (nepovinné):</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={totpVerifyCode}
                      onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\s+/g, ''))}
                      className="w-full sm:w-48 p-2 rounded-xl border border-slate-200 text-sm font-mono tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Opravdu chcete vypnout dvoufázové ověření?')) return;
                      setMfaError('');
                      setMfaSuccess('');
                      try {
                        const res = await fetch('/api/auth/2fa/disable', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ code: totpVerifyCode }),
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(data.error || 'Nepodařilo se vypnout 2FA.');
                        }
                        setIs2faEnabled(false);
                        onProfileUpdated({ ...user, totpEnabled: false, totpSecret: undefined, totpBackupCodes: [] });
                        setTotpVerifyCode('');
                        setMfaSuccess('Dvoufázové ověření bylo vypnuto.');
                      } catch (err: any) {
                        setMfaError(err.message);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Vypnout dvoufázové ověření
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
