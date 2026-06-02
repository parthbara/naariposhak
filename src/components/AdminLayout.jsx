import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ScrollText,
  Settings,
  Shirt,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const adminLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-maroon-700 text-white'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-950'
  }`;

const mobilePrimaryLinkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition ${
    isActive ? 'text-maroon-700' : 'text-slate-500 hover:text-slate-900'
  }`;

const mobileMenuLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-maroon-50 text-maroon-800'
      : 'text-slate-700 hover:bg-slate-100'
  }`;

export default function AdminLayout() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [showMobileMore, setShowMobileMore] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setAdminEmail(data.user.email);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell min-h-screen text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-maroon-700 font-serif font-bold text-white shadow-sm">
            NP
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-tight text-slate-950">
              Nari Poshak
            </p>
            <p className="truncate text-[11px] font-semibold text-slate-500">
              {adminEmail}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={adminLinkClass}>
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>
            <NavLink to="/admin/orders" className={adminLinkClass}>
              <ClipboardList size={17} />
              Orders
            </NavLink>
            <NavLink to="/admin/stock" className={adminLinkClass}>
              <Boxes size={17} />
              Add Stock
            </NavLink>
            <NavLink to="/admin/ledger" className={adminLinkClass}>
              <ScrollText size={17} />
              Ledger
            </NavLink>
          </nav>

          <div className="my-5 border-t border-slate-200" />

          <nav className="space-y-1">
            <NavLink to="/admin/customers" className={adminLinkClass}>
              <Users size={17} />
              Customers
            </NavLink>
            <NavLink to="/admin/settings" className={adminLinkClass}>
              <Settings size={17} />
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      <div className="pb-20 md:pb-0 md:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 font-bold">
            <Shirt size={18} className="text-maroon-700" />
            <span className="truncate text-sm sm:text-base">Admin Console</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
          >
            <LogOut size={15} />
            Logout
          </button>
        </header>
        <main className="p-3 sm:p-5">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
        {/* Mobile "More" popup */}
        {showMobileMore && (
          <div className="absolute inset-x-0 bottom-full mb-2 flex justify-end px-3">
            <div className="w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in slide-in-from-bottom-2">
              <nav className="space-y-1">
                <NavLink
                  to="/admin/customers"
                  onClick={() => setShowMobileMore(false)}
                  className={mobileMenuLinkClass}
                >
                  <Users size={16} />
                  Customers
                </NavLink>
                <NavLink
                  to="/admin/settings"
                  onClick={() => setShowMobileMore(false)}
                  className={mobileMenuLinkClass}
                >
                  <Settings size={16} />
                  Settings
                </NavLink>
              </nav>
            </div>
          </div>
        )}

        {/* Mobile Bottom Bar */}
        <nav className="grid grid-cols-5 gap-1 border-t border-slate-200 bg-white px-2 py-1 shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
          <NavLink to="/admin" end className={mobilePrimaryLinkClass} onClick={() => setShowMobileMore(false)}>
            <LayoutDashboard size={20} />
            Home
          </NavLink>
          <NavLink to="/admin/orders" className={mobilePrimaryLinkClass} onClick={() => setShowMobileMore(false)}>
            <ClipboardList size={20} />
            Orders
          </NavLink>
          <NavLink to="/admin/stock" className={mobilePrimaryLinkClass} onClick={() => setShowMobileMore(false)}>
            <Boxes size={20} />
            Stock
          </NavLink>
          <NavLink to="/admin/ledger" className={mobilePrimaryLinkClass} onClick={() => setShowMobileMore(false)}>
            <ScrollText size={20} />
            Ledger
          </NavLink>
          <button
            type="button"
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex flex-col items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition ${
              showMobileMore ? 'text-maroon-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal size={20} />
            More
          </button>
        </nav>
      </div>

      {/* Click away overlay for mobile menu */}
      {showMobileMore && (
        <div
          className="fixed inset-0 z-20 bg-black/10 md:hidden"
          onClick={() => setShowMobileMore(false)}
        />
      )}
    </div>
  );
}
