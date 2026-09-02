import { jsx as _jsx } from 'react/jsx-runtime';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/query/queryClient';
export function AppProviders({ children }) {
  return _jsx(QueryClientProvider, { client: queryClient, children: children });
}
