'use client';

import { useState } from 'react';
import {
  Boxes,
  Plus,
  Truck,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { formatCurrency, formatCostPerUnit, calculateCostPerUnit } from '@/lib/utils/calculator';
import { UnitType } from '@/lib/types/craft';

export default function RawMaterialsPage() {
  const {
    isLoaded,
    rawMaterials,
    suppliers,
    addRawMaterial,
    deleteRawMaterial,
    addSupplier,
  } = useCraftStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // Form State - Raw Material
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Huiles Végétales');
  const [supplierId, setSupplierId] = useState('');
  const [unit, setUnit] = useState<UnitType>('g');
  const [purchasePrice, setPurchasePrice] = useState<number>(30);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1000);
  const [stockQuantity, setStockQuantity] = useState<number>(1000);
  const [minStockAlert, setMinStockAlert] = useState<number>(200);

  // Form State - Supplier
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supWebsite, setSupWebsite] = useState('');
  const [supNotes, setSupNotes] = useState('');

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Chargement des matières premières...</div>;
  }

  // Calculated Live Cost Per Unit in Form
  const liveCostPerUnit = calculateCostPerUnit(purchasePrice, purchaseQuantity);

  // Categories list
  const categories = Array.from(new Set(rawMaterials.map((m) => m.category || 'Autre')));

  // Filtered Materials
  const filteredMaterials = rawMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = rawMaterials.filter((m) => m.stock_quantity <= m.min_stock_alert).length;

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addRawMaterial({
      name,
      category,
      supplier_id: supplierId || undefined,
      unit,
      purchase_price: Number(purchasePrice),
      purchase_quantity: Number(purchaseQuantity),
      stock_quantity: Number(stockQuantity),
      min_stock_alert: Number(minStockAlert),
    });

    setIsAddMaterialOpen(false);
    setName('');
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    addSupplier({
      name: supName,
      email: supEmail,
      phone: supPhone,
      website: supWebsite,
      notes: supNotes,
    });

    setIsAddSupplierOpen(false);
    setSupName('');
    setSupEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Boxes className="w-7 h-7 text-indigo-600" />
            Matières Premières & Fournisseurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos stocks d'ingrédients, calculez le coût unitaire au gramme/millilitre et recevez des alertes de réapprovisionnement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="glass-button px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-800"
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            Fournisseur (+{suppliers.length})
          </button>
          <button
            onClick={() => setIsAddMaterialOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Matière Première
          </button>
        </div>
      </div>

      {/* Low Stock Alert Header */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">{lowStockCount} matière(s) première(s) en alerte de stock bas !</span>
            <span className="ml-2 text-amber-800">Pensez à passer commande auprès de vos fournisseurs.</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-between bg-white">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher un ingrédient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input text-xs bg-white text-slate-800 border-slate-300"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Raw Materials Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Matière Première</th>
                <th className="px-6 py-3.5">Catégorie</th>
                <th className="px-6 py-3.5">Fournisseur</th>
                <th className="px-6 py-3.5 text-right">Prix d'Achat Global</th>
                <th className="px-6 py-3.5 text-right">Coût Unitaire (Calculé)</th>
                <th className="px-6 py-3.5 text-right">Stock Restant</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMaterials.map((material) => {
                const supplier = suppliers.find((s) => s.id === material.supplier_id);
                const isLowStock = material.stock_quantity <= material.min_stock_alert;

                return (
                  <tr key={material.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {material.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {supplier ? supplier.name : <span className="text-slate-400">Non rattaché</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      {formatCurrency(material.purchase_price)}{' '}
                      <span className="text-slate-500 font-normal">/ {material.purchase_quantity} {material.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600">
                      {formatCostPerUnit(material.cost_per_unit, material.unit)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isLowStock
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {material.stock_quantity} {material.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteRawMaterial(material.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Raw Material */}
      {isAddMaterialOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Ajouter une Matière Première
            </h2>

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom de l'ingrédient *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Huile d'Amande Douce BIO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Catégorie</label>
                  <input
                    type="text"
                    placeholder="ex: Huiles, Beurres, Fragrances"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unité de mesure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="glass-input w-full bg-white"
                  >
                    <option value="g">Gramme (g)</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="ml">Millilitre (ml)</option>
                    <option value="l">Litre (l)</option>
                    <option value="unité">Unité</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Fournisseur</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="glass-input w-full bg-white"
                >
                  <option value="">-- Aucun fournisseur rattaché --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Purchase Calculator Card */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Calculateur d'Achat Global
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Prix d'achat global (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Quantité achetée ({unit})</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-200 flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium">Coût de revient automatique :</span>
                  <span className="text-amber-700 font-bold text-sm">
                    {formatCostPerUnit(liveCostPerUnit, unit)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Initial ({unit})</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alerte Stock Bas ({unit})</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(false)}
                  className="glass-button px-4 py-2 rounded-xl text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Enregistrer la matière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Nouveau Fournisseur
            </h2>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du Fournisseur *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Huilerie Bio Provence"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Contact</label>
                  <input
                    type="email"
                    placeholder="contact@fournisseur.fr"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="+33 4 00 00 00 00"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Site Web</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={supWebsite}
                  onChange={(e) => setSupWebsite(e.target.value)}
                  className="glass-input w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="glass-button px-4 py-2 rounded-xl text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Créer le fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
