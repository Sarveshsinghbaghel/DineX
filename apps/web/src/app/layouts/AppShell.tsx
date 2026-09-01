import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import { navigationItems } from '@/shared/constants/navigation';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="glass-panel w-full overflow-hidden lg:max-w-xs">
          <div className="border-b border-slate-200/70 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">
              X10Think
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Restaurant OS
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Command center for floor operations, kitchen flow, payments, inventory, and
              reporting.
            </p>
          </div>

          <nav className="space-y-2 px-4 py-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-ink text-white'
                      : 'text-slate-600 hover:bg-white/80 hover:text-ink',
                  ].join(' ')
                }
              >
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs opacity-80">{item.description}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
