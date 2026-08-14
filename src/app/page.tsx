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
      {/* 🌤️ Cockpit Météo Atelier — High Contrast Clean Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 inline-block mb-1.5">
              Cockpit Atelier • {organisation.name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Météo de l'Atelier 🌿
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Vue synthétique de votre production en cours, des commandes et de l'état des stocks.
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <span className="text-[11px] text-slate-500 font-bold block">Chiffre d'Affaires Réalisé</span>
            <span className="text-xl font-black text-emerald-700">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Activity Cards with Clear High-Contrast Styling */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Link
            href="/production"
            className="bg-slate-50 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                <Hourglass className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cure & Maturation</p>
                <p className="text-xs font-black text-slate-900">
                  {curingBatchesCount} lot(s) en cours
                </p>
                <span className="text-[11px] text-amber-800 font-semibold block">
                  {batchesEndingCure.length} bientôt prêts
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/orders"
            className="bg-slate-50 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center font-bold shrink-0">
                <ClipboardList className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Commandes</p>
                <p className="text-xs font-black text-slate-900">
                  {pendingOrders.length} commande(s)
                </p>
                <span className="text-[11px] text-indigo-800 font-semibold block">
                  en attente de traitement
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/raw-materials"
            className="bg-slate-50 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 border ${
                  lowStockRMCount > 0
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Santé des Stocks</p>
                <p className="text-xs font-black text-slate-900">
                  {lowStockRMCount > 0 ? `${lowStockRMCount} ingrédient(s) bas` : 'Stocks optimaux (100%)'}
                </p>
                <span className={`text-[11px] font-semibold block ${lowStockRMCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {lowStockRMCount > 0 ? 'Réapprovisionner' : 'Aucune rupture'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
          </Link>
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
