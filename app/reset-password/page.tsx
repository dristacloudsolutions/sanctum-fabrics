'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing or invalid reset token. Please request a new password reset link.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto my-16 w-full max-w-md px-5">
      <div className="rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
            <Lock size={24} />
          </div>
          <h1 className="font-serif text-2xl text-[color:var(--ink)]">Reset Your Password</h1>
          <p className="mt-1.5 text-xs text-[color:var(--ink)]/60">
            Choose a new, secure password for your Sanctum Fabrics account.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-semibold text-emerald-900">Password Changed Successfully</p>
            <p className="text-xs text-[color:var(--ink)]/70">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
            >
              Go to Home &amp; Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                No reset token provided. If you clicked an email link, please ensure the entire URL was copied.
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/70">
                New Password (min. 8 characters) *
              </label>
              <input
                required
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 outline-none transition-all focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/70">
                Confirm New Password *
              </label>
              <input
                required
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 outline-none transition-all focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !token}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating password…</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[color:var(--ink)]/40">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>256-bit encrypted secure password update</span>
            </div>

            <div className="border-t border-[color:var(--border)] pt-4 text-center">
              <Link href="/" className="text-xs font-semibold text-[color:var(--accent)] hover:underline">
                ← Return to Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-[color:var(--ink)]/50">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
