'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  BookOpenCheck,
  Hourglass,
  ShoppingBag,
  ShieldCheck,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { rawMaterials, batches, orders, products } = useCraftStore();

  const lowStockCount = rawMaterials.filter(
    (rm) => rm.stock_quantity <= (rm.min_stock_alert || 0)
  ).length;

  const curingBatchesCount = batches.filter(
    (b) => b.status === 'curing'
  ).length;

  const pendingOrdersCount = orders.filter(
    (o) => o.payment_status === 'unpaid' || o.status === 'pending'
  ).length;

  const navItems = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Matières Premières',
      href: '/raw-materials',
      icon: Boxes,
      badge: lowStockCount > 0 ? { text: `${lowStockCount}`, color: 'bg-rose-500 text-white' } : undefined,
    },
    {
      name: 'Produits & Recettes',
      href: '/products',
      icon: BookOpenCheck,
      badge: products.length > 0 ? { text: `${products.length}`, color: 'bg-slate-200 text-slate-700' } : undefined,
    },
    {
      name: 'Production & Cure',
      href: '/production',
      icon: Hourglass,
      badge: curingBatchesCount > 0 ? { text: `${curingBatchesCount} en cure`, color: 'bg-amber-500 text-slate-950 font-black' } : undefined,
    },
    {
      name: 'Carnet de Commandes',
      href: '/orders',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? { text: `${pendingOrdersCount}`, color: 'bg-indigo-600 text-white' } : undefined,
    },
    {
      name: 'Conformité & BPF',
      href: '/compliance',
      icon: ShieldCheck,
    },
    {
      name: 'Coûts & Finances',
      href: '/finances',
      icon: Receipt,
    },
    {
      name: 'Caisse Marché',
      href: '/pos',
      icon: ShoppingBag,
      highlight: true,
      badge: { text: 'POS ⚡', color: 'bg-amber-400 text-slate-950 font-black' },
    },
  ];

  return (
    <aside className="hidden md:flex md:w-64 glass-panel border border-slate-200/90 shrink-0 p-4 flex-col justify-between bg-white/90 shadow-sm rounded-3xl backdrop-blur-md">
      <nav className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 px-3 pb-2 pt-1">
          Menu Atelier
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                isActive
                  ? item.highlight
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-extrabold scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? item.highlight
                        ? 'text-slate-950 stroke-[2.5]'
                        : 'text-white stroke-[2.5]'
                      : 'text-slate-400 group-hover:text-indigo-600'
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-transform group-hover:scale-105 ${
                    isActive ? 'bg-white/30 text-current' : item.badge.color
                  }`}
                >
                  {item.badge.text}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
