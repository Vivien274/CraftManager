'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Plus,
  Trash2,
  PieChart,
  ShoppingBag,
  Boxes,
  Store,
  DollarSign,
  Zap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Scale,
  FlaskConical,
  X,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import {
  formatCurrency,
  calculateProductCOGS,
  calculateMarginMetrics,
} from '@/lib/utils/calculator';
import { ExpenseCategory, Product } from '@/lib/types/craft';

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, { label: string; color: string }> = {
  emplacement_marche: { label: 'Emplacement Marché / Salon', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  laboratoire_dip: { label: 'Laboratoire & DIP Tox', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  energie_fluides: { label: 'Électricité & Fluides Cure', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  emballage_expedition: { label: 'Emballage & Expédition', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  outillage: { label: 'Outillage & Moules', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  autre: { label: 'Autre Frais', color: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export default function FinancesPage() {
  const {
    isLoaded,
    products,
    rawMaterials,
    sales,
    expenses,
    addExpense,
    deleteExpense,
  } = useCraftStore();

  const [activeTab, setActiveTab] = useState<'expenses' | 'cogs' | 'timeline'>('expenses');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Form State for new expense
  const [expenseName, setExpenseName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('emplacement_marche');
  const [expenseAmount, setExpenseAmount] = useState<number>(35);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  const rawMaterialsMap = useMemo(() => {
    const map: Record<string, (typeof rawMaterials)[0]> = {};
    rawMaterials.forEach((rm) => {
      map[rm.id] = rm;
    });
    return map;
  }, [rawMaterials]);

  // Financial KPI Calculations
  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.total_amount, 0), [sales]);
  const totalRawMaterialPurchases = useMemo(
    () => rawMaterials.reduce((sum, rm) => sum + rm.purchase_price, 0),
    [rawMaterials]
  );
  const totalOperationalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const totalCosts = totalRawMaterialPurchases + totalOperationalExpenses;
  const netProfit = totalRevenue - totalCosts;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName || expenseAmount <= 0) return;

    addExpense({
      name: expenseName,
      category: expenseCategory,
      amount: Number(expenseAmount),
      expense_date: expenseDate,
      notes: expenseNotes,
    });

    setIsAddExpenseModalOpen(false);
    setExpenseName('');
    setExpenseAmount(35);
    setExpenseNotes('');
  };

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
        Chargement de l'analyse des coûts & finances...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              Gestion Financière Savonnerie
            </span>
            <span className="text-xs text-slate-500 font-medium">Contrôle des coûts & Rentabilité</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            Suivi des Coûts, Frais & Marges
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilotez vos coûts de revient, vos frais d'emplacement de marché, vos audits DIP et le bénéfice net de votre atelier.
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Enregistrer des Frais / Dépense
        </button>
      </div>

      {/* Financial KPIs Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue (Ventes) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Chiffre d'Affaires (Ventes)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="font-bold text-slate-800">{sales.length} ventes</span> encaissées au total
          </div>
        </div>

        {/* Card 2: Raw Material Purchases (Achats Stocks) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Achats Matières Premières
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalRawMaterialPurchases)}</div>
          <div className="text-xs text-slate-500 font-medium">
            Huiles, Beurres, Lessive de Soude & HE
          </div>
        </div>

        {/* Card 3: Operational Expenses (Frais Fixes) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Frais d'Exploitation & Labo
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalOperationalExpenses)}</div>
          <div className="text-xs text-slate-500 font-medium">
            Emplacements marchés, Labo DIP & Énergie
          </div>
        </div>

        {/* Card 4: Net Profit & Net Margin */}
        <div className={`rounded-2xl p-5 border shadow-sm space-y-2 ${
          netProfit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Bénéfice Net Estimé
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              netProfit >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs font-bold flex items-center gap-1 text-slate-700">
            <span>Marge nette globale :</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
              netMarginPercent >= 50
                ? 'bg-emerald-200 text-emerald-950'
                : netMarginPercent > 0
                ? 'bg-amber-200 text-amber-950'
                : 'bg-red-200 text-red-950'
            }`}>
              {netMarginPercent.toFixed(1)} %
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-600" />
          Registre des Frais & Dépenses d'Exploitation
        </button>
        <button
          onClick={() => setActiveTab('cogs')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'cogs'
              ? 'border-amber-500 text-amber-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-amber-500" />
          Analyse Coût de Revient (COGS) par Savon
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-emerald-600 text-emerald-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Journal des Flux de Trésorerie
        </button>
      </div>

      {/* TAB 1: REGISTRE DES FRAIS D'EXPLOITATION */}
      {activeTab === 'expenses' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dépenses & Frais de Fonctionnement Savonnerie</h2>
              <p className="text-xs text-slate-500">Suivi des coûts d'emplacements sur les marchés, audits labo DIP et énergie.</p>
            </div>
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter une dépense
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Intitulé des Frais / Dépense</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Notes / Justificatif</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.map((exp) => {
                  const catConfig = EXPENSE_CATEGORY_LABELS[exp.category] || EXPENSE_CATEGORY_LABELS.autre;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-slate-600">{exp.expense_date}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{exp.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 font-mono text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 italic">{exp.notes || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition rounded hover:bg-slate-100"
                          title="Supprimer la dépense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                      Aucune dépense d'exploitation enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYSE COGS PAR SAVON */}
      {activeTab === 'cogs' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Analyse Détaillée du Coût de Revient par Savon</h2>
            <p className="text-xs text-slate-500">
              Décomposition du coût des ingrédients (huiles, lessive, HE), packaging et part fixe d'atelier.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Produit Savon</th>
                  <th className="px-4 py-3 text-right">Coût Ingrédients / u</th>
                  <th className="px-4 py-3 text-right">Packaging & Étiquette</th>
                  <th className="px-4 py-3 text-right font-bold">Coût de Revient (COGS)</th>
                  <th className="px-4 py-3 text-right font-bold">Prix Vente TTC</th>
                  <th className="px-4 py-3 text-right font-black text-emerald-700">Marge Brute €</th>
                  <th className="px-4 py-3 text-center">Multiplicateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => {
                  const cogs = calculateProductCOGS(p, rawMaterialsMap);
                  const margin = calculateMarginMetrics(p.selling_price, cogs.totalCOGS);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCurrency(cogs.ingredientsCostPerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCurrency(cogs.packagingCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-amber-50/50">
                        {formatCurrency(cogs.totalCOGS)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                        {formatCurrency(p.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                        +{formatCurrency(margin.grossMarginEUR)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] border border-emerald-300">
                          x{margin.multiplier.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE FLUX DE TRESORERIE */}
      {activeTab === 'timeline' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Journal Combiné des Entrées & Sorties</h2>
            <p className="text-xs text-slate-500">Historique chronologique des encaissements de ventes et des dépenses d'atelier.</p>
          </div>

          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Vente encaissée ({sale.channel})</h4>
                    <span className="text-[11px] text-slate-500">{new Date(sale.created_at).toLocaleString('fr-FR')} • {sale.payment_method}</span>
                  </div>
                </div>
                <span className="font-black text-emerald-700 text-sm font-mono">+{formatCurrency(sale.total_amount)}</span>
              </div>
            ))}

            {expenses.map((exp) => (
              <div key={exp.id} className="p-3.5 rounded-xl border bg-amber-50/60 border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{exp.name}</h4>
                    <span className="text-[11px] text-slate-500">{exp.expense_date} • {exp.category}</span>
                  </div>
                </div>
                <span className="font-black text-amber-900 text-sm font-mono">-{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Enregistrer des Frais / Dépense
              </h2>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé des Frais / Dépense *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Emplacement Marché de Nuit Aix"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catégorie de Frais *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="glass-input w-full bg-white font-bold"
                >
                  <option value="emplacement_marche">Emplacement Marché / Salon</option>
                  <option value="laboratoire_dip">Laboratoire & DIP Tox</option>
                  <option value="energie_fluides">Électricité & Fluides Cure</option>
                  <option value="emballage_expedition">Emballage & Expédition</option>
                  <option value="outillage">Outillage & Moules</option>
                  <option value="autre">Autre Frais</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="glass-input w-full font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="glass-input w-full font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Justificatif</label>
                <textarea
                  rows={2}
                  placeholder="Détails du reçu ou n° de facture..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="glass-button px-4 py-2 rounded-xl text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
