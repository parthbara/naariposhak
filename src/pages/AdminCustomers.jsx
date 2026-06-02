import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Phone, RefreshCw, Search, ShoppingBag, Users } from 'lucide-react';
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

function aggregateCustomers(orders) {
  const map = new Map();

  for (const order of orders) {
    const key = order.customer_email || order.customer_id || order.customer_phone || order.customer_name || 'unknown';

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: order.customer_name || '-',
        phone: order.customer_phone || '-',
        email: order.customer_email || '-',
        total_orders: 0,
        total_spent: 0,
        last_order_date: order.created_at,
        orders: [],
      });
    }

    const customer = map.get(key);
    customer.total_orders += 1;
    customer.total_spent += Number(order.total_amount || 0);

    if (order.created_at && (!customer.last_order_date || new Date(order.created_at) > new Date(customer.last_order_date))) {
      customer.last_order_date = order.created_at;
    }

    if (!customer.name || customer.name === '-') {
      customer.name = order.customer_name || '-';
    }
    if (!customer.phone || customer.phone === '-') {
      customer.phone = order.customer_phone || '-';
    }
    if (!customer.email || customer.email === '-') {
      customer.email = order.customer_email || '-';
    }

    customer.orders.push(order);
  }

  return Array.from(map.values()).sort((a, b) => new Date(b.last_order_date) - new Date(a.last_order_date));
}

function exportCSV(customers) {
  const header = 'Name,Phone,Email,Total Orders,Total Spent,Last Order Date';
  const rows = customers.map((c) => {
    const name = `"${(c.name || '').replace(/"/g, '""')}"`;
    const phone = `"${(c.phone || '').replace(/"/g, '""')}"`;
    const email = `"${(c.email || '').replace(/"/g, '""')}"`;
    const totalOrders = c.total_orders;
    const totalSpent = c.total_spent;
    const lastDate = c.last_order_date ? formatDate(c.last_order_date) : '-';
    return `${name},${phone},${email},${totalOrders},${totalSpent},${lastDate}`;
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminCustomers() {
  const [orders, setOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function fetchOrders() {
    setLoading(true);
    setError('');

    const { data, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orderError) {
      setError(orderError.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const customers = useMemo(() => aggregateCustomers(orders), [orders]);

  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return customers;
    const lowerQuery = query.toLowerCase();
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(lowerQuery);
    });
  }, [customers, query]);

  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgOrderValue = orders.length > 0
      ? orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) / orders.length
      : 0;
    return { totalCustomers, totalRevenue, avgOrderValue };
  }, [customers, orders]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Customers</h1>
          <p className="text-sm text-slate-500">
            View customer profiles, order history, and spending patterns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportCSV(filteredCustomers)}
            disabled={filteredCustomers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Total Customers</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-950">{metrics.totalCustomers}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{formatMoney(metrics.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Avg Order Value</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-700">{formatMoney(metrics.avgOrderValue)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-sm outline-none"
            placeholder="Search by name, phone, or email"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-admin">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-extrabold">Customer</th>
                  <th className="px-3 py-2 font-extrabold">Phone</th>
                  <th className="px-3 py-2 font-extrabold">Email</th>
                  <th className="px-3 py-2 font-extrabold">Orders</th>
                  <th className="px-3 py-2 font-extrabold">Total Spent</th>
                  <th className="px-3 py-2 font-extrabold">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Loading customers...
                      </span>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-red-700">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                      No customers found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.key}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedCustomer?.key === customer.key ? 'bg-slate-50' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                        {customer.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {customer.phone}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {customer.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-center font-semibold text-slate-900">
                        {customer.total_orders}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                        {formatMoney(customer.total_spent)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {formatDate(customer.last_order_date)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">
                  {selectedCustomer.name}
                </h2>
                <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                  <p className="inline-flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    {selectedCustomer.email}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Total Orders</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-950">{selectedCustomer.total_orders}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Total Spent</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatMoney(selectedCustomer.total_spent)}</p>
                </div>
              </div>

              <div>
                <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  <ShoppingBag size={14} />
                  Order History
                </p>
                <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto">
                  {selectedCustomer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-md border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {order.product_title || order.item || 'Order'}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                            statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {(order.status || 'pending').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold">{formatMoney(order.total_amount)}</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center text-center text-sm font-semibold text-slate-500">
              <div className="space-y-2">
                <Users size={32} className="mx-auto text-slate-300" />
                <p>Select a customer to view their details and order history.</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
