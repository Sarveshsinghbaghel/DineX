export function AppLoadingPage() {
  return (
    <div className="glass-panel mx-auto flex min-h-[240px] max-w-3xl items-center justify-center px-6 py-12">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">Loading</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          Preparing the X10Think workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The frontend foundation is loading shared providers, routes, and data clients.
        </p>
      </div>
    </div>
  );
}
