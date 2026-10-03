'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

const inputCls = 'w-full rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to send your message');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white p-8 text-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
        <h3 className="mt-4 font-serif text-xl text-[color:var(--ink)]">Message sent</h3>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">Thanks for reaching out — we&apos;ll get back to you soon.</p>
        <button
          type="button"
          onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
          className="mt-5 text-sm font-semibold text-[color:var(--accent)] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[color:var(--border)] bg-white p-6 text-left">
      <h2 className="font-serif text-xl text-[color:var(--ink)]">Send us a message</h2>
      <p className="mt-1 text-sm text-[color:var(--ink)]/50">Prefer email over WhatsApp? Fill this out and we&apos;ll reply to your inbox.</p>

      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </div>
        <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} />
        <textarea
          required
          rows={4}
          placeholder="How can we help?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={inputCls}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Send size={15} /> {submitting ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
