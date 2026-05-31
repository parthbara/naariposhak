import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

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

export default function AdminLedger() {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function fetchProducts() {
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: productError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productError) {
      setError(productError.message);
      setProducts([]);
      setDrafts({});
    } else {
      const nextProducts = data || [];
      setProducts(nextProducts);
      setDrafts(
        Object.fromEntries(
          nextProducts.map((product) => [
            product.id,
            {
              price: product.price,
              stock_count: product.stock_count,
            },
          ]),
        ),
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesQuery = [product.title, product.category, product.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const totals = useMemo(() => {
    const units = products.reduce((sum, product) => sum + Number(product.stock_count || 0), 0);
    const value = products.reduce(
      (sum, product) => sum + Number(product.stock_count || 0) * Number(product.price || 0),
      0,
    );
    return { units, value };
  }, [products]);

  function updateDraft(id, field, value) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function saveProduct(product) {
    setSavingId(product.id);
    setError('');
    setMessage('');

    const draft = drafts[product.id];
    const { error: updateError } = await supabase
      .from('products')
      .update({
        price: Number(draft.price),
        stock_count: Number(draft.stock_count),
      })
      .eq('id', product.id);

    setSavingId('');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              price: Number(draft.price),
              stock_count: Number(draft.stock_count),
            }
          : item,
      ),
    );
    setMessage(`${product.title} updated.`);
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Remove ${product.title} from stock ledger?`);
    if (!confirmed) return;

    setSavingId(product.id);
    setError('');
    setMessage('');

    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);

    setSavingId('');

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setMessage(`${product.title} removed.`);
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Stock Ledger</h1>
          <p className="text-sm text-slate-500">
            Review all inventory, update prices, adjust counts, and retire old stock.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Products</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-950">{products.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Units</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-700">{totals.units}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Stock Value</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">
            {formatMoney(totals.value)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-admin md:grid-cols-[1fr_180px]">
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-transparent text-sm outline-none"
            placeholder="Search stock ledger"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none"
        >
          <option value="all">All categories</option>
          <option value="kurta">Kurta</option>
          <option value="saree">Saree</option>
        </select>
      </div>

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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-admin">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2 font-extrabold">Product</th>
                <th className="px-3 py-2 font-extrabold">Category</th>
                <th className="px-3 py-2 font-extrabold">Price</th>
                <th className="px-3 py-2 font-extrabold">Stock</th>
                <th className="px-3 py-2 font-extrabold">Value</th>
                <th className="px-3 py-2 font-extrabold">Created</th>
                <th className="px-3 py-2 text-right font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Loading stock...
                    </span>
                  </td>
                </tr>
              )}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    No stock found.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="min-w-72 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            Array.isArray(product.image_urls) && product.image_urls.length
                              ? product.image_urls[0]
                              : product.image_url
                          }
                          alt={product.title}
                          className="h-12 w-10 rounded-md object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-950">{product.title}</p>
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {product.description}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                            {Array.isArray(product.image_urls) && product.image_urls.length
                              ? `${product.image_urls.length} photos`
                              : '1 photo'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-extrabold uppercase text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={drafts[product.id]?.price ?? ''}
                        onChange={(event) => updateDraft(product.id, 'price', event.target.value)}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={drafts[product.id]?.stock_count ?? ''}
                        onChange={(event) =>
                          updateDraft(product.id, 'stock_count', event.target.value)
                        }
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-slate-900"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      {formatMoney(
                        Number(drafts[product.id]?.price || 0) *
                          Number(drafts[product.id]?.stock_count || 0),
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveProduct(product)}
                          disabled={savingId === product.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Save size={13} />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          disabled={savingId === product.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
