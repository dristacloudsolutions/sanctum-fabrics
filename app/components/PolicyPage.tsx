export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-serif text-3xl text-[color:var(--ink)]">{title}</h1>
      <p className="mt-2 text-xs uppercase tracking-widest text-[color:var(--ink)]/40">Last updated: {updated}</p>
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function PolicySection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-lg text-[color:var(--ink)]">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-[color:var(--ink)]/70">{children}</div>
    </section>
  );
}
