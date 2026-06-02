import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Instagram,
  MapPin,
  PackageCheck,
  PhoneCall,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import useSiteSettings from '../lib/useSiteSettings.js';
import { supabase } from '../lib/supabase.js';

const serviceCards = [
  {
    title: 'Ready Kurtas',
    text: 'Comfortable daily and festive kurtas selected for graceful cuts, fabric feel, and finish.',
    icon: PackageCheck,
  },
  {
    title: 'Elegant Sarees',
    text: 'Drapes chosen for rich color, fluid fall, and polished occasion styling.',
    icon: Sparkles,
  },
  {
    title: "Complete Women's Wear",
    text: 'A growing ready-wear collection for everyday confidence and special moments.',
    icon: ShoppingBag,
  },
];

export default function Home() {
  const { contactInfo, whatsappUrl, landingPage } = useSiteSettings();
  const [featured, setFeatured] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setFeatured(data);
    }
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (!landingPage?.heroImages?.length || landingPage.heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % landingPage.heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [landingPage?.heroImages]);

  return (
    <div className="botanical-bg">
      <section className="line-motif mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
        <div className="relative z-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700 sm:text-sm sm:tracking-[0.22em]">
            {landingPage?.heroSubtitle}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-maroon-900 sm:text-6xl">
            {landingPage?.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
            {landingPage?.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-maroon-700 px-6 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-maroon-800 sm:w-auto"
            >
              Browse stock
              <ArrowRight size={17} />
            </Link>
            <a
              href="#collection"
              className="inline-flex w-full items-center justify-center rounded-full border border-maroon-700 px-6 py-3 text-sm font-extrabold text-maroon-800 transition hover:bg-maroon-50 sm:w-auto"
            >
              Shop the collection
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl shadow-soft sm:aspect-[4/5]">
          {landingPage?.heroImages?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="Hero slide"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                activeSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {landingPage?.heroImages?.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-md">
              {landingPage.heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
          {!landingPage?.heroImages?.length && (
            <div className="flex h-full w-full items-center justify-center bg-maroon-50 text-maroon-300">
              <Sparkles size={48} />
            </div>
          )}
        </div>
      </section>

      <section className="bg-white/74 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                Featured pieces
              </p>
              <h2 className="mt-2 font-serif text-4xl font-bold text-ink">Kurtas & sarees</h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-maroon-800 hover:text-maroon-500"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Personal ordering section removed as requested */}

      <section id="collection" className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                Garment collection
              </p>
              <h2 className="mt-2 font-serif text-4xl font-bold text-maroon-900">
                Complete women&apos;s wear for movement, comfort, and occasion.
              </h2>
            </div>
            <aside className="rounded-lg bg-white/85 p-5 shadow-soft ring-1 ring-maroon-100">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700">
                Visit or message
              </p>
              <div className="mt-4 space-y-3 text-sm font-semibold text-stone-700">
                <a href={whatsappUrl} className="flex items-center gap-2 text-maroon-800">
                  <PhoneCall size={17} />
                  {contactInfo.phone} WhatsApp only
                </a>
                <p className="flex items-center gap-2">
                  <MapPin size={17} />
                  {contactInfo.address}
                </p>
                <a
                  href="https://www.instagram.com/nari_poshak2022"
                  className="flex items-center gap-2"
                >
                  <Instagram size={17} />
                  @{contactInfo.instagram}
                </a>
                <p>Registered online store PAN {contactInfo.pan}</p>
              </div>
            </aside>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {serviceCards.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.title}
                  className="rounded-lg border border-maroon-100 bg-white/82 p-5 shadow-soft"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-maroon-700 text-white">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-bold text-ink">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{service.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
