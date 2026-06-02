import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ImagePlus, LockKeyhole, ReceiptText, RefreshCw } from 'lucide-react';
import useSiteSettings from '../lib/useSiteSettings.js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const currencyFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

export default function Checkout() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { paymentOptions } = useSiteSettings();
  const [paymentMethodIndex, setPaymentMethodIndex] = useState(0);
  const [proofFile, setProofFile] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    quantity: '1',
    notes: '',
  });

  const selectedPayment = paymentOptions?.[paymentMethodIndex] || paymentOptions?.[0] || {};
  const proofPreview = useMemo(() => {
    if (!proofFile) return '';
    return URL.createObjectURL(proofFile);
  }, [proofFile]);
  const quantity = Math.max(Number(form.quantity) || 1, 1);
  const total = Number(product?.price || 0) * quantity;

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  useEffect(() => {
    async function loadSession() {
      if (!isSupabaseConfigured) {
        setAuthChecked(true);
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setAuthChecked(true);

      if (!currentSession) {
        navigate('/customer-login', {
          replace: true,
          state: {
            from: `/checkout/${productId}`,
            authMessage: 'Please sign in before checkout.',
          },
        });
        return;
      }

      const metadata = currentSession.user.user_metadata || {};
      setForm((current) => ({
        ...current,
        customer_name: metadata.full_name || '',
        customer_phone: metadata.phone || '',
      }));
    }

    loadSession();
  }, [navigate, productId]);

  useEffect(() => {
    async function fetchProduct() {
      if (!isSupabaseConfigured) {
        setError('Checkout will work after Supabase keys are added.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (productError) {
        setError(productError.message);
        setProduct(null);
      } else if (!data) {
        setError('This product is no longer available.');
        setProduct(null);
      } else {
        setProduct(data);
      }

      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!session?.user || !product) {
      setError('Please sign in and choose a valid product before placing an order.');
      return;
    }

    if (!proofFile) {
      setError('Upload a payment screenshot so staff can manually verify it.');
      return;
    }

    setSubmitting(true);

    const orderId = crypto.randomUUID();
    const extension = proofFile.name.split('.').pop()?.toLowerCase() || 'png';
    const proofPath = `${session.user.id}/${orderId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(proofPath, proofFile, {
        cacheControl: '3600',
        contentType: proofFile.type,
        upsert: false,
      });

    if (uploadError) {
      setSubmitting(false);
      setError(uploadError.message);
      return;
    }

    const { error: orderInsertError } = await supabase.from('orders').insert({
      id: orderId,
      customer_id: session.user.id,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: session.user.email,
      customer_address: form.customer_address.trim() || null,
      quantity,
      product_id: product.id,
      product_title: product.title,
      item: product.title,
      total_amount: total,
      payment_method: selectedPayment.label || 'Unknown',
      payment_proof_path: proofPath,
      notes: form.notes.trim() || null,
      status: 'pending',
    });

    setSubmitting(false);

    if (orderInsertError) {
      setError(orderInsertError.message);
      return;
    }

    setMessage('Order placed. Staff will manually check your payment proof and contact you.');
  }

  if (loading || !authChecked) {
    return (
      <section className="botanical-bg grid min-h-[72vh] place-items-center px-4 py-10">
        <div className="inline-flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-bold text-maroon-800 shadow-soft ring-1 ring-maroon-100">
          <RefreshCw size={18} className="animate-spin" />
          Loading checkout...
        </div>
      </section>
    );
  }

  return (
    <section className="botanical-bg min-h-[72vh] py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-maroon-800 hover:text-maroon-500"
        >
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-maroon-100 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-maroon-700 text-white">
                <LockKeyhole size={21} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                  Secure checkout
                </p>
                <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">
                  Pay by QR and upload proof
                </h1>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Scan the selected QR, complete payment, then attach the screenshot for staff
                  checking.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={17} />
                  {message}
                </span>
              </div>
            )}

            {product && (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {paymentOptions.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPaymentMethodIndex(idx)}
                      className={`rounded-lg border p-3 text-left transition ${
                        paymentMethodIndex === idx
                          ? 'border-maroon-700 bg-maroon-50'
                          : 'border-stone-200 bg-white hover:border-maroon-200'
                      }`}
                    >
                      <img
                        src={option.qrImageUrl || option.qrImage}
                        alt={`${option.label} payment QR`}
                        className="aspect-square w-full rounded-md border border-stone-100 object-cover"
                      />
                      <span className="mt-2 block text-sm font-extrabold text-maroon-900">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-stone-500">
                        {option.account}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-maroon-100 bg-cream/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                    Selected QR
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    <img
                      src={selectedPayment.qrImageUrl || selectedPayment.qrImage}
                      alt={`${selectedPayment.label} payment QR`}
                      className="aspect-square w-full max-w-[220px] rounded-md border border-maroon-100 bg-white object-cover"
                    />
                    <div>
                      <p className="font-serif text-2xl font-bold text-maroon-900">
                        {selectedPayment.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-600">
                        Amount: {currencyFormatter.format(total)}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">{selectedPayment.account}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-stone-700">Full name</span>
                    <input
                      required
                      value={form.customer_name}
                      onChange={(event) => updateField('customer_name', event.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-maroon-700"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-stone-700">Phone</span>
                    <input
                      required
                      value={form.customer_phone}
                      onChange={(event) => updateField('customer_phone', event.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-maroon-700"
                      placeholder="98XXXXXXXX"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-stone-700">Quantity</span>
                    <input
                      required
                      min="1"
                      max={product.stock_count || 99}
                      type="number"
                      value={form.quantity}
                      onChange={(event) => updateField('quantity', event.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-maroon-700"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-stone-700">Address</span>
                    <input
                      value={form.customer_address}
                      onChange={(event) => updateField('customer_address', event.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-maroon-700"
                      placeholder="Optional"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-bold text-stone-700">Payment screenshot</span>
                    <span className="mt-1 flex flex-col gap-3 rounded-md border border-dashed border-stone-300 bg-stone-50 px-3 py-4 sm:flex-row sm:items-center">
                      <ImagePlus size={21} className="shrink-0 text-stone-500" />
                      <input
                        required
                        type="file"
                        accept="image/*"
                        onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                        className="w-full text-sm"
                      />
                    </span>
                    {proofPreview && (
                      <img
                        src={proofPreview}
                        alt="Payment proof preview"
                        className="mt-3 max-h-56 rounded-md border border-stone-200 object-contain"
                      />
                    )}
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-bold text-stone-700">Notes</span>
                    <textarea
                      rows="3"
                      value={form.notes}
                      onChange={(event) => updateField('notes', event.target.value)}
                      className="mt-1 w-full resize-none rounded-md border border-stone-200 px-3 py-2 text-sm outline-none focus:border-maroon-700"
                      placeholder="Size, color preference, pickup timing, or delivery note"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || Boolean(message)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ReceiptText size={16} />
                  {submitting ? 'Placing order...' : 'Place order for manual review'}
                </button>
              </form>
            )}
          </div>

          <aside className="h-fit rounded-lg bg-white p-5 shadow-soft ring-1 ring-maroon-100">
            {product ? (
              <>
                <img
                  src={product.image_url || product.image_urls?.[0]}
                  alt={product.title}
                  className="aspect-[4/5] w-full rounded-lg bg-maroon-50 object-cover"
                />
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                  Order summary
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-maroon-900">
                  {product.title}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-stone-700">
                  <p className="flex justify-between gap-3">
                    <span>Price</span>
                    <span className="font-bold">{currencyFormatter.format(product.price)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Quantity</span>
                    <span className="font-bold">{quantity}</span>
                  </p>
                  <p className="flex justify-between gap-3 border-t border-stone-100 pt-2 text-base">
                    <span className="font-extrabold">Total</span>
                    <span className="font-extrabold text-maroon-800">
                      {currencyFormatter.format(total)}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm font-semibold text-stone-600">No product selected.</p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
