import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Trash2, KeyRound, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const MailcowManager: React.FC<{ initialName?: string }> = ({ initialName = '' }) => {
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formName, setFormName] = useState(initialName);
  const [formLocalPart, setFormLocalPart] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formQuota, setFormQuota] = useState(3072); // 3GB default

  const translateMailcowError = (msg: string): string => {
    if (!msg) return 'Neznámá chyba';
    const lowercaseMsg = msg.toLowerCase();
    if (lowercaseMsg.includes('password_complexity') || lowercaseMsg.includes('complexity')) {
      return "Heslo je příliš jednoduché. Musí obsahovat velká i malá písmena, čísla a speciální znaky (např. !@#$%^&*).";
    }
    if (lowercaseMsg.includes('invalid_quota') || lowercaseMsg.includes('quota')) {
      return "Zadaná neplatná velikost schránky.";
    }
    if (lowercaseMsg.includes('mailbox_exists') || lowercaseMsg.includes('exists') || lowercaseMsg.includes('already exists')) {
      return "Tato e-mailová schránka již existuje.";
    }
    return msg;
  };

  const generatePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const nums = "23456789";
    const syms = "!@#$%*_-";
    const allChars = upper + lower + nums + syms;

    const length = 20;
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let passwordArray = [
      upper[randomValues[0] % upper.length],
      lower[randomValues[1] % lower.length],
      nums[randomValues[2] % nums.length],
      syms[randomValues[3] % syms.length],
    ];

    for (let i = 4; i < length; i++) {
      passwordArray.push(allChars[randomValues[i] % allChars.length]);
    }

    // Fisher-Yates shuffle s window.crypto
    const shuffleValues = new Uint32Array(length);
    window.crypto.getRandomValues(shuffleValues);
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = shuffleValues[i] % (i + 1);
      const temp = passwordArray[i];
      passwordArray[i] = passwordArray[j];
      passwordArray[j] = temp;
    }

    setFormPassword(passwordArray.join(''));
  };

  const fetchMailboxes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/mailcow/mailboxes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const errText = await res.text();
        console.error("Neplatná odpověď serveru:", errText);
        throw new Error("API endpoint nevrátil JSON data.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Chyba serveru (${res.status})`);
      }

      setMailboxes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Chyba připojení k serveru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const email = `${formLocalPart.toLowerCase().trim()}@tatovacesta.cz`;
      const res = await fetch('/api/mailcow/mailboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          local_part: formLocalPart, 
          domain: 'tatovacesta.cz', 
          name: formName, 
          password: formPassword, 
          quota: formQuota 
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errText = await res.text();
        console.error("Neplatná odpověď serveru:", errText);
        throw new Error("API endpoint nevrátil JSON data.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(translateMailcowError(data.error) || `Chyba serveru (${res.status})`);
      }

      setSuccess(`Schránka ${email} úspěšně vytvořena.`);
      setFormLocalPart('');
      setFormName('');
      setFormPassword('');
      fetchMailboxes();
    } catch (e: any) {
      setError(translateMailcowError(e.message) || 'Chyba připojení k serveru.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Opravdu chcete smazat schránku ${email}?`)) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/mailcow/mailboxes/${email}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errText = await res.text();
        console.error("Neplatná odpověď serveru:", errText);
        throw new Error("API endpoint nevrátil JSON data.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(translateMailcowError(data.error) || `Chyba serveru (${res.status})`);
      }

      setSuccess(`Schránka ${email} smazána.`);
      fetchMailboxes();
    } catch (e: any) {
      setError(translateMailcowError(e.message) || 'Chyba při mazání schránky.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (email: string) => {
    const newPassword = prompt(`Zadejte nové heslo pro ${email}:`);
    if (!newPassword) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/mailcow/mailboxes/${email}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errText = await res.text();
        console.error("Neplatná odpověď serveru:", errText);
        throw new Error("API endpoint nevrátil JSON data.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(translateMailcowError(data.error) || `Chyba serveru (${res.status})`);
      }

      setSuccess(`Heslo pro ${email} úspěšně změněno.`);
    } catch (e: any) {
      setError(translateMailcowError(e.message) || 'Chyba při změně hesla.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Správa e-mailů (Mailcow)</h2>
          <p className="text-xs text-slate-500">Vytváření a správa e-mailových schránek @tatovacesta.cz</p>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
          success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
          <span>{success || error}</span>
        </div>
      )}

      {/* Form for new mailbox */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Vytvořit novou schránku</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Název schránky</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={formLocalPart}
                  onChange={(e) => setFormLocalPart(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="např. pavel.novak"
                  className="w-full p-2 border border-r-0 border-slate-200 rounded-l-lg text-xs"
                  required
                />
                <span className="p-2 bg-slate-50 border border-slate-200 rounded-r-lg text-xs font-mono text-slate-600">@tatovacesta.cz</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Celé jméno</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Pavel Novák"
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Heslo</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
                <button type="button" onClick={generatePassword} className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold shrink-0">
                  Vygenerovat
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kvóta (velikost)</label>
              <select
                value={formQuota}
                onChange={(e) => setFormQuota(Number(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value={1024}>1 GB</option>
                <option value={2048}>2 GB</option>
                <option value={3072}>3 GB</option>
                <option value={5120}>5 GB</option>
                <option value={10240}>10 GB</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Zpracovávám...' : 'Vytvořit schránku'}
          </button>
        </form>
      </div>

      {/* Table of mailboxes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Seznam schránek v Mailcow</h3>
          <button onClick={fetchMailboxes} disabled={loading} className="text-slate-500 hover:text-slate-800 p-1">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">E-mail</th>
                <th className="p-3">Držitel</th>
                <th className="p-3">Využití kapacity</th>
                <th className="p-3">Stav</th>
                <th className="p-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mailboxes.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Žádné schránky k zobrazení.</td></tr>
              ) : (
                mailboxes.map((m: any) => {
                  const quotaMB = m.quota ? Math.round(m.quota / 1024 / 1024) : 0;
                  const usedMB = m.quota_used ? Math.round(m.quota_used / 1024 / 1024) : 0;
                  const usagePct = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0;
                  return (
                    <tr key={m.username} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-800">{m.username}</td>
                      <td className="p-3 font-medium text-slate-700">{m.name || '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${usagePct > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, usagePct)}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-500">{usedMB} / {quotaMB} MB ({usagePct}%)</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {m.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleChangePassword(m.username)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Změnit heslo"
                        >
                          Změnit heslo
                        </button>
                        <button
                          onClick={() => handleDelete(m.username)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                          title="Smazat schránku"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
