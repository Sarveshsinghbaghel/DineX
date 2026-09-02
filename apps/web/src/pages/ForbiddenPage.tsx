import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-md w-full text-center bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          403
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Forbidden</h1>
        <p className="text-slate-400 mb-6 text-sm">
          You do not have the required permissions or role privileges to view this resource. Contact
          your administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-block w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
