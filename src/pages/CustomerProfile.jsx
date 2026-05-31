import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';
import { LogOut, PackageOpen, RefreshCw, UserRound } from 'lucide-react';

const statuses = {
  pending: 'bg-amber-100 text-amber-800',
  called: 'bg-indigo-100 text-indigo-800',
  confirmed: 'bg-cyan-100 text-cyan-800',
  in_progress: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-800',
};

const currencyFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setLoading(false);
        return;
      }

      setSession(session);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        setError('Could not load your order history.');
      } else {
        setOrders(ordersData || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    navigate('/');
  }

  if (loading) {
    return (
      <div className="botanical-bg grid min-h-[72vh] place-items-center px-4 py-10">
        <div className="inline-flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-bold text-maroon-800 shadow-soft">
          <RefreshCw size={18} className="animate-spin" />
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/customer-login" state={{ from: '/profile' }} replace />;
  }

  return (
    <div className="botanical-bg min-h-[72vh] py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-maroon-100 text-maroon-800 shadow-inner">
              <UserRound size={28} />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-maroon-900">My Profile</h1>
              <p className="font-semibold text-stone-600">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon-200 bg-white px-6 py-2.5 text-sm font-extrabold text-maroon-800 shadow-soft transition hover:bg-maroon-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </header>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink">
            <PackageOpen size={24} className="text-maroon-700" />
            Order History
          </h2>
          
          <div className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-800">
                {error}
              </div>
            )}

            {!error && orders.length === 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft">
                <p className="text-stone-500 font-medium">You haven't placed any orders yet.</p>
                <button
                  onClick={() => navigate('/shop')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-maroon-700 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-maroon-800"
                >
                  Browse Shop
                </button>
              </div>
            )}

            {!error && orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-soft transition hover:shadow-md sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between sm:justify-start sm:gap-4">
                    <h3 className="font-serif text-xl font-bold text-ink">
                      {order.product_title || order.item}
                    </h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${statuses[order.status] || statuses.pending}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-stone-500">
                    <p>Order ID: <span className="font-mono text-xs">{order.id.slice(0, 8)}</span></p>
                    <p>Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-stone-100 pt-4 sm:mt-0 sm:border-0 sm:pt-0 sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Total Amount</p>
                  <p className="mt-1 text-xl font-bold text-maroon-800">
                    {currencyFormatter.format(order.total_amount)}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">Qty: {order.quantity || 1}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
