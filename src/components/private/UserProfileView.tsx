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
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'autofill'>('profile');

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
    </div>
  );
};
