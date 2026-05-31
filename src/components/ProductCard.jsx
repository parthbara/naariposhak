import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PackageCheck, ShoppingBag } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

export default function ProductCard({ product, fallback = false, onOrder }) {
  const images = useMemo(() => {
    const carouselImages = Array.isArray(product.image_urls) ? product.image_urls : [];
    const merged = [...carouselImages, product.image_url].filter(Boolean);
    return [...new Set(merged)];
  }, [product.image_url, product.image_urls]);
  const [activeImage, setActiveImage] = useState(0);
  const hasCarousel = images.length > 1;

  function moveImage(direction) {
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-maroon-100/70 transition hover:-translate-y-1 hover:shadow-xl flex flex-col">
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-maroon-50 block">
        {images.length ? (
          <img
            src={images[activeImage]}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-maroon-100 to-cream text-maroon-700">
            <PackageCheck size={42} />
          </div>
        )}
        {hasCarousel && (
          <>
            <button
              type="button"
              onClick={() => moveImage(-1)}
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-maroon-800 shadow-soft backdrop-blur transition hover:bg-white"
              aria-label="Previous product photo"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => moveImage(1)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-maroon-800 shadow-soft backdrop-blur transition hover:bg-white"
              aria-label="Next product photo"
            >
              <ChevronRight size={17} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-maroon-950/45 px-2 py-1">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-1.5 rounded-full transition ${
                    activeImage === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                  }`}
                  aria-label={`Show product photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-maroon-700">
              {product.category}
            </p>
            <Link to={`/product/${product.id}`} className="hover:text-maroon-700 transition">
              <h3 className="mt-1 font-serif text-xl font-bold text-ink line-clamp-1">{product.title}</h3>
            </Link>
          </div>
          <p className="shrink-0 rounded-full bg-maroon-50 px-3 py-1 text-sm font-bold text-maroon-800">
            {currencyFormatter.format(Number(product.price || 0))}
          </p>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-stone-600">{product.description}</p>
        <div className="mt-auto pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
            <span className="font-semibold text-stone-700">{product.stock_count} in stock</span>
            {fallback && <span className="text-xs font-semibold text-stone-400">Sample</span>}
          </div>
          <button
            type="button"
            disabled={Number(product.stock_count) <= 0}
            onClick={(e) => {
              e.preventDefault();
              onOrder?.(product);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-maroon-700 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <ShoppingBag size={16} />
            Checkout
          </button>
        </div>
      </div>
    </article>
  );
}
