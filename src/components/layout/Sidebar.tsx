'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  BookOpenCheck,
  Hourglass,
  ShoppingBag,
  Sliders,
  ShieldCheck,
  Receipt,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Matières Premières',
    href: '/raw-materials',
    icon: Boxes,
  },
  {
    name: 'Produits & Recettes',
    href: '/products',
    icon: BookOpenCheck,
  },
  {
    name: 'Production & Cure',
    href: '/production',
    icon: Hourglass,
  },
  {
    name: 'Carnet de Commandes',
    href: '/orders',
    icon: ClipboardList,
  },
  {
    name: 'Conformité & DIP / CLP',
    href: '/compliance',
    icon: ShieldCheck,
  },
  {
    name: 'Coûts & Finances',
    href: '/finances',
    icon: Receipt,
  },
  {
    name: 'Caisse Stand & Marché',
    href: '/pos',
    icon: ShoppingBag,
    highlight: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 glass-panel border-r border-slate-200/80 shrink-0 p-4 flex-col justify-between bg-white/80 rounded-2xl">
      <nav className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 px-3 pb-2 pt-1">
          Navigation Principale
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Organization Badge Footer */}
      <div className="pt-4 border-t border-slate-200 mt-auto">
        <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="truncate">
            <p className="font-bold text-slate-800 truncate">SaaS Multi-Tenant</p>
            <p className="text-[10px] text-slate-500 font-medium">RLS Active • Mode Clair</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
