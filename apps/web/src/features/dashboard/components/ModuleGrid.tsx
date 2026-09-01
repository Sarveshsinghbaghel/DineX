import type { DashboardModule } from '@/features/dashboard/types/dashboard.types';

interface ModuleGridProps {
  modules: DashboardModule[];
}

export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {modules.map((moduleItem, index) => (
        <article
          key={moduleItem.title}
          className="glass-panel p-6"
          style={{
            animation: `moduleReveal 320ms ease ${index * 80}ms both`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-sand/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-ember">
                {moduleItem.status}
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                {moduleItem.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{moduleItem.summary}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-ink px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              {moduleItem.metricLabel}
            </p>
            <p className="mt-2 text-lg font-semibold">{moduleItem.metricValue}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
