import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-md w-full text-center bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          401
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-slate-400 mb-6 text-sm">
          You must be signed in to access this page. Please log in with your account credentials.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
