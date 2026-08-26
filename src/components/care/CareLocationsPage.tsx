import { apiFetch } from '../../utils/apiClient';
import React, { useState } from 'react';
import { ClientCase, CarePlan, CareLocation } from '../../types';
import {
  MapPin,
  ArrowLeft,
  Plus,
  Trash2,
  Car,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Edit2,
  X,
  Check,
} from 'lucide-react';

interface CareLocationsPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export const CareLocationsPage: React.FC<CareLocationsPageProps> = ({
  activeCase,
  activePlan,
  onNavigate,
  onRefresh,
}) => {
  const [locations, setLocations] = useState<CareLocation[]>(activePlan?.locations || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CareLocation | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locationType, setLocationType] = useState('HOME_A');
  const [isDefault, setIsDefault] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState<{ latitude?: number; longitude?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Route calculation state
  const [originIndex, setOriginIndex] = useState<number>(0);
  const [destIndex, setDestIndex] = useState<number>(1);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<{ distanceKm: number; durationMinutes: number } | null>(null);

  const handleOpenModal = (loc?: CareLocation) => {
    if (loc) {
      setEditingLocation(loc);
      setName(loc.name);
      setAddress(loc.address);
      setLocationType(loc.type || 'HOME_A');
      setIsDefault(loc.isDefault || false);
      setGeoResult({ latitude: loc.latitude, longitude: loc.longitude });
    } else {
      setEditingLocation(null);
      setName('');
      setAddress('');
      setLocationType('NEUTRAL');
      setIsDefault(false);
      setGeoResult(null);
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    setError(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/geocode`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!res.ok) throw new Error('Nepodařilo se ověřit adresu.');
      const data = await res.json();
      if (data.success && data.data) {
        setGeoResult({
          latitude: data.data.latitude,
          longitude: data.data.longitude,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Geocoding selhal.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError('Vyplňte název a adresu místa.');
      return;
    }
    if (!activePlan) {
      setError('Aktivní plán péče není k dispozici.');
      return;
    }

    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const newLoc: CareLocation = {
      id: editingLocation?.id || `loc-${Date.now()}`,
      planId: activePlan.id,
      name: name.trim(),
      address: address.trim(),
      type: locationType as any,
      latitude: geoResult?.latitude,
      longitude: geoResult?.longitude,
      isDefault,
    };

    let updatedList: CareLocation[];
    if (editingLocation) {
      updatedList = locations.map((l) => (l.id === editingLocation.id ? newLoc : l));
    } else {
      updatedList = [...locations, newLoc];
    }

    if (isDefault) {
      updatedList = updatedList.map((l) => ({ ...l, isDefault: l.id === newLoc.id }));
    }

    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          locations: updatedList,
          defaultLocationName: isDefault ? newLoc.name : activePlan.defaultLocationName,
          defaultLocationAddress: isDefault ? newLoc.address : activePlan.defaultLocationAddress,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) throw new Error('Databázový server je momentálně nedostupný.');
        throw new Error('Nepodařilo se uložit místo.');
      }

      setLocations(updatedList);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Chyba při ukládání.');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!activePlan) return;
    if (!confirm('Opravdu chcete odstranit toto místo?')) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const updatedList = locations.filter((l) => l.id !== id);
    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          locations: updatedList,
        }),
      });

      if (!res.ok) throw new Error('Nepodařilo se smazat místo.');
      setLocations(updatedList);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba.');
    }
  };

  const handleCalculateRoute = async () => {
    if (locations.length < 2) return;
    const origin = locations[originIndex];
    const dest = locations[destIndex];
    if (!origin || !dest) return;

    setCalculatingRoute(true);
    setRouteResult(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/route`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          origin: { address: origin.address, latitude: origin.latitude, longitude: origin.longitude },
          destination: { address: dest.address, latitude: dest.latitude, longitude: dest.longitude },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRouteResult(data.data);
        }
      }
    } catch (err) {
      console.error('Chyba výpočtu trasy:', err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  const locTypeBadge = (t?: string) => {
    switch (t) {
      case 'HOME_A':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">Domov Otce</span>;
      case 'HOME_B':
        return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">Domov Matky</span>;
      case 'SCHOOL':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">Škola / Školka</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">Neutrální místo</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('/pece')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na přehled Péče o dítě</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📍</span>
            <h1 className="text-2xl font-black text-slate-900">Místa předávání a dojezdy</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Spravujte adresy pro předávání dětí a spočítejte dojezdové vzdálenosti a časovou zátěž.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Přidat místo</span>
        </button>
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.length === 0 ? (
          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Zatím nemáte evidována žádná místa</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Přidejte domov otce, domov matky nebo školu pro automatický výpočet dojezdů a tras.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
            >
              + Přidat první místo
            </button>
          </div>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{loc.name}</h3>
                      {loc.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-md text-[9px] font-black uppercase">
                          Výchozí
                        </span>
                      )}
                    </div>
                    {locTypeBadge(loc.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(loc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-medium">{loc.address}</p>
                  {loc.latitude && loc.longitude && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      GPS: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Předávací bod</span>
                <span className="text-emerald-700 font-bold">Ověřeno</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Distance & Route Calculator */}
      {locations.length >= 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-900" />
            Kalkulátor dojezdové vzdálenosti a času
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Výchozí bod</label>
              <select
                value={originIndex}
                onChange={(e) => setOriginIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {locations.map((loc, idx) => (
                  <option key={loc.id} value={idx}>
                    {loc.name} ({loc.address})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cílový bod</label>
              <select
                value={destIndex}
                onChange={(e) => setDestIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {locations.map((loc, idx) => (
                  <option key={loc.id} value={idx}>
                    {loc.name} ({loc.address})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCalculateRoute}
                disabled={calculatingRoute}
                className="w-full py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {calculatingRoute ? 'Počítám trasu...' : 'Vypočítat trasu'}
              </button>
            </div>
          </div>

          {routeResult && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Vzdálenost</span>
                  <strong className="text-blue-950 text-base font-black">{routeResult.distanceKm.toFixed(1)} km</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Odhadovaný čas</span>
                  <strong className="text-blue-950 text-base font-black">{routeResult.durationMinutes} minut</strong>
                </div>
              </div>
              <span className="text-[11px] text-blue-800 font-bold">Standardní trasa po silnici</span>
            </div>
          )}
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingLocation ? 'Upravit místo' : 'Přidat místo předávání'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Název místa *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Např. Domov otce, ZŠ Květnového vítězství"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresa *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ulice, č.p., Město, PSČ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={geocoding}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    {geocoding ? '...' : 'Ověřit GPS'}
                  </button>
                </div>
                {geoResult && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-1">
                    ✓ GPS ověřeno: {geoResult.latitude?.toFixed(4)}, {geoResult.longitude?.toFixed(4)}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Typ místa</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="HOME_A">Domov Otce (Rodič A)</option>
                  <option value="HOME_B">Domov Matky (Rodič B)</option>
                  <option value="SCHOOL">Škola / Školka / Kroužek</option>
                  <option value="NEUTRAL">Neutrální veřejné místo</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded-md border-slate-300 text-blue-900 w-4 h-4"
                  />
                  <span>Nastavit jako výchozí předávací místo</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Uložit místo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
