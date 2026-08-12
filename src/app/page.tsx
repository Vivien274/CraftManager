'use client';

import Link from 'next/link';
import {
  TrendingUp,
  PieChart,
  Hourglass,
  ShoppingBag,
  Boxes,
  BookOpenCheck,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import {
  formatCurrency,
  calculateProductCOGS,
  calculateMarginMetrics,
  calculateCuringStatus,
} from '@/lib/utils/calculator';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { isLoaded, organisation, products, rawMaterials, batches, sales } = useCraftStore();

  const rawMaterialsMap = useMemo(() => {
    const map: Record<string, (typeof rawMaterials)[0]> = {};
    rawMaterials.forEach((rm) => {
      map[rm.id] = rm;
    });
    return map;
  }, [rawMaterials]);

  // Average margin across products
  const averageMargin = useMemo(() => {
    if (products.length === 0) return 0;
    let sumMarginPercent = 0;
    for (const p of products) {
      const cogs = calculateProductCOGS(p, rawMaterialsMap);
      const margin = calculateMarginMetrics(p.selling_price, cogs.totalCOGS);
      sumMarginPercent += margin.grossMarginPercent;
    }
    return sumMarginPercent / products.length;
  }, [products, rawMaterialsMap]);

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Chargement du tableau de bord...</div>;
  }

  // Analytics Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesCount = sales.length;

  // Batches ending curing soon (within 7 days)
  const batchesEndingCure = batches.filter((b) => {
    if (b.status !== 'curing') return false;
    const product = products.find((p) => p.id === b.product_id) || b.product;
    const status = calculateCuringStatus(b.production_date, product?.curing_days || 0);
    return status.daysLeft <= 7;
  });

  // Low stock raw materials count
  const lowStockRMCount = rawMaterials.filter((m) => m.stock_quantity <= m.min_stock_alert).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-50/90 via-white to-amber-50/90 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-100 text-amber-900 border border-amber-300 uppercase">
              Savonnerie Artisanale
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Bienvenue dans {organisation.name} 👋
          </h1>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            Suivi en temps réel de votre production de savons, de vos stocks et de vos marges.
          </p>
        </div>
      </div>

      {/* Curing & Stock Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Reminder: Batches Finishing Cure */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Fin de Cure Imminente</h3>
              <p className="text-amber-800 mt-0.5">
                <span className="font-bold text-slate-900">{batchesEndingCure.length} lot(s)</span> terminent leur séchage cette semaine.
              </p>
            </div>
          </div>
          <Link
            href="/production"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-amber-400 shadow-sm transition"
          >
            Voir Kanban
          </Link>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-950 text-sm">Matières Premières</h3>
              <p className="text-indigo-800 mt-0.5">
                <span className="font-bold text-slate-900">{lowStockRMCount} ingrédient(s)</span> en alerte de stock bas.
              </p>
            </div>
          </div>
          <Link
            href="/raw-materials"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[11px] shrink-0 hover:bg-indigo-500 shadow-sm transition"
          >
            Réapprovisionner
          </Link>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Revenue */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Chiffre d'Affaires Encaissé</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              {totalSalesCount} transaction(s) effectuée(s)
            </span>
          </div>
        </div>

        {/* Stat 2: Average Margin */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Marge Brute Moyenne</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600">
              {averageMargin.toFixed(0)}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Sur l'ensemble du catalogue BOM
            </span>
          </div>
        </div>

        {/* Stat 3: Product Catalog */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Produits au Catalogue</span>
            <BookOpenCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{products.length}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Formules et recettes enregistrées
            </span>
          </div>
        </div>

        {/* Stat 4: Batches in Curing */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lots en Cure Actifs</span>
            <Hourglass className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600">
              {batches.filter((b) => b.status === 'curing').length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              En cours de séchage / maturation
            </span>
          </div>
        </div>
      </div>

      {/* Top Products & Quick Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Catalog Products */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-slate-200/80 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Catalogue Produits & Performance Marge
            </h2>
            <Link href="/products" className="text-xs text-amber-600 font-bold hover:underline">
              Gérer les recettes →
            </Link>
          </div>

          <div className="space-y-3">
            {products.map((product) => {
              const cogs = calculateProductCOGS(product, rawMaterialsMap);
              const margin = calculateMarginMetrics(product.selling_price, cogs.totalCOGS);

              return (
                <div
                  key={product.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <BookOpenCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900">{product.name}</h4>
                      <span className="text-slate-500 text-[11px]">
                        Coût unitaire: {formatCurrency(cogs.totalCOGS)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-700 font-extrabold text-sm block">
                      {formatCurrency(product.selling_price)}
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 rounded bg-amber-100 border border-amber-200">
                      Marge: +{formatCurrency(margin.grossMarginEUR)} ({margin.grossMarginPercent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-200/80 bg-white space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Actions Rapides</h2>
          <div className="space-y-2.5">
            <Link
              href="/raw-materials"
              className="glass-button p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100 group"
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>Ajouter une Matière Première</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
            </Link>

            <Link
              href="/products"
              className="glass-button p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100 group"
            >
              <div className="flex items-center gap-2.5">
                <BookOpenCheck className="w-4 h-4 text-amber-600" />
                <span>Créer une Recette / BOM</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </Link>

            <Link
              href="/production"
              className="glass-button p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100 group"
            >
              <div className="flex items-center gap-2.5">
                <Hourglass className="w-4 h-4 text-purple-600" />
                <span>Lancer un Lot de Production</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
