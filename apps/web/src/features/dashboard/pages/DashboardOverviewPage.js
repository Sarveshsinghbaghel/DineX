import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet';
import { ModuleGrid } from '@/features/dashboard/components/ModuleGrid';
import { useDashboardModules } from '@/features/dashboard/hooks/useDashboardModules';
import { dashboardFilterSchema } from '@/features/dashboard/validation/dashboard.schema';
import { PageHeader } from '@/shared/components/ui/PageHeader';
const defaultValues = {
  search: '',
};
export function DashboardOverviewPage() {
  const form = useForm({
    resolver: zodResolver(dashboardFilterSchema),
    defaultValues,
  });
  const searchValue = form.watch('search');
  const { data: modules = [] } = useDashboardModules(searchValue);
  return _jsxs(_Fragment, {
    children: [
      _jsx(Helmet, {
        children: _jsx('title', {
          children: 'Operations Overview | DineX Restaurant Management System',
        }),
      }),
      _jsxs('section', {
        className: 'flex flex-col gap-6',
        children: [
          _jsxs('div', {
            className: 'glass-panel overflow-hidden px-6 py-8 sm:px-8',
            children: [
              _jsx(PageHeader, {
                eyebrow: 'Operations Overview',
                title: 'A steady starting point for restaurant operations.',
                description:
                  'This first delivery lays down the enterprise shell for future modules while already framing the workflows that matter most to service teams.',
              }),
              _jsxs('form', {
                className: 'mt-8 max-w-xl',
                children: [
                  _jsx('label', {
                    className: 'block text-sm font-semibold text-slate-700',
                    htmlFor: 'search',
                    children: 'Filter capability tracks',
                  }),
                  _jsx('input', {
                    id: 'search',
                    type: 'text',
                    placeholder: 'Search by workflow, focus area, or capability',
                    className:
                      'mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20',
                    ...form.register('search'),
                  }),
                ],
              }),
            ],
          }),
          _jsx(ModuleGrid, { modules: modules }),
        ],
      }),
    ],
  });
}
