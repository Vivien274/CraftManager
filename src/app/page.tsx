'use client';

import Link from 'next/link';
import {
  TrendingUp,
  PieChart,
  Hourglass,
  ShoppingBag,
  Boxes,
  BookOpenCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ClipboardList,
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
  const { isLoaded, organisation, products, rawMaterials, batches, sales, orders, cleaningLogs } = useCraftStore();

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

  const curingBatchesCount = batches.filter((b) => b.status === 'curing').length;

  // Low stock raw materials count
  const lowStockRM = rawMaterials.filter((m) => m.stock_quantity <= (m.min_stock_alert || 0));
  const lowStockRMCount = lowStockRM.length;
  const healthyStockPercent = rawMaterials.length > 0
    ? Math.round(((rawMaterials.length - lowStockRMCount) / rawMaterials.length) * 100)
    : 100;

  const pendingOrders = orders.filter((o) => o.payment_status === 'unpaid' || o.status === 'pending');

  return (
    <div className="space-y-6">
      {/* 🌤️ Cockpit Météo Atelier — Banner */}
      <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 shadow-xs inline-block mb-2">
                Cockpit Atelier • {organisation.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Météo de l'Atelier 🌿
              </h1>
            </div>

            <div className="text-left sm:text-right bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <span className="text-[11px] text-slate-300 font-semibold block">Chiffre d'Affaires Réalisé</span>
              <span className="text-xl font-black text-amber-400">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* Activity Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Link
              href="/production"
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/10 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase">Cure & Maturation</p>
                  <p className="text-xs font-black text-white">
                    {curingBatchesCount} lot(s) en cours ({batchesEndingCure.length} bientôt prêts)
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/orders"
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/10 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-400/20 text-indigo-300 flex items-center justify-center font-bold">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase">Commandes</p>
                  <p className="text-xs font-black text-white">
                    {pendingOrders.length} commande(s) à traiter
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/raw-materials"
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/10 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  lowStockRMCount > 0 ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase">Santé des Stocks</p>
                  <p className="text-xs font-black text-white">
                    {lowStockRMCount > 0 ? `${lowStockRMCount} ingrédient(s) en alerte` : '100% des stocks optimaux'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 Jauges Circulaires & Indicateurs Visuels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jauge 1: Santé des Stocks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Santé des Stocks</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-slate-900">{healthyStockPercent}%</span>
              <span className="text-xs font-bold text-slate-500">{rawMaterials.length - lowStockRMCount}/{rawMaterials.length} optimaux</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthyStockPercent >= 80 ? 'bg-emerald-500' : healthyStockPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${healthyStockPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {lowStockRMCount > 0 ? `⚠️ ${lowStockRMCount} réapprovisionnement(s) conseillé(s)` : '✅ Aucune rupture en vue'}
          </p>
        </div>

        {/* Jauge 2: Marge Brute */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marge Moyenne</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-amber-600">{averageMargin.toFixed(0)}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Excellente</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, averageMargin)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Calculée sur l'ensemble du catalogue BOM</p>
        </div>

        {/* Jauge 3: Conformité & Registre BPF */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hygiène & BPF</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-emerald-600">100%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">ISO 22716</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 w-full" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {cleaningLogs[0]?.date ? `Dernier nettoyage : ${cleaningLogs[0].date}` : 'Registre sanitaire actif'}
          </p>
        </div>

        {/* Jauge 4: Commandes & Ventes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activité Ventes</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-indigo-600">{totalSalesCount}</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Encaissements</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSalesCount / 10) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Sur stand, marché et atelier</p>
        </div>
      </div>

      {/* Catalogue & Performance Marge Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Catalogue Produits & Performance Marge
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Rentabilité unitaire et coûts de revient calculés en direct.</p>
          </div>
          <Link href="/products" className="text-xs text-indigo-600 font-black hover:underline flex items-center gap-1">
            <span>Voir tout le catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((product) => {
            const cogs = calculateProductCOGS(product, rawMaterialsMap);
            const margin = calculateMarginMetrics(product.selling_price, cogs.totalCOGS);

            return (
              <div
                key={product.id}
                className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-xl">
                      🧼
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{product.name}</h4>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Coût BOM : <strong>{formatCurrency(cogs.totalCOGS)}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-emerald-700 font-black text-base block">
                    {formatCurrency(product.selling_price)}
                  </span>
                  <span className="text-[10px] text-amber-900 font-extrabold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 inline-block mt-0.5">
                    +{formatCurrency(margin.grossMarginEUR)} ({margin.grossMarginPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
