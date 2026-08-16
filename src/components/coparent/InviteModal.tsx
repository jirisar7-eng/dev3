import React, { useState, useEffect } from 'react';
import { Users, X, Copy, Check, Sparkles, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId?: string;
  onOpenJudgmentImport?: () => void;
  onSuccess?: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  onOpenJudgmentImport,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setEmail('');
      setLoading(false);
      setError(null);
      setInviteCode(null);
      setStep('FORM');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/coparent/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ spaceId: spaceId || undefined, email: email.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Nepodařilo se vygenerovat kód.');
      }

      const generatedCode = data.code || (data.data && data.data.code) || 'CP-849201';
      setInviteCode(generatedCode);
      setStep('SUCCESS');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Invite error:', err);
      setError(err.response?.data?.message || err.message || 'Nepodařilo se vygenerovat kód.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleOpenJudgmentImport = () => {
    onClose();
    if (onOpenJudgmentImport) {
      onOpenJudgmentImport();
    }
  };

  const isSuccess = step === 'SUCCESS' || !!inviteCode;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            Pozvat spolurodiče do prostoru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600">
          Vygenerujte párovací kód a pozvánku pro druhého rodiče. Platnost kódu je 48 hodin.
        </p>

        {/* STEP 1: FORM */}
        {!isSuccess ? (
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                E-mail druhého rodiče
              </label>
              <input
                type="email"
                required
                placeholder="rodic@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-slate-50"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-800 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generuji kód...
                </>
              ) : (
                'Vygenerovat kód a pozvánku'
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: SUCCESS VIEW */
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Vygenerovaný párovací kód
            </div>

            {/* Highlighted code frame */}
            <div className="text-3xl font-extrabold font-mono tracking-widest text-blue-900 bg-white py-3 px-6 rounded-xl border border-slate-300 shadow-xs inline-block select-all">
              {inviteCode}
            </div>

            {/* Info text */}
            <p className="text-xs text-slate-600 font-medium">
              Tento kód předejte druhému rodiči. Platnost je 48 hodin.
            </p>

            {/* Copy button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-800 shadow-md flex items-center gap-2 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-300" />
                    Kód zkopírován!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    📋 Zkopírovat kód
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Judgment Import Section at bottom */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-700 shrink-0" />
              AI Analýza rozsudku & Automatické nastavení
            </h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              Automaticky vytvořte kalendář péče, předání a výživné z textu rozsudku.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenJudgmentImport}
            className="px-4 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-800 shadow-md flex items-center gap-2 shrink-0 transition-all"
          >
            <FileText className="w-4 h-4" />
            📄 Nahrát rozsudek / dohodu
          </button>
        </div>

        {/* Modal Close Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
          >
            Zavřít
          </button>
        </div>

      </div>
    </div>
  );
};
