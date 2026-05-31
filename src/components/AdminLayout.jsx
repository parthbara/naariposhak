import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ClipboardList, LogOut, ScrollText, Shirt } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const adminLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-950'
  }`;

export default function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase?.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell min-h-screen text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <div className="grid h-8 w-8 place-items-center rounded bg-maroon-700 font-serif font-bold text-white">
            NP
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">Nari Poshak Admin</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Operations
            </p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
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
      </aside>

      <div className="pb-20 md:pb-0 md:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
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

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1 border-t border-slate-200 bg-white p-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] md:hidden">
        <NavLink to="/admin/orders" className={adminLinkClass}>
          <ClipboardList size={16} />
          Orders
        </NavLink>
        <NavLink to="/admin/stock" className={adminLinkClass}>
          <Boxes size={16} />
          Stock
        </NavLink>
        <NavLink to="/admin/ledger" className={adminLinkClass}>
          <ScrollText size={16} />
          Ledger
        </NavLink>
      </nav>
    </div>
  );
}
