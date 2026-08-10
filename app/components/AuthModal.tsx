'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const inputCls = 'w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]';

function AuthPanel({ onClose, subtitle }: { onClose?: () => void; subtitle: string }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(identifier, loginPassword);
      } else {
        await register(form);
      }
      // Only reached on success — login()/register() throw on failure, so this
      // never fires while `error` is about to be shown. Without this the modal
      // used to just sit there open on top of the now-signed-in page until the
      // user noticed and closed it themselves.
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-[color:var(--ink)]/40 hover:text-[color:var(--ink)]"
        >
          <X size={18} />
        </button>
      )}

      <p className="mb-4 text-sm text-[color:var(--ink)]/60">{subtitle}</p>

      <div className="mb-5 flex gap-4 border-b border-[color:var(--border)]">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`pb-3 text-sm font-semibold uppercase tracking-wide ${
              mode === m ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--ink)]' : 'text-[color:var(--ink)]/40'
            }`}
          >
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'login' ? (
          <>
            <input required placeholder="Phone or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputCls} />
            <input required type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
              <input required placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
            </div>
            <input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account & Continue'}
        </button>
      </form>
    </div>
  );
}

// Shared sign-in/register modal — used by the header's Sign In button (any
// page) and by checkout's optional "Have an account?" prompt. `subtitle`
// lets each call site explain why it's asking without forking the component.
export default function AuthModal({
  onClose,
  subtitle = 'Sign in to your account.',
}: {
  onClose: () => void;
  subtitle?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <AuthPanel onClose={onClose} subtitle={subtitle} />
      </div>
    </div>
  );
}
