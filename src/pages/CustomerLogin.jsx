import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, UserRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.authMessage || '');
  const [message, setMessage] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const from = location.state?.from || '/profile';

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSignedIn(true);
        }
      });
    }
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured) {
      setError('Add Supabase keys before customer login can work.');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            phone: form.phone.trim(),
          },
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        setSignedIn(true);
        navigate(from, { replace: true });
        return;
      }

      // If session isn't returned immediately but confirmation is disabled, try signing in manually
      const { error: manualSignInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (!manualSignInError) {
        setSignedIn(true);
        navigate(from, { replace: true });
        return;
      }

      setMessage('Account created. Please sign in now.');
      setMode('signin');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
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
          <UserRound size={25} />
        </div>
        <div className="mt-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-maroon-900">
            {mode === 'signin' ? 'Customer Login' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Sign in before checkout so your order and payment proof stay together.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-full bg-cream p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setMessage('');
            }}
            className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${
              mode === 'signin' ? 'bg-maroon-700 text-white' : 'text-maroon-800'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setMessage('');
            }}
            className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${
              mode === 'signup' ? 'bg-maroon-700 text-white' : 'text-maroon-800'
            }`}
          >
            Create
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <label className="block">
                <span className="text-sm font-bold text-stone-700">Full name</span>
                <span className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 focus-within:border-maroon-700">
                  <UserRound size={17} className="text-stone-400" />
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    placeholder="Customer name"
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-stone-700">Phone</span>
                <span className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 focus-within:border-maroon-700">
                  <Phone size={17} className="text-stone-400" />
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    placeholder="98XXXXXXXX"
                  />
                </span>
              </label>
            </>
          )}

          <label className="block">
            <span className="text-sm font-bold text-stone-700">Email</span>
            <span className="mt-1 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 focus-within:border-maroon-700">
              <Mail size={17} className="text-stone-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="you@example.com"
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
                minLength="6"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                className="w-full border-0 bg-transparent text-sm outline-none"
                placeholder="Password"
              />
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-stone-300 text-maroon-700 focus:ring-maroon-700"
            />
            <span className="text-sm font-semibold text-stone-600">Keep me signed in</span>
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-maroon-700 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-5 block text-center text-xs font-bold uppercase tracking-wide text-stone-400 hover:text-maroon-700"
        >
          Staff access
        </Link>
      </div>
    </section>
  );
}
