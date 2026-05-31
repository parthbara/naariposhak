import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    authorized: false,
    message: '',
  });

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!isSupabaseConfigured) {
        setState({
          loading: false,
          authorized: false,
          message: 'Supabase environment variables are not configured.',
        });
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user?.email) {
        setState({ loading: false, authorized: false, message: '' });
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', session.user.email)
        .maybeSingle();

      if (!active) return;

      setState({
        loading: false,
        authorized: Boolean(data && !error),
        message: error
          ? 'Signed in, but this account is not authorized for admin access.'
          : '',
      });
    }

    verifyAdmin();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      verifyAdmin();
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  if (state.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-700">
        <div className="rounded-lg bg-white px-5 py-4 text-sm font-semibold shadow-admin ring-1 ring-slate-200">
          Verifying admin access...
        </div>
      </div>
    );
  }

  if (!state.authorized) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, authMessage: state.message }}
      />
    );
  }

  return children;
}
