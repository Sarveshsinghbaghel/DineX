import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const isRegister = location.pathname === '/register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      void navigate(isRegister ? '/login' : '/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete this request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="glass-panel w-full px-7 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember">X10Think</p>
        <h1 className="mt-4 font-display text-4xl font-bold">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isRegister
            ? 'Start with a secure workspace identity.'
            : 'Sign in to continue to your restaurant workspace.'}
        </p>
        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
          {isRegister && (
            <label className="block text-sm font-semibold">
              Name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-ember"
              />
            </label>
          )}
          <label className="block text-sm font-semibold">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-ember"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              required
              type="password"
              minLength={isRegister ? 12 : 1}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-ember"
            />
          </label>
          <button
            disabled={submitting}
            className="w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Working...' : isRegister ? 'Register' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? 'Already registered? ' : 'Need an account? '}
          <Link className="font-semibold text-ember" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Register'}
          </Link>
        </p>
      </section>
    </main>
  );
}
