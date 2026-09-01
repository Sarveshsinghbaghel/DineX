import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import { RouteErrorFallback } from '@/pages/RouteErrorPage';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          title="The application ran into an unexpected problem."
          description="Reload the page to recover the shell. If the problem continues, capture the request details from the API or browser console before investigating."
        />
      );
    }

    return this.props.children;
  }
}
