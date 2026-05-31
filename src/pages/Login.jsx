import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'naariposhak@admin.com', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.authMessage || '');
  const [signedIn, setSignedIn] = useState(false);
  const from = location.state?.from || '/admin/orders';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env before signing in.');
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(form);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', data.user.email)
      .maybeSingle();

    setLoading(false);

    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      setError('This account is not listed in admin_users.');
      return;
    }

    setSignedIn(true);
    navigate(from, { replace: true });
  }

  if (signedIn) {
    return <Navigate to={from} replace />;
  }

  return (
    <section className="botanical-bg grid min-h-[72vh] place-items-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft ring-1 ring-maroon-100 sm:p-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-maroon-700 text-white">
          <ShieldCheck size={25} />
        </div>
        <div className="mt-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-maroon-900">Staff Access</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Secure access for Nari Poshak staff and superadmins.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Email</span>
            <span className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 focus-within:border-maroon-700">
              <Mail size={17} className="text-stone-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="naariposhak@admin.com"
              />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-stone-700">Password</span>
            <span className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 focus-within:border-maroon-700">
              <Lock size={17} className="text-stone-400" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="Password"
              />
            </span>
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-maroon-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}
