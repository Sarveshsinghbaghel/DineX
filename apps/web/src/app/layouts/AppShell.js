import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { navigationItems } from '@/shared/constants/navigation';
export function AppShell({ children }) {
    return (_jsx("div", { className: "min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8", children: _jsxs("div", { className: "mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row", children: [_jsxs("aside", { className: "glass-panel w-full overflow-hidden lg:max-w-xs", children: [_jsxs("div", { className: "border-b border-slate-200/70 px-6 py-6", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.35em] text-ember", children: "X10Think" }), _jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight", children: "Restaurant OS" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Command center for floor operations, kitchen flow, payments, inventory, and reporting." })] }), _jsx("nav", { className: "space-y-2 px-4 py-4", children: navigationItems.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => [
                                    'block rounded-2xl px-4 py-3 text-sm font-medium transition',
                                    isActive
                                        ? 'bg-ink text-white'
                                        : 'text-slate-600 hover:bg-white/80 hover:text-ink',
                                ].join(' '), children: [_jsx("span", { className: "block", children: item.label }), _jsx("span", { className: "mt-1 block text-xs opacity-80", children: item.description })] }, item.to))) })] }), _jsx("main", { className: "flex-1", children: children })] }) }));
}
