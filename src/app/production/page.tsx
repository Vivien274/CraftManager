'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Hourglass,
  Plus,
  Calendar,
  CheckCircle2,
  Archive,
  Sparkles,
  AlertCircle,
  X,
  Pencil,
  Save,
  Clock,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { calculateCuringStatus } from '@/lib/utils/calculator';
import { ProductionBatch } from '@/lib/types/craft';

export default function ProductionPage() {
  const {
    isLoaded,
    organisation,
    batches,
    products,
    addProductionBatch,
    updateBatchStatus,
    updateProductionBatch,
  } = useCraftStore();

  // Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityProduced, setQuantityProduced] = useState<number>(50);
  const [productionDate, setProductionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customCuringDays, setCustomCuringDays] = useState<number>(28);
  const [customCuringEndDate, setCustomCuringEndDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Editing Modal State
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editProdDate, setEditProdDate] = useState('');
  const [editCureEndDate, setEditCureEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<ProductionBatch['status']>('curing');
  const [editNotes, setEditNotes] = useState('');

  // Sync selectedProductId & customCuringDays when product changes
  useEffect(() => {
    if (products.length > 0) {
      if (!selectedProductId || !products.some((p) => p.id === selectedProductId)) {
        const firstP = products[0];
        setSelectedProductId(firstP.id);
        setCustomCuringDays(firstP.curing_days || 28);
      }
    } else {
      setSelectedProductId('');
    }
  }, [products, selectedProductId]);

  // Recalculate end date whenever productionDate or customCuringDays changes in creation modal
  useEffect(() => {
    if (productionDate && customCuringDays >= 0) {
      const pDate = new Date(productionDate);
      if (!isNaN(pDate.getTime())) {
        const eDate = new Date(pDate.getTime() + customCuringDays * 86400000);
        setCustomCuringEndDate(eDate.toISOString().split('T')[0]);
      }
    }
  }, [productionDate, customCuringDays]);

  if (!isLoaded) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Chargement du Kanban de production...</div>;
  }

  const curingTerm = 'Cure & Séchage des Savons';
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Group Batches by Status
  const curingBatches = batches.filter((b) => b.status === 'curing');
  const readyBatches = batches.filter((b) => b.status === 'ready');
  const archivedBatches = batches.filter((b) => b.status === 'archived');

  const handleOpenAddModal = () => {
    setErrorMessage('');
    const targetP = products.find((p) => p.id === selectedProductId) || products[0];
    if (targetP) {
      setSelectedProductId(targetP.id);
      setCustomCuringDays(targetP.curing_days || 28);
    }
    setIsAddModalOpen(true);
  };

  const handleProductSelection = (prodId: string) => {
    setSelectedProductId(prodId);
    setErrorMessage('');
    const p = products.find((prod) => prod.id === prodId);
    if (p) {
      setCustomCuringDays(p.curing_days || 28);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (products.length === 0) {
      setErrorMessage('Aucun produit disponible. Veuillez d\'abord créer un produit.');
      return;
    }

    if (!selectedProductId) {
      setErrorMessage('Veuillez sélectionner un produit à fabriquer.');
      return;
    }

    if (!quantityProduced || Number(quantityProduced) <= 0) {
      setErrorMessage('La quantité produite doit être supérieure à 0.');
      return;
    }

    if (!productionDate) {
      setErrorMessage('Veuillez spécifier la date de fabrication.');
      return;
    }

    await addProductionBatch({
      product_id: selectedProductId,
      batch_number: `LOT-2026-${String(batches.length + 1).padStart(3, '0')}`,
      quantity_produced: Number(quantityProduced),
      production_date: productionDate,
      curing_end_date: customCuringEndDate || productionDate,
      status: 'curing',
      notes,
    });

    setIsAddModalOpen(false);
    setNotes('');
    setErrorMessage('');
  };

  // Open Edit Modal for a Batch
  const handleOpenEditModal = (batch: ProductionBatch) => {
    setEditingBatch(batch);
    setEditBatchNumber(batch.batch_number);
    setEditQuantity(batch.quantity_produced);
    setEditProdDate(batch.production_date);
    setEditCureEndDate(batch.curing_end_date);
    setEditStatus(batch.status);
    setEditNotes(batch.notes || '');
  };

  const handleSaveEditBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    await updateProductionBatch(editingBatch.id, {
      batch_number: editBatchNumber,
      quantity_produced: Number(editQuantity),
      production_date: editProdDate,
      curing_end_date: editCureEndDate,
      status: editStatus,
      notes: editNotes,
    });

    setEditingBatch(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              {organisation.craft_type}
            </span>
            <span className="text-xs text-slate-500 font-medium">{curingTerm}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Hourglass className="w-7 h-7 text-indigo-600" />
            Suivi Kanban de Production & {curingTerm}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivez en direct l'avancement de vos lots d'atelier et personnalisez vos temps de séchage.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Lancer une Nouvelle Fabrication / Lot
        </button>
      </div>

      {/* Kanban Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: En Cure / Séchage 🟡 */}
        <div className="glass-panel rounded-2xl p-4 border border-amber-300 bg-amber-50/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-bold text-amber-950 text-base">{curingTerm}</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
              {curingBatches.length}
            </span>
          </div>

          <div className="space-y-4">
            {curingBatches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Aucun lot en cure actuellement.</div>
            ) : (
              curingBatches.map((batch) => {
                const product = products.find((p) => p.id === batch.product_id) || batch.product;
                const curingInfo = calculateCuringStatus(
                  batch.production_date,
                  product?.curing_days || 28
                );

                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-md relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            {batch.batch_number}
                          </span>
                          <button
                            onClick={() => handleOpenEditModal(batch)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Modifier ce lot"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{product?.name || batch.product_name || 'Savon'}</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {batch.quantity_produced} unités
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-500">Progression cure</span>
                        <span className="text-amber-700 font-bold">
                          {curingInfo.isReady ? 'Cure terminée !' : `J-${curingInfo.daysLeft} restants`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${curingInfo.progressPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between pt-0.5">
                        <span>Fabriqué le {batch.production_date}</span>
                        <span>Fin : {batch.curing_end_date || curingInfo.curingEndDateStr}</span>
                      </div>
                    </div>

                    {batch.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 italic">
                        "{batch.notes}"
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateBatchStatus(batch.id, 'ready')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Transférer en Stock 🟢
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(batch)}
                        className="p-2 glass-button text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition"
                        title="Modifier les détails du lot"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Prêt à la Vente 🟢 */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-300 bg-emerald-50/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-emerald-950 text-base">Prêt à la Vente</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
              {readyBatches.length}
            </span>
          </div>

          <div className="space-y-4">
            {readyBatches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Aucun lot prêt.</div>
            ) : (
              readyBatches.map((batch) => {
                const product = products.find((p) => p.id === batch.product_id) || batch.product;

                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-md relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {batch.batch_number}
                          </span>
                          <button
                            onClick={() => handleOpenEditModal(batch)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Modifier ce lot"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{product?.name || batch.product_name}</h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">
                        {batch.quantity_produced} u dispo
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Stock disponible en Caisse
                      </span>
                      <span className="text-[10px] text-slate-400">Fin cure: {batch.curing_end_date}</span>
                    </div>

                    {batch.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 italic">
                        "{batch.notes}"
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateBatchStatus(batch.id, 'archived')}
                        className="flex-1 glass-button py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs flex items-center justify-center gap-1.5 transition font-semibold"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archiver ce lot
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(batch)}
                        className="p-1.5 glass-button text-slate-600 hover:text-indigo-600 rounded-lg transition"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Épuisé / Archivé 🔴 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <h2 className="font-bold text-slate-800 text-base">Archivés / Épuisés</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {archivedBatches.length}
            </span>
          </div>

          <div className="space-y-4">
            {archivedBatches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Aucun lot archivé.</div>
            ) : (
              archivedBatches.map((batch) => {
                const product = products.find((p) => p.id === batch.product_id) || batch.product;

                return (
                  <div
                    key={batch.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {batch.batch_number}
                          </span>
                          <button
                            onClick={() => handleOpenEditModal(batch)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition"
                            title="Modifier ce lot"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm mt-1">{product?.name || batch.product_name}</h3>
                      </div>
                      <span className="text-xs text-slate-500">{batch.quantity_produced} u prod.</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal: New Batch */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Lancer une Nouvelle Production
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {products.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-3">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Aucun produit disponible
                </p>
                <p className="text-slate-600">
                  Vous devez d'abord créer au moins un produit dans votre catalogue avant de pouvoir enregistrer une fournée de production.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow transition"
                >
                  Accéder à la gestion des produits →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sélectionner le Produit *</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => handleProductSelection(e.target.value)}
                    className="glass-input w-full bg-white font-medium"
                  >
                    {!selectedProductId && <option value="">-- Sélectionner un produit --</option>}
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.curing_days}j cure)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Quantité Produite *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantityProduced}
                      onChange={(e) => setQuantityProduced(Number(e.target.value))}
                      className="glass-input w-full font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date de Fabrication *</label>
                    <input
                      type="date"
                      required
                      value={productionDate}
                      onChange={(e) => setProductionDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                {/* Customizable Curing Duration & End Date */}
                <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-950 space-y-3">
                  <div className="font-extrabold flex items-center justify-between text-xs text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Personnalisation du Séchage / Cure :
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Durée (en jours)</label>
                      <input
                        type="number"
                        min="0"
                        value={customCuringDays}
                        onChange={(e) => setCustomCuringDays(Number(e.target.value))}
                        className="glass-input w-full bg-white font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Fin de Cure</label>
                      <input
                        type="date"
                        value={customCuringEndDate}
                        onChange={(e) => {
                          setCustomCuringEndDate(e.target.value);
                          if (productionDate && e.target.value) {
                            const pD = new Date(productionDate).getTime();
                            const eD = new Date(e.target.value).getTime();
                            if (eD >= pD) {
                              setCustomCuringDays(Math.round((eD - pD) / 86400000));
                            }
                          }
                        }}
                        className="glass-input w-full bg-white font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notes du lot (optionnel)</label>
                  <textarea
                    rows={2}
                    placeholder="ex: Température ambiante 21°C, pH testé à 8.5, ingrédients..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="glass-button px-4 py-2 rounded-xl text-slate-700 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md transition cursor-pointer"
                  >
                    Créer le lot
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Editing Modal: Existing / Imported Batch */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                Modifier le Lot de Production
              </h2>
              <button
                onClick={() => setEditingBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Numéro de Lot *</label>
                <input
                  type="text"
                  required
                  value={editBatchNumber}
                  onChange={(e) => setEditBatchNumber(e.target.value)}
                  className="glass-input w-full font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité Produite *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className="glass-input w-full font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statut du Lot</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProductionBatch['status'])}
                    className="glass-input w-full font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="curing">🟡 En Cure / Séchage</option>
                    <option value="ready">🟢 Prêt à la Vente</option>
                    <option value="archived">⚪ Archivé / Épuisé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date de Fabrication *</label>
                  <input
                    type="date"
                    required
                    value={editProdDate}
                    onChange={(e) => setEditProdDate(e.target.value)}
                    className="glass-input w-full text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date Fin de Cure *</label>
                  <input
                    type="date"
                    required
                    value={editCureEndDate}
                    onChange={(e) => setEditCureEndDate(e.target.value)}
                    className="glass-input w-full text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes & Traçabilité Ingrédients</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="glass-input w-full text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="glass-button px-4 py-2 rounded-xl text-slate-700 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
