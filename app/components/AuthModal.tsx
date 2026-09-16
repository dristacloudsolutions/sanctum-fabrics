'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, ArrowRight, ShieldCheck, Mail, User, RotateCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const inputCls =
  'w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 outline-none transition-all focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10';

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/70 mb-1';

function AuthPanel({ onClose, subtitle }: { onClose?: () => void; subtitle: string }) {
  const { login, register, requestOtp, verifyOtp } = useAuth();

  // Auth flow mode: 'otp' is the primary modern flow, 'password' is the legacy fallback
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');

  // OTP flow states: 'phone' -> 'verify'
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegistered, setIsRegistered] = useState(true);

  // New user registration fields (shown if not registered)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(30);

  // Password fallback states
  const [passwordMode, setPasswordMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpStep !== 'verify' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  // Handle requesting OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await requestOtp(cleanPhone);
      setIsRegistered(res.is_registered);
      setOtpStep('verify');
      setCountdown(30);
      setOtp('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resending OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || submitting) return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setSubmitting(true);
    setError(null);
    try {
      await requestOtp(cleanPhone);
      setCountdown(30);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle verifying OTP & logging in or registering
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    // If new user, name is required
    if (!isRegistered && !firstName.trim()) {
      setError('Please provide your name to create your account');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      await verifyOtp({
        phone: cleanPhone,
        otp: cleanOtp,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
      });

      onClose?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle password-based login/register fallback
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (passwordMode === 'login') {
        await login(identifier, password);
      } else {
        await register(passwordForm);
      }
      onClose?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle forgot password request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
      setResetSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-white p-7 shadow-2xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 rounded-full p-1.5 text-[color:var(--ink)]/40 hover:bg-[color:var(--cream)] hover:text-[color:var(--ink)] transition-colors"
        >
          <X size={18} />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-[color:var(--ink)]">
          {authMethod === 'password'
            ? passwordMode === 'forgot'
              ? 'Reset Password'
              : passwordMode === 'login'
              ? 'Sign In with Password'
              : 'Create Account'
            : otpStep === 'phone'
            ? 'Sign in to Sanctum'
            : isRegistered
            ? 'Enter Verification Code'
            : 'Complete Your Account'}
        </h2>
        <p className="mt-1.5 text-xs text-[color:var(--ink)]/60 leading-relaxed">
          {authMethod === 'password' && passwordMode === 'forgot'
            ? 'Enter your registered email address to receive a secure link to reset your password.'
            : otpStep === 'phone' || authMethod === 'password'
            ? subtitle
            : `We've sent a 6-digit verification code to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
        </p>
      </div>

      {/* ─── Method 1: Mobile OTP Flow ────────────────────────────────────────── */}
      {authMethod === 'otp' && (
        <>
          {otpStep === 'phone' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className={labelCls}>Mobile Number *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 flex items-center gap-1 text-sm font-semibold text-[color:var(--ink)]/60">
                    <span>+91</span>
                  </span>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    autoFocus
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className={`${inputCls} pl-14 font-medium tracking-wide`}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[color:var(--ink)]/50">
                  We&apos;ll send an OTP via SMS to sign in or create your account automatically.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || phone.replace(/\D/g, '').length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending code…</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[color:var(--ink)]/40">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Fast &amp; 100% secure mobile authentication</span>
              </div>
            </form>
          )}

          {otpStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* If user is not registered, ask for Name and Optional Email */}
              {!isRegistered && (
                <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]/40 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--accent)]">
                    <User size={14} />
                    <span>New Customer Profile</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={labelCls}>First Name *</label>
                      <input
                        required
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name</label>
                      <input
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Email (Optional)</label>
                    <div className="relative flex items-center">
                      <Mail size={13} className="absolute left-3 text-[color:var(--ink)]/40" />
                      <input
                        type="email"
                        placeholder="yourname@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-white pl-8 pr-3 py-2 text-xs text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[color:var(--ink)]/50">
                      Kept on your account for order receipts &amp; courier tracking updates.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>6-Digit Verification Code *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('phone');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={`${inputCls} text-center text-lg font-bold tracking-widest`}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || otp.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : isRegistered ? (
                  'Verify & Sign In'
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                {countdown > 0 ? (
                  <span className="text-[color:var(--ink)]/50">
                    Resend code in <strong className="font-semibold text-[color:var(--ink)]">{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={submitting}
                    className="inline-flex items-center gap-1 font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    <RotateCw size={12} /> Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Toggle to Password fallback */}
          <div className="mt-6 border-t border-[color:var(--border)] pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setError(null);
              }}
              className="text-xs font-semibold text-[color:var(--ink)]/60 hover:text-[color:var(--accent)] hover:underline transition-colors"
            >
              Sign in with password instead
            </button>
          </div>
        </>
      )}

      {/* ─── Method 2: Password Fallback ──────────────────────────────────────── */}
      {authMethod === 'password' && (
        <div>
          {passwordMode === 'forgot' ? (
            <div className="space-y-4">
              {resetSuccess ? (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Mail size={20} />
                  </div>
                  <p className="text-sm font-semibold text-emerald-900">Reset Link Sent</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    If an account exists with <span className="font-medium">{forgotEmail}</span>, a secure password reset link has been dispatched to your email.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode('login');
                      setResetSuccess(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--accent)] hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className={labelCls}>Registered Email Address *</label>
                    <input
                      required
                      type="email"
                      autoFocus
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputCls}
                    />
                    <p className="mt-1.5 text-[11px] text-[color:var(--ink)]/50">
                      We will send instructions to create a new password.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending reset link…</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode('login');
                        setError(null);
                      }}
                      className="font-medium text-[color:var(--ink)]/70 hover:text-[color:var(--accent)]"
                    >
                      ← Back to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setError(null);
                      }}
                      className="font-semibold text-[color:var(--accent)] hover:underline"
                    >
                      Use Mobile OTP instead
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="mb-5 flex gap-4 border-b border-[color:var(--border)]">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setPasswordMode(m);
                      setError(null);
                    }}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      passwordMode === m
                        ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--ink)]'
                        : 'text-[color:var(--ink)]/40 hover:text-[color:var(--ink)]/70'
                    }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                {passwordMode === 'login' ? (
                  <>
                    <div>
                      <label className={labelCls}>Phone or Email *</label>
                      <input
                        required
                        placeholder="Mobile number or email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>Password *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordMode('forgot');
                            setError(null);
                            setResetSuccess(false);
                            if (identifier.includes('@')) setForgotEmail(identifier);
                          }}
                          className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <input
                        required
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </>
                ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input
                      required
                      placeholder="First name"
                      value={passwordForm.first_name}
                      onChange={(e) => setPasswordForm({ ...passwordForm, first_name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input
                      required
                      placeholder="Last name"
                      value={passwordForm.last_name}
                      onChange={(e) => setPasswordForm({ ...passwordForm, last_name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={passwordForm.phone}
                    onChange={(e) => setPasswordForm({ ...passwordForm, phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="yourname@example.com"
                    value={passwordForm.email}
                    onChange={(e) => setPasswordForm({ ...passwordForm, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Password *</label>
                  <input
                    required
                    type="password"
                    placeholder="Create a password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[color:var(--primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[color:var(--primary)]/90 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : passwordMode === 'login' ? 'Sign In' : 'Create Account & Continue'}
            </button>
              </form>
            </>
          )}

          <div className="mt-5 border-t border-[color:var(--border)] pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--accent)] hover:underline"
            >
              <Phone size={13} /> Sign in using Mobile OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthModal({
  onClose,
  subtitle = 'Sign in to save your address, track your shipments, and complete your order seamlessly.',
}: {
  onClose: () => void;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 py-8 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="my-auto w-full max-w-md">
        <AuthPanel onClose={onClose} subtitle={subtitle} />
      </div>
    </div>,
    document.body
  );
}
