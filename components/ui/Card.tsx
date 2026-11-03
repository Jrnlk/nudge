export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card bg-soft p-5 ${className}`}>
      {title && <h2 className="mb-3 text-[17px] font-extrabold">{title}</h2>}
      {children}
    </section>
  );
}

export function PageHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-tile bg-soft p-7 text-center text-muted">
      {title && <strong className="text-[17px] text-ink">{title}</strong>}
      {children}
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  trailing,
}: {
  tabs: { key: T; label: React.ReactNode; ariaLabel?: string }[];
  value: T;
  onChange: (k: T) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div role="tablist" className="mb-3 flex items-center gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          aria-label={t.ariaLabel}
          onClick={() => onChange(t.key)}
          className={`rounded-full px-3.5 py-[7px] text-sm font-bold ${
            value === t.key ? "bg-soft text-ink shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted"
          }`}
        >
          {t.label}
        </button>
      ))}
      {trailing}
    </div>
  );
}
