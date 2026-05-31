import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { fallbackProducts } from '../data/fallbackProducts.js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const currencyFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      if (!isSupabaseConfigured) {
        const fallbackProd = fallbackProducts.find((p) => p.id === productId);
        if (fallbackProd) {
          setProduct(fallbackProd);
        } else {
          setError('This product is no longer available.');
        }
        setLoading(false);
        return;
      }

      const isFallback = String(productId).startsWith('fallback-');
      if (isFallback) {
        const fallbackProd = fallbackProducts.find((p) => p.id === productId);
        if (fallbackProd) {
          setProduct(fallbackProd);
        } else {
          setError('This product is no longer available.');
        }
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
      } else if (!data) {
        setError('This product is no longer available.');
      } else {
        setProduct(data);
      }

      setLoading(false);
    }

    fetchProduct();
  }, [productId]);

  const images = useMemo(() => {
    if (!product) return [];
    const carouselImages = Array.isArray(product.image_urls) ? product.image_urls : [];
    const merged = [...carouselImages, product.image_url].filter(Boolean);
    return [...new Set(merged)];
  }, [product]);

  const hasCarousel = images.length > 1;

  function moveImage(direction) {
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  if (loading) {
    return (
      <section className="botanical-bg grid min-h-[72vh] place-items-center px-4 py-10">
        <div className="inline-flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-bold text-maroon-800 shadow-soft ring-1 ring-maroon-100">
          <Sparkles size={18} className="animate-pulse" />
          Loading product...
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="botanical-bg min-h-[72vh] px-4 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-bold text-maroon-900">Oops!</h2>
          <p className="mt-4 text-stone-600">{error || 'Product not found.'}</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-maroon-700 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-maroon-800"
          >
            <ArrowLeft size={16} />
            Back to shop
          </Link>
        </div>
      </section>
    );
  }

  const outOfStock = Number(product.stock_count) <= 0;

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

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-maroon-100 sm:p-6 lg:p-8">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-maroon-50">
                {images.length ? (
                  <img
                    src={images[activeImage]}
                    alt={product.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-maroon-100 to-cream text-maroon-700">
                    <PackageCheck size={64} />
                  </div>
                )}
                
                {hasCarousel && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveImage(-1)}
                      className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-maroon-800 shadow-soft backdrop-blur transition hover:bg-white"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(1)}
                      className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-maroon-800 shadow-soft backdrop-blur transition hover:bg-white"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              
              {hasCarousel && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, idx) => (
                    <button
                      key={image}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md border-2 transition ${
                        activeImage === idx ? 'border-maroon-700' : 'border-transparent hover:border-maroon-300'
                      }`}
                    >
                      <img src={image} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                {product.category}
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl lg:text-5xl">
                {product.title}
              </h1>
              
              <div className="mt-4 flex items-center justify-between border-b border-stone-200 pb-4">
                <span className="text-2xl font-bold text-ink sm:text-3xl">
                  {currencyFormatter.format(Number(product.price || 0))}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${outOfStock ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {outOfStock ? 'Out of stock' : <><CheckCircle2 size={16} /> {product.stock_count} in stock</>}
                </span>
              </div>

              <div className="prose prose-stone mt-6 max-w-none text-stone-600">
                <p className="leading-relaxed">{product.description}</p>
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-xl border border-maroon-100 bg-cream/50 p-5">
                  <h3 className="font-bold text-maroon-900">Ordering Process</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    To maintain our high standard of service, all orders are reviewed personally. Click checkout below to reserve this item, scan the payment QR, and upload your proof of payment. Our staff will contact you shortly to confirm the details.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => navigate(`/checkout/${product.id}`)}
                  disabled={outOfStock}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-700 px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-maroon-800 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50"
                >
                  <ShoppingBag size={20} />
                  {outOfStock ? 'Sold Out' : 'Checkout & Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
