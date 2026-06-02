import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const statusClasses = {
  pending: 'bg-amber-100 text-amber-800',
  called: 'bg-indigo-100 text-indigo-800',
  confirmed: 'bg-cyan-100 text-cyan-800',
  in_progress: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-800',
};

function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatShortDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchAll() {
    setLoading(true);
    setError('');

    const [ordersResult, productsResult] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);

    if (ordersResult.error) {
      setError(ordersResult.error.message);
    } else if (productsResult.error) {
      setError(productsResult.error.message);
    }

    setOrders(ordersResult.data || []);
    setProducts(productsResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  /* ── Metric cards ── */
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders],
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length,
    [orders],
  );

  const totalProducts = products.length;

  const totalCustomers = useMemo(() => {
    const ids = new Set();
    orders.forEach((o) => {
      const key = o.customer_id || o.customer_phone || o.customer_email || o.customer_name;
      if (key) ids.add(key);
    });
    return ids.size;
  }, [orders]);

  /* ── Revenue chart (last 30 days) ── */
  const revenueByDay = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dayMap = {};

    // Seed last 30 days with zero
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }

    orders
      .filter((o) => o.status === 'completed' && o.created_at)
      .forEach((o) => {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        if (dayMap[key] !== undefined) {
          dayMap[key] += Number(o.total_amount || 0);
        }
      });

    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
  }, [orders]);

  const maxDayRevenue = useMemo(
    () => Math.max(...revenueByDay.map((d) => d.amount), 1),
    [revenueByDay],
  );

  /* ── Recent orders (last 5) ── */
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  /* ── Low stock alerts ── */
  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock_count) <= 3),
    [products],
  );

  /* ── Top selling products ── */
  const topSelling = useMemo(() => {
    const map = {};
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        const title = o.product_title || o.item || 'Unknown';
        if (!map[title]) {
          map[title] = { title, count: 0, revenue: 0 };
        }
        map[title].count += 1;
        map[title].revenue += Number(o.total_amount || 0);
      });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  /* ── Chart bars to display (only non-zero or last 14 to keep it readable) ── */
  const chartBars = useMemo(() => {
    const withData = revenueByDay.filter((d) => d.amount > 0);
    if (withData.length === 0) return revenueByDay.slice(-7);
    return revenueByDay.slice(-14);
  }, [revenueByDay]);

  return (
    <section className="space-y-6">
      {/* ── Header + Quick Actions ── */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of revenue, orders, inventory, and product performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/stock"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <Boxes size={15} />
            Add Stock
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <ClipboardList size={15} />
            View Orders
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <Settings size={15} />
            Settings
          </Link>
          <button
            type="button"
            onClick={fetchAll}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="grid place-items-center py-20">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <RefreshCw size={16} className="animate-spin" />
            Loading dashboard…
          </span>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Metric Cards ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Total Revenue
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                    {formatMoney(totalRevenue)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Completed orders</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Pending Orders
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-amber-700">{pendingOrders}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Need attention</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <BarChart3 size={20} />
                </div>
              </div>
            </div>

            {/* Total Products */}
            <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Total Products
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-blue-700">{totalProducts}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">In catalogue</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Package size={20} />
                </div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Total Customers
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-purple-700">{totalCustomers}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Unique buyers</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-600">
                  <Users size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Revenue Chart + Low Stock ── */}
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            {/* Revenue Chart */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Revenue — Last 30 Days</h2>
                  <p className="text-xs text-slate-500">
                    Daily revenue from completed orders
                  </p>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <BarChart3 size={16} />
                </div>
              </div>

              {chartBars.every((d) => d.amount === 0) ? (
                <div className="grid min-h-48 place-items-center text-sm font-semibold text-slate-400">
                  No completed revenue in the last 30 days.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {chartBars.map((day) => (
                    <div key={day.date} className="group flex items-center gap-3">
                      <span className="w-14 shrink-0 text-right text-[11px] font-bold text-slate-500">
                        {formatShortDate(day.date)}
                      </span>
                      <div className="relative h-6 flex-1 overflow-hidden rounded bg-slate-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                          style={{
                            width: day.amount > 0 ? `${Math.max((day.amount / maxDayRevenue) * 100, 2)}%` : '0%',
                          }}
                        />
                        {day.amount > 0 && (
                          <span className="absolute inset-y-0 right-2 flex items-center text-[11px] font-bold text-slate-600">
                            {formatMoney(day.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Low Stock Alerts</h2>
                  <p className="text-xs text-slate-500">Products with 3 or fewer units</p>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-amber-50 text-amber-600">
                  <AlertTriangle size={16} />
                </div>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="grid min-h-48 place-items-center text-sm font-semibold text-slate-400">
                  All products are well stocked.
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {product.title}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-amber-700">
                          {Number(product.stock_count)} unit{Number(product.stock_count) !== 1 ? 's' : ''} left
                        </p>
                      </div>
                      <Link
                        to="/admin/ledger"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                      >
                        Edit
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Orders + Top Selling ── */}
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            {/* Recent Orders */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-admin">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Recent Orders</h2>
                  <p className="text-xs text-slate-500">Latest 5 incoming orders</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-extrabold">Customer</th>
                      <th className="px-3 py-2 font-extrabold">Item</th>
                      <th className="px-3 py-2 font-extrabold">Amount</th>
                      <th className="px-3 py-2 font-extrabold">Status</th>
                      <th className="px-3 py-2 font-extrabold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-3 py-8 text-center text-sm font-semibold text-slate-500"
                        >
                          No orders yet.
                        </td>
                      </tr>
                    )}
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                          {order.customer_name}
                        </td>
                        <td className="max-w-48 truncate px-3 py-2 text-slate-700">
                          {order.product_title || order.item || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                          {formatMoney(order.total_amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-extrabold ${
                              statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {(order.status || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">Top Selling Products</h2>
                  <p className="text-xs text-slate-500">Ranked by total revenue</p>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <TrendingUp size={16} />
                </div>
              </div>

              {topSelling.length === 0 ? (
                <div className="grid min-h-48 place-items-center text-sm font-semibold text-slate-400">
                  No sales data yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {topSelling.map((item, index) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-md bg-slate-50 p-3"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-800'
                            : index === 1
                              ? 'bg-slate-200 text-slate-700'
                              : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.count} order{item.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-emerald-700">
                        {formatMoney(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
