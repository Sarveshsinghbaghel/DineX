import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

interface RouteErrorFallbackProps {
  title?: string;
  description?: string;
}

export function RouteErrorFallback({ title, description }: RouteErrorFallbackProps) {
  return (
    <div className="glass-panel mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">Route error</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function RouteErrorPage() {
  const routeError = useRouteError();

  let title = 'This page could not be loaded.';
  let description =
    'The shell is still intact, but the requested route did not render successfully.';

  if (isRouteErrorResponse(routeError)) {
    title = `Route error ${routeError.status}`;
    description = routeError.statusText;
  }

  return <RouteErrorFallback title={title} description={description} />;
}
