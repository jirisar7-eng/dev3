import React, { useState, useEffect } from 'react';
import { Partner, PartnerType } from '../../types';
import { CheckCircle2, Plus, Edit2, Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Partner>>({
    name: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    type: PartnerType.PARTNER,
    order: 0,
    isActive: true,
  });

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/partners');
      if (!res.ok) throw new Error('Nepodařilo se načíst partnery.');
      const data = await res.json();
      setPartners(data);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání partnerů.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleEdit = (partner: Partner) => {
    setIsEditing(partner.id);
    setFormData({
      name: partner.name,
      description: partner.description,
      logoUrl: partner.logoUrl || '',
      websiteUrl: partner.websiteUrl || '',
      type: partner.type,
      order: partner.order,
      isActive: partner.isActive,
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      websiteUrl: '',
      type: PartnerType.PARTNER,
      order: 0,
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/admin/partners/${isEditing}` : '/api/admin/partners';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Operace se nezdařila.');
      }

      await fetchPartners();
      handleCancel();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete tohoto partnera smazat?')) return;
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Nepodařilo se smazat partnera.');
      await fetchPartners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && partners.length === 0) {
    return <div className="text-sm text-slate-500">Načítám partnery...</div>;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Správa Sponzorů a Partnerů</h2>
          <p className="text-xs text-slate-500 mt-1">Seznam všech organizací a dárců podílejících se na projektu.</p>
        </div>
      </div>

      <div className="p-6">
        {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm mb-6 font-bold">{error}</div>}
        
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            {isEditing ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-emerald-500" />}
            {isEditing ? 'Upravit partnera' : 'Přidat nového partnera'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Název organizace</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Popis (krátký)</label>
              <input
                required
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Loga (volitelné)</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Webová stránka (volitelné)</label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Typ</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PartnerType })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={PartnerType.SPONSOR}>Sponzor</option>
                <option value={PartnerType.PARTNER}>Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pořadí (menší = výše)</label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-bold text-slate-700">Aktivní</label>
            </div>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button type="submit" className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors">
              {isEditing ? 'Uložit změny' : 'Vytvořit partnera'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleCancel} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                Zrušit úpravy
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {partners.map(partner => (
            <div key={partner.id} className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${!partner.isActive ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {partner.name}
                    {!partner.isActive && <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Neaktivní</span>}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-lg">{partner.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {partner.type === PartnerType.SPONSOR ? 'Sponzor' : 'Partner'} (Ord: {partner.order})
                    </span>
                    {partner.websiteUrl && (
                      <a href={partner.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 font-bold bg-slate-100 text-slate-600 hover:text-blue-600 px-2 py-0.5 rounded-full transition-colors">
                        <LinkIcon className="w-3 h-3" /> Odkaz
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(partner)}
                  className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                  title="Upravit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                  title="Odstranit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {partners.length === 0 && !loading && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-600">Zatím nejsou vytvořeni žádní partneři</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
