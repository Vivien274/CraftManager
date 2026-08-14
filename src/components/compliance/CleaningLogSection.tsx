'use client';

import { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Printer,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  FileText,
  Zap,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { CleaningLog, CleaningActionType } from '@/lib/types/craft';

export default function CleaningLogSection() {
  const { organisation, cleaningLogs, addCleaningLog, deleteCleaningLog } = useCraftStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
  const [zone, setZone] = useState('Plan de travail principal & pesée');
  const [actionType, setActionType] = useState<CleaningActionType>('disinfection');
  const [productUsed, setProductUsed] = useState('Alcool isopropylique 70%');
  const [operator, setOperator] = useState('Thomas Laurent');
  const [notes, setNotes] = useState('');

  const filteredLogs = cleaningLogs.filter((log) => {
    const matchesAction = selectedActionFilter === 'all' || log.action_type === selectedActionFilter;
    const matchesSearch =
      log.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.product_used.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleQuickClean = () => {
    addCleaningLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      zone: 'Plan de travail principal & ustensiles',
      action_type: 'disinfection',
      product_used: 'Alcool isopropylique 70%',
      operator: 'Thomas Laurent',
      status: 'verified',
      notes: 'Nettoyage et désinfection rapide automatique après fournée de fabrication.',
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCleaningLog({
      date,
      time,
      zone,
      action_type: actionType,
      product_used: productUsed,
      operator,
      status: 'verified',
      notes,
    });

    // Reset notes and close modal
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handlePrintRegistry = () => {
    window.print();
  };

  const getActionBadge = (type: CleaningActionType) => {
    switch (type) {
      case 'disinfection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
            🧪 Désinfection ISO 22716
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            🧼 Nettoyage Régulier
          </span>
        );
      case 'deep_clean':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            🧹 Grand Nettoyage
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
            ⚙️ Entretien matériel
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions - Screen only */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm border border-slate-200 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🧹</span> Carnet de Nettoyage & Désinfection
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Registre Sanitaire BPF ISO 22716 — Suivi des zones, désinfections et produits utilisés
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleQuickClean}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            title="Consigne immédiatement un nettoyage rapide du plan de travail à l'alcool 70%"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Nettoyage Rapide (1 Clic)</span>
          </button>

          <button
            onClick={handlePrintRegistry}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer Registre BPF</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Consigner une Intervention</span>
          </button>
        </div>
      </div>

      {/* Printable Registry Header - Print mode only */}
      <div className="hidden print:block p-4 border-b-2 border-slate-900 text-slate-900 space-y-1 mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight">
          REGISTRE DE NETTOYAGE ET DÉSINFECTION - BPF ISO 22716
        </h1>
        <p className="text-xs font-bold">
          {organisation.name} {organisation.siret ? `— SIRET : ${organisation.siret}` : ''}
        </p>
        <p className="text-xs text-slate-600">
          Document sanitaire officiel pour les contrôles réglementaires (DDPP / DGCCRF).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Interventions</p>
            <p className="text-lg font-black text-slate-900">{cleaningLogs.length} nettoyages</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Statut Sanitaire Atelier</p>
            <p className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-fit mt-0.5">
              100% Conforme ISO 22716 🟢
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Dernier Nettoyage</p>
            <p className="text-xs font-bold text-slate-800">
              {cleaningLogs[0]?.date ? `${cleaningLogs[0].date} (${cleaningLogs[0].time || ''})` : 'Aucun'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar - Screen only */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-2xl border border-slate-200 print:hidden text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1 pl-2">
            <Filter className="w-3.5 h-3.5" /> Type :
          </span>
          <button
            onClick={() => setSelectedActionFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedActionFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({cleaningLogs.length})
          </button>
          <button
            onClick={() => setSelectedActionFilter('disinfection')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedActionFilter === 'disinfection'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧪 Désinfections
          </button>
          <button
            onClick={() => setSelectedActionFilter('cleaning')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedActionFilter === 'cleaning'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧼 Nettoyages
          </button>
          <button
            onClick={() => setSelectedActionFilter('deep_clean')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedActionFilter === 'deep_clean'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧹 Grands Nettoyages
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une zone, un produit, un opérateur..."
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Date & Heure</th>
              <th className="py-3 px-4">Zone / Ustensile Nettoyé</th>
              <th className="py-3 px-4">Type d'Action</th>
              <th className="py-3 px-4">Produit Utilisé</th>
              <th className="py-3 px-4">Opérateur</th>
              <th className="py-3 px-4">Remarques / Conformité</th>
              <th className="py-3 px-4 text-right print:hidden">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  Aucune intervention enregistrée pour le moment.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.date}</span>
                    </div>
                    {log.time && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                        <Clock className="w-3 h-3" />
                        <span>{log.time}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {log.zone}
                  </td>

                  <td className="py-3.5 px-4">
                    {getActionBadge(log.action_type)}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {log.product_used}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.operator}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 italic">
                    {log.notes || <span className="text-slate-400 font-normal">Conforme</span>}
                  </td>

                  <td className="py-3.5 px-4 text-right print:hidden">
                    <button
                      onClick={() => deleteCleaningLog(log.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Cleaning Log Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                  🧹
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Consigner un Nettoyage / Désinfection</h3>
                  <p className="text-xs font-semibold text-slate-500">Carnet Sanitaire BPF ISO 22716</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input w-full font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="glass-input w-full font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone / Équipement Nettoyé *</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="glass-input w-full font-bold bg-white text-slate-900 mb-2"
                >
                  <option value="Plan de travail principal & pesée">Plan de travail principal & pesée</option>
                  <option value="Moules à savon & Découpeuse inox">Moules à savon & Découpeuse inox</option>
                  <option value="Cuve de saponification & Mixeur">Cuve de saponification & Mixeur</option>
                  <option value="Sol atelier & Local de fabrication">Sol atelier & Local de fabrication</option>
                  <option value="Étagères de cure 28 jours & Bacs">Étagères de cure 28 jours & Bacs</option>
                  <option value="Matériel de conditionnement & étiquetage">Matériel de conditionnement & étiquetage</option>
                  <option value="Autre matériel / surface sur mesure">Autre zone sur mesure...</option>
                </select>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Intitulé de la zone..."
                  className="glass-input w-full text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type d'Action *</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as CleaningActionType)}
                    className="glass-input w-full font-bold bg-white text-slate-900"
                  >
                    <option value="disinfection">🧪 Désinfection ISO 22716</option>
                    <option value="cleaning">🧼 Nettoyage Régulier</option>
                    <option value="deep_clean">🧹 Grand Nettoyage</option>
                    <option value="maintenance">⚙️ Entretien matériel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Produit Utilisé *</label>
                  <input
                    type="text"
                    required
                    value={productUsed}
                    onChange={(e) => setProductUsed(e.target.value)}
                    placeholder="ex: Alcool 70%, Savon noir..."
                    className="glass-input w-full font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opérateur Responsable *</label>
                <input
                  type="text"
                  required
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="glass-input w-full font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarques & Observations</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ex: Désinfection complète avant début de fabrication du lot #SAV-2026-043..."
                  className="glass-input w-full text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold shadow-md transition cursor-pointer"
                >
                  Enregistrer l'Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
