import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, RefreshCw } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import { fallbackProducts } from '../data/fallbackProducts.js';
import { contactInfo } from '../data/contactInfo.js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Kurtas', value: 'kurta' },
  { label: 'Sarees', value: 'saree' },
];

export default function Shop() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      if (!isSupabaseConfigured) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

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

    fetchProducts();
  }, []);

  const usingFallback = !products.length;
  const visibleProducts = useMemo(() => {
    const source = usingFallback ? fallbackProducts : products;
    if (category === 'all') return source;
    return source.filter((product) => product.category === category);
  }, [category, products, usingFallback]);

  function openCheckout(product) {
    navigate(`/checkout/${product.id}`);
  }

  return (
    <section className="botanical-bg min-h-[70vh] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 rounded-lg bg-white/78 p-4 shadow-soft ring-1 ring-maroon-100 sm:p-5 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700 sm:text-sm sm:tracking-[0.2em]">
              Current stock
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
              Shop kurtas and sarees
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Browse ready stock, sign in, pay by QR, and upload payment proof. Staff confirms
              through WhatsApp at {contactInfo.phone}.
            </p>
          </div>
          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full bg-cream p-1 sm:w-auto sm:gap-2">
            <Filter size={16} className="ml-2 shrink-0 text-maroon-700" />
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCategory(filter.value)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-extrabold transition sm:px-4 ${
                  category === filter.value
                    ? 'bg-maroon-700 text-white'
                    : 'text-maroon-800 hover:bg-maroon-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Supabase products could not be loaded: {error}. Showing sample inventory.
          </div>
        )}

        {usingFallback && !loading && !error && (
          <div className="mt-5 rounded-lg border border-maroon-100 bg-white/75 px-4 py-3 text-sm font-semibold text-stone-600">
            Showing sample inventory until products are added in Supabase.
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-3 rounded-lg bg-white/80 py-16 text-sm font-bold text-maroon-800">
            <RefreshCw size={18} className="animate-spin" />
            Loading products...
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                fallback={usingFallback}
                onOrder={openCheckout}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
