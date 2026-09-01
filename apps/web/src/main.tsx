import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import '@/index.css';
import { AppProviders } from '@/providers/AppProviders';
import { router } from '@/routes';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  </React.StrictMode>,
);
