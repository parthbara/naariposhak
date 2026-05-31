import { useState } from 'react';
import { ImagePlus, PackagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const initialForm = {
  title: '',
  category: 'kurta',
  price: '',
  description: '',
  stock_count: '',
  ai_extra_info: '',
};

export default function AdminStock() {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!photos.length) {
      setError('Please choose at least one product photo.');
      return;
    }

    setLoading(true);

    const uploadedUrls = [];

    for (const photo of photos) {
      const fileExtension = photo.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${form.category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    const { error: insertError } = await supabase.from('products').insert({
      title: form.title.trim(),
      category: form.category,
      price: Number(form.price),
      description: form.description.trim(),
      stock_count: Number(form.stock_count),
      image_url: uploadedUrls[0],
      image_urls: uploadedUrls,
      ai_extra_info: form.ai_extra_info.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm(initialForm);
    setPhotos([]);
    event.target.reset();
    setMessage('Stock item added successfully.');
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-slate-200 bg-white shadow-admin">
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Add Stock</h1>
          <p className="text-sm text-slate-500">Create inventory with a product image upload.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Title
            </span>
            <input
              required
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="Embroidered maroon kurta"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Category
            </span>
            <select
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="kurta">Kurta</option>
              <option value="saree">Saree</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Price
            </span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="4200"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Stock Count
            </span>
            <input
              required
              min="0"
              step="1"
              type="number"
              value={form.stock_count}
              onChange={(event) => updateField('stock_count', event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="8"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Description
            </span>
            <textarea
              required
              rows="4"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="Fabric, fit, occasion, color, and garment details."
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              AI Extra Info (Optional)
            </span>
            <textarea
              rows="3"
              value={form.ai_extra_info}
              onChange={(event) => updateField('ai_extra_info', event.target.value)}
              className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="Hidden from users. Provide extra details for the AI assistant (e.g. 'Can be customized if they wait 2 weeks', 'Hand wash only, colors bleed')."
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Photo Carousel Upload
            </span>
            <span className="mt-1 flex flex-col gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 sm:flex-row sm:items-center">
              <ImagePlus size={21} className="shrink-0 text-slate-500" />
              <input
                required
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setPhotos(Array.from(event.target.files || []))}
                className="w-full text-sm"
              />
            </span>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photos.map((photo) => (
                  <div key={`${photo.name}-${photo.lastModified}`} className="rounded-md bg-slate-100 p-2">
                    <p className="truncate text-xs font-semibold text-slate-600">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 sm:col-span-2">
              {message}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PackagePlus size={17} />
              {loading ? 'Uploading...' : 'Add stock item'}
            </button>
          </div>
        </form>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-600">
          Upload rules
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          <li>Upload one or more images to create a product carousel.</li>
          <li>The first selected image becomes the cover image.</li>
          <li>Images are stored in the public product-images bucket.</li>
          <li>Rows are inserted into products after upload succeeds.</li>
          <li>Only emails listed in admin_users can add stock.</li>
        </ul>
      </aside>
    </section>
  );
}
