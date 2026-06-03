import { NavLink, Outlet } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Phone, ShoppingBag, UserRound } from 'lucide-react';
import ChatAssistant from './ChatAssistant.jsx';
import useSiteSettings from '../lib/useSiteSettings.js';

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-bold transition sm:px-4 ${
    isActive ? 'bg-maroon-700 text-white' : 'text-maroon-800 hover:bg-maroon-50'
  }`;

export default function PublicLayout() {
  const { contactInfo, whatsappUrl, announcement } = useSiteSettings();

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Announcement Banner */}
      {announcement?.enabled && announcement?.text && (
        <div
          className="px-4 py-2 text-center text-sm font-bold text-white"
          style={{ background: announcement.color || '#8A1C2A' }}
        >
          {announcement.text}
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-maroon-100/70 bg-cream/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-maroon-700 font-serif text-lg font-bold text-white sm:h-11 sm:w-11 sm:text-xl">
              NP
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold leading-tight text-maroon-800 sm:text-xl">
                Nari Poshak
              </p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-stone-500 sm:text-xs">
                For women
              </p>
            </div>
          </NavLink>
          <nav className="flex shrink-0 items-center gap-1">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/shop" className={linkClass}>
              Shop
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="bg-maroon-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.15fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <ShoppingBag />
              <p className="font-serif text-2xl font-bold">Nari Poshak</p>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
              Elegant kurtas, sarees, and complete women&apos;s wear for everyday confidence and
              special occasions.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/60">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-white/85">
              <a href={whatsappUrl} className="flex items-center gap-2 transition hover:text-white">
                <Phone size={15} />
                {contactInfo.phone} WhatsApp only
              </a>
              <p className="flex items-center gap-2">
                <MapPin size={15} />
                {contactInfo.address}
              </p>
              <p>Registered online store PAN {contactInfo.pan}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/60">Social</p>
            <div className="mt-3 space-y-2 text-sm text-white/85">
              <a
                href={`https://www.instagram.com/${contactInfo.instagram}`}
                className="flex items-center gap-2 transition hover:text-white"
              >
                <Instagram size={15} />
                {contactInfo.instagram}
              </a>
              <p className="flex items-center gap-2">
                <Facebook size={15} />
                {contactInfo.facebook}
              </p>
            </div>
            <NavLink
              to="/login"
              className="mt-5 inline-block text-xs font-semibold uppercase tracking-wide text-white/45 transition hover:text-white/80"
            >
              Staff access
            </NavLink>
          </div>
        </div>
      </footer>

      <ChatAssistant />
    </div>
  );
}
