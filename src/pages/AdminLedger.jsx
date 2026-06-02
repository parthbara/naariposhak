import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Trash2, Edit, X, Save, ImagePlus } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    } else {
      setProducts(data || []);
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

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Remove ${product.title} from stock ledger?`);
    if (!confirmed) return;

    setError('');
    setMessage('');

    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setMessage(`${product.title} removed.`);
  }

  // --- Edit Modal Functions ---

  function openEditModal(product) {
    setEditingProduct(product);
    // Convert old single image_url to image_urls array if needed
    const images = Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : (product.image_url ? [product.image_url] : []);

    setForm({
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      stock_count: product.stock_count,
      ai_extra_info: product.ai_extra_info || '',
      image_urls: images
    });
  }

  function closeEditModal() {
    setEditingProduct(null);
    setForm(null);
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function removePhoto(index) {
    if (!window.confirm("Remove this photo?")) return;
    const newImages = [...form.image_urls];
    newImages.splice(index, 1);
    updateForm('image_urls', newImages);
  }

  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);
    
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: false });

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    updateForm('image_urls', [...form.image_urls, urlData.publicUrl]);
    setUploading(false);
  }

  async function saveProductEdit(e) {
    e.preventDefault();
    setSaving(true);
    
    const updateData = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      stock_count: Number(form.stock_count),
      ai_extra_info: form.ai_extra_info,
      image_urls: form.image_urls,
      // Update legacy image_url to the first image if available
      image_url: form.image_urls.length > 0 ? form.image_urls[0] : null
    };

    const { data, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', editingProduct.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      alert(`Save failed: ${updateError.message}`);
      return;
    }

    setProducts(current => current.map(item => item.id === editingProduct.id ? data : item));
    setMessage(`${data.title} updated successfully.`);
    closeEditModal();
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Stock Ledger</h1>
          <p className="text-sm text-slate-500">
            Review all inventory, update details, and manage product photos.
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
                          className="h-12 w-10 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
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
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      {formatMoney(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      {product.stock_count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                      {formatMoney(Number(product.price || 0) * Number(product.stock_count || 0))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Edit size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
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

      {/* Slide-over Edit Modal */}
      {editingProduct && form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="slide-in flex h-full w-full max-w-md flex-col bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">Edit Product</h2>
                <p className="text-xs text-slate-500">Update details and photos for {form.title}</p>
              </div>
              <button 
                onClick={closeEditModal}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={saveProductEdit} className="flex-1 p-5 space-y-5">
              
              {/* Photo Management */}
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">
                  Photos
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {form.image_urls.map((url, i) => (
                    <div key={i} className="relative group aspect-[4/5] rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(i)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100 transition">
                    {uploading ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <>
                        <ImagePlus size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => uploadPhoto(e.target.files[0])}
                        />
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Text Fields */}
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Price (NPR)</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Stock Count</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_count}
                    onChange={(e) => updateForm('stock_count', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Category</span>
                <select
                  required
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-slate-900"
                >
                  <option value="kurta">Kurta</option>
                  <option value="saree">Saree</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Description</span>
                <textarea
                  required
                  rows="3"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">AI Context Note</span>
                <textarea
                  rows="2"
                  value={form.ai_extra_info}
                  onChange={(e) => updateForm('ai_extra_info', e.target.value)}
                  placeholder="Secret context for the AI Chatbot (e.g. popular for weddings, comes with extra thread)"
                  className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">Hidden from customers, read by the AI assistant.</p>
              </label>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white py-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
