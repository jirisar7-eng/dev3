import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { Users, ShieldAlert, Search, UserX, UserCheck, CheckCircle2, AlertCircle, RefreshCw, X, UserPlus, Database } from 'lucide-react';

export const UserManager: React.FC<{ onCreateMailbox?: (name: string) => void }> = ({ onCreateMailbox }) => {
  const { users, updateUserRole, loading, error, fetchUsers } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Quick Create State
  const [quickCreateName, setQuickCreateName] = useState('');
  const [quickCreateEmail, setQuickCreateEmail] = useState('');
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [quickCreateResult, setQuickCreateResult] = useState<{ password?: string, message?: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [userList, setUserList] = useState<User[]>(users);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load and sync with AuthContext
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setUserList(users);
  }, [users]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setStatusMsg(null);
    try {
      await fetchUsers();
      setStatusMsg({ type: 'success', text: 'Seznam uživatelů byl aktualizován.' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Aktualizace selhala: ' + (e.message || '') });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickCreateLoading(true);
    setStatusMsg(null);
    setQuickCreateResult(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/users/quick-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: quickCreateName, email: quickCreateEmail }),
      });

      if (res.status === 401) {
        alert('Relace vypršela. Přihlaste se prosím znovu.');
        window.location.href = '/prihlaseni';
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setQuickCreateResult({ message: data.message, password: data.generatedPassword });
        setQuickCreateName('');
        setQuickCreateEmail('');
        
        // Znovunačíst seznam uživatelů
        setUserList(prev => [data.user, ...prev]);
        setStatusMsg({ type: 'success', text: 'Uživatel byl úspěšně vytvořen.' });
        fetchUsers();
      } else {
        const err = await res.json().catch(() => null);
        setStatusMsg({ type: 'error', text: err?.error || 'Vytvoření uživatele selhalo.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba při komunikaci se serverem.' });
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Opravdu chcete smazat uživatele ${user.email}?`)) return;

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 401) {
        alert('Relace vypršela. Přihlaste se prosím znovu.');
        window.location.href = '/prihlaseni';
        return;
      }

      if (res.ok) {
        setUserList((prev) => prev.filter((u) => u.id !== user.id));
        setStatusMsg({ type: 'success', text: 'Uživatel smazán.' });
      } else {
        const err = await res.json().catch(() => null);
        setStatusMsg({ type: 'error', text: err?.error || 'Smazání selhalo.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba při komunikaci se serverem.' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingUser.name, email: editingUser.email, role: editingUser.role }),
      });

      if (res.status === 401) {
        alert('Relace vypršela. Přihlaste se prosím znovu.');
        window.location.href = '/prihlaseni';
        return;
      }

      if (res.ok) {
        const updated = await res.json();
        setUserList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setEditingUser(null);
        setStatusMsg({ type: 'success', text: 'Změny uloženy.' });
      } else {
        const err = await res.json().catch(() => null);
        setStatusMsg({ type: 'error', text: err?.error || 'Uložení selhalo.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba při ukládání.' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setStatusMsg({ type: 'success', text: `Role uživatele byla změněna na '${newRole}'.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Změna role selhala: ' + (err.message || '') });
    }
  };

  const roles: UserRole[] = [
    'USER', 
    'REGISTERED_USER', 
    'VERIFIED_USER', 
    'VOLUNTEER', 
    'VERIFIED_CONTRIBUTOR', 
    'MODERATOR', 
    'LEGAL_EDITOR', 
    'CONTENT_MANAGER', 
    'SYSTEM_ADMIN', 
    'ADMIN', 
    'SUPER_ADMIN'
  ];

  const filteredUsers = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setStatusMsg(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        alert('Relace vypršela. Přihlaste se prosím znovu.');
        window.location.href = '/prihlaseni';
        return;
      }

      if (res.ok) {
        const updated = await res.json();
        setUserList((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u)));
        setStatusMsg({
          type: 'success',
          text: `Stav účtu ${user.email} byl změněn na '${newStatus}'.`,
        });
      } else {
        const err = await res.json().catch(() => null);
        setStatusMsg({ type: 'error', text: err?.error || 'Změna stavu účtu selhala.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba při komunikaci se serverem.' });
    }
  };

  const handleAdminResetPassword = async (user: User) => {
    const confirmReset = window.confirm(`Opravdu chcete vygenerovat nové heslo pro uživatele ${user.email}?`);
    if (!confirmReset) return;

    setStatusMsg(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        alert('Relace vypršela. Přihlaste se prosím znovu.');
        window.location.href = '/prihlaseni';
        return;
      }

      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `Heslo uživatele ${user.email} bylo úspěšně resetováno a zasláno e-mailem.`,
        });
      } else {
        const err = await res.json().catch(() => null);
        setStatusMsg({ type: 'error', text: err?.error || 'Reset hesla selhal.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Chyba při resetu hesla.' });
    }
  };

  return (
    <div className="space-y-6" id="user-management-module">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Správa Uživatelů & RBAC
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Server-side správa uživatelských účtů, rolí (RBAC), stavů blokování a auditních protokolů.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Celkem registrovaných: {userList.length}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Aktualizovat seznam uživatelů"
            >
              <RefreshCw className={`w-3 h-3 ${loading || isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              Obnovit
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="user-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hledat uživatele dle jména / e-mailu..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Vymazat hledání"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Create Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs" id="quick-create-user-card">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          Rychlé vytvoření uživatele
        </h3>
        <form onSubmit={handleQuickCreate} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-600 mb-1">Jméno a příjmení</label>
            <input
              type="text"
              value={quickCreateName}
              onChange={(e) => setQuickCreateName(e.target.value)}
              placeholder="Jan Novák"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
            <input
              type="email"
              value={quickCreateEmail}
              onChange={(e) => setQuickCreateEmail(e.target.value)}
              placeholder="jan.novak@example.com"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>
          <button
            id="quick-create-submit-btn"
            type="submit"
            disabled={quickCreateLoading}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-400 cursor-pointer"
          >
            {quickCreateLoading ? 'Vytvářím...' : 'Vytvořit a poslat přístupy'}
          </button>
        </form>

        {quickCreateResult && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{quickCreateResult.message}</p>
              {quickCreateResult.password && (
                <div className="mt-2 text-xs text-emerald-800">
                  Vygenerované heslo: <code className="bg-white px-2 py-1 rounded border border-emerald-200 font-mono text-sm select-all">{quickCreateResult.password}</code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
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

      {error && !statusMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Chyba při komunikaci s databází uživatelů: {error}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
          >
            Zkusit znovu
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Uživatel</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Stav</th>
                <th className="p-3.5">Role (RBAC)</th>
                <th className="p-3.5">Registrace</th>
                <th className="p-3.5 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && userList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 text-slate-600 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Načítám seznam registrovaných uživatelů...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {searchTerm ? (
                      <div className="space-y-2">
                        <p className="text-slate-600">
                          Nenalezen žádný uživatel odpovídající hledanému výrazu <strong className="font-semibold text-slate-900">"{searchTerm}"</strong>.
                        </p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Zrušit filtr hledání
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-slate-600 font-medium">
                          V databázi zatím nejsou žádní uživatelé.
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Pomocí formuláře výše můžete rychle vytvořit nového uživatele.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuspended = u.status === 'SUSPENDED';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <img 
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`} 
                          alt={u.name} 
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-slate-100" 
                        />
                        <div>
                          <span className="block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 font-mono">{u.email}</td>

                      <td className="p-3.5">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                            <UserX className="w-3 h-3 text-red-600" />
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="p-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 bg-white"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('cs-CZ') : '–'}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                          title={isSuspended ? 'Aktivovat účet' : 'Blokovat účet'}
                        >
                          {isSuspended ? 'Aktivovat' : 'Blokovat'}
                        </button>

                        <button
                          onClick={() => handleAdminResetPassword(u)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="Resetovat heslo"
                        >
                          Reset Hesla
                        </button>

                        {onCreateMailbox && (
                          <button
                            onClick={() => onCreateMailbox(u.name)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Vytvořit @tatovacesta.cz e-mail"
                          >
                            Vytvořit e-mail
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(u)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                          title="Upravit uživatele"
                        >
                          Upravit
                        </button>

                        <button
                          onClick={() => handleDelete(u)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                          title="Smazat uživatele"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Upravit uživatele</h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Jméno</label>
              <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg text-xs" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
              <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg text-xs" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
              <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })} className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Zrušit</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">Uložit změny</button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <strong className="block font-bold">Server-Side Security & Audit Enforcement:</strong>
          <span>Všechny změny rolí, stavů blokování a resetů hesel vyvolávají zapsání události do serverového Audit Logu. Každý uživatel má výhradní přístup ke svým datům v portálu.</span>
        </div>
      </div>
    </div>
  );
};

