import { useEffect, useState } from 'react';
import {
  Bot,
  CreditCard,
  Globe,
  Megaphone,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  LayoutDashboard,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const TABS = [
  { key: 'payment', label: 'Payment Methods', icon: CreditCard },
  { key: 'contact', label: 'Contact & Social', icon: Phone },
  { key: 'announcement', label: 'Announcement', icon: Megaphone },
  { key: 'landing', label: 'Landing Page', icon: LayoutDashboard },
  { key: 'identity', label: 'Site Identity', icon: Globe },
  { key: 'ai', label: 'AI Assistant', icon: Bot },
];

const ANNOUNCEMENT_COLORS = [
  { label: 'Maroon', value: '#8A1C2A' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Slate', value: '#475569' },
];

const AI_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
];

async function fetchSetting(key) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

async function saveSetting(key, value) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('payment');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Contact & Social
  const [contact, setContact] = useState({
    shopName: 'Nari Poshak',
    phone: '+977-9709611771',
    whatsapp: '9779709611771',
    address: 'Boudha, Kathmandu, Nepal',
    instagram: 'nari_poshak2022',
    facebook: 'nari_poshak2022',
    pan: '620357353',
    category: 'Ethnic and casual wears',
    delivery: 'Delivery all over Nepal',
  });

  // Announcement
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    text: '',
    color: '#8A1C2A',
  });

  // Site Identity
  const [siteMeta, setSiteMeta] = useState({
    title: 'Nari Poshak | Kurtas, Sarees & Tailoring',
    description: "Elegant women's wear — kurtas, sarees, and complete styling from Boudha, Kathmandu.",
  });

  // AI Assistant
  const [aiConfig, setAiConfig] = useState({
    enabled: false,
    model: 'llama-3.3-70b-versatile',
  });

  // Landing Page
  const [landingPage, setLandingPage] = useState({
    heroSubtitle: "Kurtas, sarees & complete women's wear",
    heroTitle: "Nari Poshak",
    heroDescription: "Sophisticated women's wear with elegant cuts, thoughtful fabric selection, and ready garments for everyday confidence and special moments.",
    heroImages: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1610189012035-7e3fcbdaeb1a?auto=format&fit=crop&w=900&q=85"
    ],
    rudrakshyaAdEnabled: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        if (activeTab === 'payment') {
          const val = await fetchSetting('payment_options');
          if (active) setPaymentMethods(Array.isArray(val) ? val : []);
        } else if (activeTab === 'contact') {
          const val = await fetchSetting('contact_info');
          if (active && val) setContact((prev) => ({ ...prev, ...val }));
        } else if (activeTab === 'announcement') {
          const val = await fetchSetting('announcement');
          if (active && val) setAnnouncement((prev) => ({ ...prev, ...val }));
        } else if (activeTab === 'identity') {
          const val = await fetchSetting('site_meta');
          if (active && val) setSiteMeta((prev) => ({ ...prev, ...val }));
        } else if (activeTab === 'ai') {
          const val = await fetchSetting('ai_config');
          if (active && val) setAiConfig((prev) => ({ ...prev, ...val }));
        } else if (activeTab === 'landing') {
          const val = await fetchSetting('landing_page');
          if (active && val) setLandingPage((prev) => ({ ...prev, ...val }));
        }
      } catch (err) {
        if (active) setError(err.message);
      }

      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeTab]);

  function flash(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  // ─── Payment Methods ───

  function updatePayment(index, field, value) {
    setPaymentMethods((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function addPaymentMethod() {
    setPaymentMethods((prev) => [...prev, { label: '', account: '', qrImageUrl: '' }]);
  }

  function removePaymentMethod(index) {
    if (!window.confirm('Remove this payment method?')) return;
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadQr(index, file) {
    if (!file) return;

    const ext = file.name.split('.').pop();
    const path = `qr/${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
    updatePayment(index, 'qrImageUrl', urlData.publicUrl);
  }

  async function savePaymentMethods() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('payment_options', paymentMethods);
      flash('Payment methods saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── Contact ───

  function updateContact(field, value) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }

  async function saveContact() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('contact_info', contact);
      flash('Contact info saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── Announcement ───

  function updateAnnouncement(field, value) {
    setAnnouncement((prev) => ({ ...prev, [field]: value }));
  }

  async function saveAnnouncement() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('announcement', announcement);
      flash('Announcement saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── Site Identity ───

  function updateSiteMeta(field, value) {
    setSiteMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function saveSiteMeta() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('site_meta', siteMeta);
      flash('Site identity saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── AI Assistant ───

  function updateAiConfig(field, value) {
    setAiConfig((prev) => ({ ...prev, [field]: value }));
  }

  async function saveAiConfig() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('ai_config', aiConfig);
      flash('AI assistant settings saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── Landing Page ───

  function updateLandingPage(field, value) {
    setLandingPage((prev) => ({ ...prev, [field]: value }));
  }

  function removeHeroImage(index) {
    if (!window.confirm('Remove this hero image?')) return;
    setLandingPage((prev) => ({
      ...prev,
      heroImages: prev.heroImages.filter((_, i) => i !== index),
    }));
  }

  async function uploadHeroImage(file) {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `hero/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
    setLandingPage((prev) => ({
      ...prev,
      heroImages: [...prev.heroImages, urlData.publicUrl],
    }));
  }

  async function saveLandingPage() {
    setSaving(true);
    setError('');
    try {
      await saveSetting('landing_page', landingPage);
      flash('Landing page settings saved.');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  // ─── Render helpers ───

  function renderPaymentTab() {
    return (
      <div className="space-y-4">
        {paymentMethods.map((method, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-admin"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Method {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removePaymentMethod(index)}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Label
                </span>
                <input
                  type="text"
                  value={method.label}
                  onChange={(e) => updatePayment(index, 'label', e.target.value)}
                  placeholder="e.g. eSewa, Khalti, Bank Transfer"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </label>
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Account
                </span>
                <input
                  type="text"
                  value={method.account}
                  onChange={(e) => updatePayment(index, 'account', e.target.value)}
                  placeholder="Account number or ID"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </label>
            </div>

            <div className="mt-3">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                QR Code Image
              </span>
              <div className="mt-1 flex items-center gap-4">
                {method.qrImageUrl && (
                  <img
                    src={method.qrImageUrl}
                    alt={`QR for ${method.label}`}
                    className="h-24 w-24 rounded-md border border-slate-200 object-contain"
                  />
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                  <Upload size={14} />
                  Upload QR
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadQr(index, e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPaymentMethod}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <Plus size={16} />
          Add payment method
        </button>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={savePaymentMethods}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Payment Methods'}
          </button>
        </div>
      </div>
    );
  }

  function renderContactTab() {
    const fields = [
      { key: 'shopName', label: 'Shop Name', placeholder: 'Naari Poshak' },
      { key: 'phone', label: 'Phone', placeholder: '+977 …' },
      { key: 'whatsapp', label: 'WhatsApp', placeholder: '+977 …' },
      { key: 'address', label: 'Address', placeholder: 'Street, City' },
      { key: 'instagram', label: 'Instagram', placeholder: '@handle or URL' },
      { key: 'facebook', label: 'Facebook', placeholder: 'Page URL' },
      { key: 'pan', label: 'PAN Number', placeholder: 'PAN' },
      { key: 'category', label: 'Business Category', placeholder: 'e.g. Clothing & Fashion' },
      { key: 'delivery', label: 'Delivery Info', placeholder: 'e.g. Free delivery in Kathmandu' },
    ];

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          Contact & Social Links
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                {f.label}
              </span>
              <input
                type="text"
                value={contact[f.key] || ''}
                onChange={(e) => updateContact(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={saveContact}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Contact Info'}
          </button>
        </div>
      </div>
    );
  }

  function renderAnnouncementTab() {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Announcement Banner
          </p>

          <div className="mt-4 flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={announcement.enabled}
                onChange={(e) => updateAnnouncement('enabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-slate-900 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-bold text-slate-700">
              {announcement.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <label className="mt-4 block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Banner Message
            </span>
            <input
              type="text"
              value={announcement.text}
              onChange={(e) => updateAnnouncement('text', e.target.value)}
              placeholder="e.g. Free delivery on orders above Rs 2000!"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </label>

          <div className="mt-4">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Color Preset
            </span>
            <div className="mt-2 flex gap-2">
              {ANNOUNCEMENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateAnnouncement('color', c.value)}
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold transition-all ${
                    announcement.color === c.value
                      ? 'border-slate-900 ring-2 ring-slate-900/20'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.value }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Live Preview
          </p>
          <div className="mt-3 overflow-hidden rounded-md">
            {announcement.enabled && announcement.text ? (
              <div
                className="px-4 py-2.5 text-center text-sm font-bold text-white"
                style={{ backgroundColor: announcement.color }}
              >
                {announcement.text}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                {announcement.enabled
                  ? 'Type a message above to preview the banner.'
                  : 'Banner is currently disabled.'}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveAnnouncement}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Announcement'}
          </button>
        </div>
      </div>
    );
  }

  function renderIdentityTab() {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          Site Identity
        </p>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Site Title
            </span>
            <input
              type="text"
              value={siteMeta.title}
              onChange={(e) => updateSiteMeta('title', e.target.value)}
              placeholder="Naari Poshak"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Site Description
            </span>
            <textarea
              value={siteMeta.description}
              onChange={(e) => updateSiteMeta('description', e.target.value)}
              rows={3}
              placeholder="A short description of your site for search engines and social media."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={saveSiteMeta}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Site Identity'}
          </button>
        </div>
      </div>
    );
  }

  function renderAiTab() {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          AI Assistant Configuration
        </p>

        <div className="mt-4 flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={aiConfig.enabled}
              onChange={(e) => updateAiConfig('enabled', e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-slate-900 peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm font-bold text-slate-700">
            {aiConfig.enabled ? 'AI Assistant Enabled' : 'AI Assistant Disabled'}
          </span>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Model
          </span>
          <select
            value={aiConfig.model}
            onChange={(e) => updateAiConfig('model', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-slate-900"
          >
            {AI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <p className="font-bold text-slate-700">About these models</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-500">
            <li>
              <span className="font-bold text-slate-700">Llama 3.3 70B</span> — High-quality reasoning and comprehensive language support.
            </li>
            <li>
              <span className="font-bold text-slate-700">Mixtral 8x7B</span> — Fast and efficient MoE model, great for quick interactions.
            </li>
            <li>
              <span className="font-bold text-slate-700">Gemma 2 9B</span> — Lightweight model for basic queries.
            </li>
          </ul>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={saveAiConfig}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save AI Settings'}
          </button>
        </div>
      </div>
    );
  }

  function renderLandingTab() {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Hero Text
          </p>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Subtitle</span>
              <input
                type="text"
                value={landingPage.heroSubtitle || ''}
                onChange={(e) => updateLandingPage('heroSubtitle', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Title</span>
              <input
                type="text"
                value={landingPage.heroTitle || ''}
                onChange={(e) => updateLandingPage('heroTitle', e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Description</span>
              <textarea
                value={landingPage.heroDescription || ''}
                onChange={(e) => updateLandingPage('heroDescription', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Hero Image Carousel
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {landingPage.heroImages?.map((imgUrl, index) => (
              <div key={index} className="relative aspect-[3/4] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {imgUrl ? (
                  <img src={imgUrl} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">Empty</div>
                )}
                <button
                  type="button"
                  onClick={() => removeHeroImage(index)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-700 shadow hover:bg-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:bg-slate-100">
              <Upload size={20} />
              <span className="text-xs font-bold">Upload Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadHeroImage(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-admin">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Arun Rudrakshya Advertisement
          </p>
          <div className="mt-4 flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={landingPage.rudrakshyaAdEnabled ?? true}
                onChange={(e) => updateLandingPage('rudrakshyaAdEnabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-slate-900 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-bold text-slate-700">
              {(landingPage.rudrakshyaAdEnabled ?? true) ? 'Advertisement Visible' : 'Advertisement Hidden'}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveLandingPage}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Landing Page'}
          </button>
        </div>
      </div>
    );
  }

  const tabContent = {
    payment: renderPaymentTab,
    contact: renderContactTab,
    announcement: renderAnnouncementTab,
    identity: renderIdentityTab,
    landing: renderLandingTab,
    ai: renderAiTab,
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Settings</h1>
        <p className="text-sm text-slate-500">
          Manage payment methods, contact info, announcements, and site configuration.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setError('');
                setMessage('');
              }}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feedback messages */}
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

      {/* Tab content */}
      {loading ? (
        <div className="grid min-h-48 place-items-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <RefreshCw size={16} className="animate-spin" />
            Loading settings...
          </span>
        </div>
      ) : (
        tabContent[activeTab]()
      )}
    </section>
  );
}
