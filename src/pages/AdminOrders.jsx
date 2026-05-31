import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ImageIcon, Phone, RefreshCw, Search, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const statuses = ['pending', 'called', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'];

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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [proofUrls, setProofUrls] = useState({});

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = [
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.product_title,
        order.item,
        order.status,
        order.payment_method,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open'
          ? !['completed', 'cancelled'].includes(order.status)
          : order.status === statusFilter);
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const metrics = useMemo(() => {
    const open = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
    const ready = orders.filter((order) => order.status === 'ready').length;
    const completed = orders.filter((order) => order.status === 'completed').length;
    return { open, ready, completed };
  }, [orders]);

  async function updateStatus(order, status) {
    setSavingId(order.id);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);
    setSavingId('');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    );
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current));
  }

  useEffect(() => {
    let active = true;

    async function loadProofPreview() {
      if (!selectedOrder?.payment_proof_path || proofUrls[selectedOrder.id]) return;

      const { data, error: signedUrlError } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(selectedOrder.payment_proof_path, 60 * 10);

      if (!active || signedUrlError || !data?.signedUrl) return;

      setProofUrls((current) => ({
        ...current,
        [selectedOrder.id]: data.signedUrl,
      }));
    }

    loadProofPreview();

    return () => {
      active = false;
    };
  }, [proofUrls, selectedOrder]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Order Tickets</h1>
          <p className="text-sm text-slate-500">
            Call customers, confirm details, and move orders through completion.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Open</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-950">{metrics.open}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Ready</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{metrics.ready}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-700">{metrics.completed}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-admin md:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-sm outline-none"
            placeholder="Search name, phone, item, or status"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none"
        >
          <option value="open">Open tickets</option>
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-admin">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-extrabold">Ticket</th>
                  <th className="px-3 py-2 font-extrabold">Customer</th>
                  <th className="px-3 py-2 font-extrabold">Contact</th>
                  <th className="px-3 py-2 font-extrabold">Item</th>
                  <th className="px-3 py-2 font-extrabold">Status</th>
                  <th className="px-3 py-2 font-extrabold">Date</th>
                  <th className="px-3 py-2 text-right font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Loading orders...
                      </span>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm font-semibold text-red-700">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                      No matching order tickets.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                        {order.customer_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {order.customer_phone || '-'}
                      </td>
                      <td className="min-w-52 px-3 py-2 text-slate-700">
                        <div className="font-semibold">{order.product_title || order.item}</div>
                        <div className="text-xs text-slate-500">
                          Qty {order.quantity || 1} / {formatMoney(order.total_amount)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-extrabold ${
                            statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-slate-500">
                    #{selectedOrder.id.slice(0, 8)}
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-950">
                    {selectedOrder.customer_name}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-extrabold ${
                    statusClasses[selectedOrder.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-bold">{selectedOrder.product_title || selectedOrder.item}</p>
                <p>Quantity: {selectedOrder.quantity || 1}</p>
                <p>Total: {formatMoney(selectedOrder.total_amount)}</p>
                <p>Phone: {selectedOrder.customer_phone || '-'}</p>
                <p>Email: {selectedOrder.customer_email || '-'}</p>
                <p>Address: {selectedOrder.customer_address || '-'}</p>
                <p>Payment: {selectedOrder.payment_method || '-'}</p>
                <p>Notes: {selectedOrder.notes || '-'}</p>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  <ImageIcon size={14} />
                  Payment proof
                </p>
                {selectedOrder.payment_proof_path ? (
                  proofUrls[selectedOrder.id] ? (
                    <a
                      href={proofUrls[selectedOrder.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block"
                    >
                      <img
                        src={proofUrls[selectedOrder.id]}
                        alt="Customer payment screenshot"
                        className="max-h-72 w-full rounded-md border border-slate-200 object-contain"
                      />
                    </a>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Loading payment screenshot...
                    </p>
                  )
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No payment screenshot attached.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder, 'called')}
                  disabled={savingId === selectedOrder.id}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  <Phone size={14} />
                  Called
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder, 'confirmed')}
                  disabled={savingId === selectedOrder.id}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-extrabold text-cyan-800 hover:bg-cyan-100"
                >
                  <Clock3 size={14} />
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder, 'completed')}
                  disabled={savingId === selectedOrder.id}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100"
                >
                  <CheckCircle2 size={14} />
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder, 'cancelled')}
                  disabled={savingId === selectedOrder.id}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-800 hover:bg-red-100"
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              </div>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Move status
                </span>
                <select
                  value={selectedOrder.status}
                  onChange={(event) => updateStatus(selectedOrder, event.target.value)}
                  disabled={savingId === selectedOrder.id}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center text-center text-sm font-semibold text-slate-500">
              Select a ticket to call, confirm, complete, or cancel it.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
