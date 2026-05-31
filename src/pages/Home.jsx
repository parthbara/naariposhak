import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  Instagram,
  MapPin,
  PackageCheck,
  PhoneCall,
  QrCode,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import ChatAssistant from '../components/ChatAssistant.jsx';
import { fallbackProducts } from '../data/fallbackProducts.js';
import { contactInfo, whatsappUrl } from '../data/contactInfo.js';

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

const orderSteps = [
  {
    title: 'Discover Elegance',
    text: 'Browse our exclusive collection of kurtas and sarees crafted for perfection.',
    icon: Sparkles,
  },
  {
    title: 'Seamless Checkout',
    text: 'Place your order securely via digital payment and easily upload your confirmation.',
    icon: QrCode,
  },
  {
    title: 'Prompt Delivery',
    text: 'Your beautifully packaged garment will be dispatched to your doorstep swiftly.',
    icon: PackageCheck,
  },
];

export default function Home() {
  const featured = fallbackProducts.slice(0, 3);

  return (
    <div className="botanical-bg">
      <section className="line-motif mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-16">
        <div className="relative z-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-maroon-700 sm:text-sm sm:tracking-[0.22em]">
            Kurtas, sarees & complete women&apos;s wear
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-maroon-900 sm:text-6xl">
            Nari Poshak
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
            Sophisticated women&apos;s wear with elegant cuts, thoughtful fabric selection, and
            ready garments for everyday confidence and special moments.
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

        <div className="grid grid-cols-[0.85fr_1fr] gap-3 sm:gap-4">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85"
            alt="Elegant embroidered kurta"
            className="mt-8 aspect-[3/4] w-full rounded-lg object-cover shadow-soft sm:mt-14"
          />
          <img
            src="https://images.unsplash.com/photo-1610189012035-7e3fcbdaeb1a?auto=format&fit=crop&w=900&q=85"
            alt="Draped saree styling"
            className="aspect-[3/4] w-full rounded-lg object-cover shadow-soft"
          />
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
              <ProductCard key={product.id} product={product} fallback />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-maroon-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">
                Personal ordering
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold">Seamless Ordering & Delivery.</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                Enjoy a flawless shopping experience. Browse our curated collection, checkout securely online, and get your elegant garments delivered right to your door.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {orderSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-maroon-800">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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

      <ChatAssistant />
    </div>
  );
}
