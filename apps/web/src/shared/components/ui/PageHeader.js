import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export function PageHeader({ eyebrow, title, description }) {
  return _jsxs('header', {
    className: 'flex flex-col gap-3',
    children: [
      _jsx('p', {
        className: 'text-xs font-semibold uppercase tracking-[0.35em] text-moss',
        children: eyebrow,
      }),
      _jsx('h2', {
        className: 'font-display text-4xl font-bold tracking-tight text-ink',
        children: title,
      }),
      _jsx('p', {
        className: 'max-w-3xl text-sm leading-7 text-slate-600 sm:text-base',
        children: description,
      }),
    ],
  });
}
