import React, { useState, useEffect } from 'react';
import { Shield, Upload, History, Check, AlertTriangle, Image as ImageIcon, RotateCcw, Monitor, FileCode, CheckCircle2, Moon, Sun, Smartphone } from 'lucide-react';

interface BrandingVersion {
  id: string;
  version: number;
  primaryLogoSvg: string | null;
  darkLogoSvg: string | null;
  faviconSvg: string | null;
  logoAlt: string;
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
}

export const BrandingManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [editorSection, setEditorSection] = useState<'primary' | 'dark' | 'favicon'>('primary');
  
  const [currentBranding, setCurrentBranding] = useState<Partial<BrandingVersion>>({});
  const [history, setHistory] = useState<BrandingVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // Form states
  const [primarySvg, setPrimarySvg] = useState('');
  const [darkSvg, setDarkSvg] = useState('');
  const [faviconSvg, setFaviconSvg] = useState('');
  const [logoAlt, setLogoAlt] = useState('Táta má právo');

  const fetchBranding = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/admin/branding', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentBranding(data);
        setPrimarySvg(data.primaryLogoSvg || '');
        setDarkSvg(data.darkLogoSvg || '');
        setFaviconSvg(data.faviconSvg || '');
        setLogoAlt(data.logoAlt || 'Táta má právo');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/admin/branding/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
    fetchHistory();
  }, []);

  const validateSvg = async (svg: string) => {
    if (!svg.trim()) {
      setValidationResult(null);
      return true;
    }
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/admin/branding/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ svg })
      });
      const data = await res.json();
      setValidationResult(data);
      return data.valid;
    } catch (e) {
      setValidationResult({ valid: false, error: 'Nepodařilo se ověřit SVG' });
      return false;
    }
  };

  const handleSvgChange = (val: string, type: 'primary' | 'dark' | 'favicon') => {
    if (type === 'primary') setPrimarySvg(val);
    if (type === 'dark') setDarkSvg(val);
    if (type === 'favicon') setFaviconSvg(val);
    
    // Debounce validation could be added, but manual validation is safer before save
    setValidationResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    // Client side pre-validation
    let allValid = true;
    for (const svg of [primarySvg, darkSvg, faviconSvg]) {
      if (svg) {
         const isValid = await validateSvg(svg);
         if (!isValid) allValid = false;
      }
    }

    if (!allValid) {
      setMessage({ text: 'SVG obsahuje nepovolený obsah a nebude uloženo.', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          primaryLogoSvg: primarySvg,
          darkLogoSvg: darkSvg,
          faviconSvg: faviconSvg,
          logoAlt: logoAlt
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Branding byl úspěšně uložen (Nová verze v' + data.version + ')', type: 'success' });
        fetchBranding();
        fetchHistory();
      } else {
        setMessage({ text: data.error || 'Chyba při ukládání', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: 'Kritická chyba při ukládání', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm('Opravdu chcete obnovit tuto verzi brandingu?')) return;
    
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/admin/branding/restore/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ text: 'Verze byla úspěšně obnovena.', type: 'success' });
        fetchBranding();
        fetchHistory();
        setActiveTab('editor');
      }
    } catch (e) {
      setMessage({ text: 'Chyba při obnově.', type: 'error' });
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Opravdu chcete vymazat vlastní branding a vrátit se k výchozímu stavu?')) return;
    
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/admin/branding/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ text: 'Branding byl resetován na výchozí hodnoty.', type: 'success' });
        fetchBranding();
        fetchHistory();
      }
    } catch (e) {
      setMessage({ text: 'Chyba při resetu.', type: 'error' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Načítám branding manager...</div>;

  const currentSvgEditorVal = editorSection === 'primary' ? primarySvg : editorSection === 'dark' ? darkSvg : faviconSvg;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              Logo & Branding Editor
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Správa vizuální identity portálu. Změny jsou automaticky verzovány.
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'editor' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'history' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Historie
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            message.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            <span className="font-medium text-sm leading-relaxed">{message.text}</span>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Editor Sections Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto">
              {[
                { id: 'primary', label: 'Hlavní logo', icon: Sun },
                { id: 'dark', label: 'Logo pro tmavý režim', icon: Moon },
                { id: 'favicon', label: 'Favicon & PWA', icon: Smartphone }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setEditorSection(sec.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                    editorSection === sec.id 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <sec.icon className="w-4 h-4" />
                  {sec.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Code Editor Area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    SVG Kód ({editorSection})
                  </label>
                  <button 
                    onClick={() => validateSvg(currentSvgEditorVal)}
                    className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                  >
                    Ověřit bezpečnost
                  </button>
                </div>
                
                <textarea
                  value={currentSvgEditorVal}
                  onChange={(e) => handleSvgChange(e.target.value, editorSection)}
                  className="w-full h-[400px] font-mono text-xs bg-slate-900 text-green-400 p-4 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vložte validní SVG kód počínající <svg>..."
                  spellCheck={false}
                />
                
                {validationResult && (
                  <div className={`p-3 rounded-lg text-xs font-bold border flex items-start gap-2 ${
                    validationResult.valid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {validationResult.valid ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    {validationResult.valid ? 'SVG bylo úspěšně validováno' : `Chyba: ${validationResult.error}`}
                  </div>
                )}
              </div>

              {/* Live Preview Area */}
              <div className="space-y-6">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Živý náhled ({editorSection})
                </label>
                
                <div className="space-y-4">
                  {/* Light Background Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex items-center justify-center min-h-[160px]">
                     {currentSvgEditorVal ? (
                       <div className="max-w-[250px] max-h-[100px] object-contain flex items-center justify-center" dangerouslySetInnerHTML={{ __html: currentSvgEditorVal }} />
                     ) : (
                       <span className="text-slate-400 text-sm font-medium">Zatím nebylo zadáno SVG</span>
                     )}
                  </div>
                  
                  {/* Dark Background Preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center justify-center min-h-[160px]">
                     {currentSvgEditorVal ? (
                       <div className="max-w-[250px] max-h-[100px] object-contain flex items-center justify-center" dangerouslySetInnerHTML={{ __html: currentSvgEditorVal }} />
                     ) : (
                       <span className="text-slate-500 text-sm font-medium">Zatím nebylo zadáno SVG</span>
                     )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alternativní text loga (SEO)</label>
                    <input
                      type="text"
                      value={logoAlt}
                      onChange={(e) => setLogoAlt(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8">
              <button
                onClick={handleResetDefault}
                className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Obnovit výchozí branding
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                {saving ? 'Ukládám a validuji...' : 'Uložit branding'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                Zatím neexistuje žádná historie změn.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Verze</th>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3">Autor</th>
                      <th className="px-4 py-3">Stav</th>
                      <th className="px-4 py-3 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">v{item.version}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(item.updatedAt).toLocaleString('cs-CZ')}</td>
                        <td className="px-4 py-3 text-slate-600">{item.updatedBy}</td>
                        <td className="px-4 py-3">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                              Aktivní
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                              Archivováno
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!item.isActive && (
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="text-blue-600 font-bold text-xs hover:underline inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Obnovit
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
