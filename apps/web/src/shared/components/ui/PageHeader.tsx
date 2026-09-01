interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-moss">{eyebrow}</p>
      <h2 className="font-display text-4xl font-bold tracking-tight text-ink">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </header>
  );
}
