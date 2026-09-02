import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { motion } from 'framer-motion';
export function ModuleGrid({ modules }) {
  return _jsx('div', {
    className: 'grid gap-4 md:grid-cols-2',
    children: modules.map((moduleItem, index) =>
      _jsxs(
        motion.article,
        {
          className: 'glass-panel p-6',
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay: index * 0.08 },
          children: [
            _jsx('div', {
              className: 'flex items-start justify-between gap-4',
              children: _jsxs('div', {
                children: [
                  _jsx('div', {
                    className:
                      'inline-flex rounded-full bg-sand/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-ember',
                    children: moduleItem.status,
                  }),
                  _jsx('h3', {
                    className: 'mt-4 font-display text-2xl font-semibold text-ink',
                    children: moduleItem.title,
                  }),
                  _jsx('p', {
                    className: 'mt-3 text-sm leading-6 text-slate-600',
                    children: moduleItem.summary,
                  }),
                ],
              }),
            }),
            _jsxs('div', {
              className: 'mt-6 rounded-2xl bg-ink px-4 py-4 text-white',
              children: [
                _jsx('p', {
                  className: 'text-xs uppercase tracking-[0.3em] text-white/70',
                  children: moduleItem.metricLabel,
                }),
                _jsx('p', {
                  className: 'mt-2 text-lg font-semibold',
                  children: moduleItem.metricValue,
                }),
              ],
            }),
          ],
        },
        moduleItem.title,
      ),
    ),
  });
}
