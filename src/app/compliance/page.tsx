'use client';

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  Flame,
  Info,
  Layers,
  Check,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import {
  generateINCIFormula,
  calculateProductAllergens,
  generateCLPDetails,
} from '@/lib/utils/compliance';

export default function CompliancePage() {
  const { isLoaded, products, rawMaterials, batches } = useCraftStore();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'inci' | 'allergens' | 'clp' | 'label'>('inci');
  const [copiedText, setCopiedText] = useState(false);

  const rawMaterialsMap = useMemo(() => {
    const map: Record<string, (typeof rawMaterials)[0]> = {};
    rawMaterials.forEach((rm) => {
      map[rm.id] = rm;
    });
    return map;
  }, [rawMaterials]);

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
        Chargement du module de conformité Savonnerie...
      </div>
    );
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const inciFormula = selectedProduct
    ? generateINCIFormula(selectedProduct, rawMaterialsMap)
    : { inciItems: [], inciFormattedString: '', totalRecipeWeightGrams: 0 };

  const allergens = selectedProduct
    ? calculateProductAllergens(selectedProduct, rawMaterialsMap, 0.001)
    : [];

  const clpDetails = selectedProduct
    ? generateCLPDetails(selectedProduct, rawMaterialsMap)
    : { hPhrases: [], pPhrases: [], pictograms: [], afnorRules: [] };

  const productBatches = batches.filter((b) => b.product_id === selectedProduct?.id);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              Règlement CE 1223/2009 • Savonnerie Artisanale
            </span>
            <span className="text-xs text-slate-500 font-medium">Dossier de Information Produit (DIP)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Conformité Savonnerie, Formules INCI & Allergènes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Génération automatique de la liste INCI officielle, détection des 26 allergènes cosmétiques et étiquetage légal.
          </p>
        </div>

        {/* Product Selector Dropdown */}
        <div className="w-full sm:w-auto">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Sélectionner un Savon / Produit
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="glass-input font-bold text-slate-800 bg-white w-full sm:w-72 border-slate-300"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inci')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'inci'
              ? 'border-indigo-600 text-indigo-900 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Formule INCI Officielle & Ordonnancement
        </button>
        <button
          onClick={() => setActiveTab('allergens')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'allergens'
              ? 'border-amber-500 text-amber-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Analyse des 26 Allergènes Parfumants
        </button>
        <button
          onClick={() => setActiveTab('label')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'label'
              ? 'border-emerald-600 text-emerald-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          Aperçu d'Étiquette Réglementaire Savon
        </button>
        <button
          onClick={() => setActiveTab('clp')}
          className={`px-5 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'clp'
              ? 'border-purple-600 text-purple-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 text-purple-600" />
          Conformité Bougies & CLP
        </button>
      </div>

      {/* TAB 1: FORMULE INCI */}
      {activeTab === 'inci' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Règlement CE 1223/2009 - Article 19
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Formule INCI Légalement Ordonnée</h2>
              </div>
              <button
                onClick={() => handleCopy(inciFormula.inciFormattedString)}
                className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 transition"
              >
                {copiedText ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedText ? 'Copié !' : 'Copier la formule INCI'}
              </button>
            </div>

            <div className="bg-slate-900 text-amber-300 font-mono text-xs p-4 rounded-xl border border-slate-800 leading-relaxed select-all">
              <span className="text-slate-400 select-none block mb-1 font-sans text-[10px] uppercase font-bold">
                INGREDIENTS (À imprimer sur l'emballage) :
              </span>
              {inciFormula.inciFormattedString}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Substance INCI Officielle</th>
                    <th className="px-4 py-3">Nom Usuel / Matière</th>
                    <th className="px-4 py-3 text-right">Poids en Recette</th>
                    <th className="px-4 py-3 text-right">Pourcentage (%)</th>
                    <th className="px-4 py-3 text-center">Règle Tri INCI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {inciFormula.inciItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.inciName}</td>
                      <td className="px-4 py-3 text-slate-600">{item.commonName}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{item.weightGrams.toFixed(1)} g</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-700">{item.percentage.toFixed(2)} %</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.percentage > 1
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.percentage > 1 ? '> 1% (Ordre Décroissant)' : '<= 1% (Ordre Libre)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Traceability Batches */}
          <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Traçabilité du Dossier DIP (Lots Fabriqués)
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Numéro de Lot</th>
                    <th className="px-4 py-3">Date de Fabrication</th>
                    <th className="px-4 py-3">Quantité</th>
                    <th className="px-4 py-3">Statut Cure</th>
                    <th className="px-4 py-3">Validité DIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.batch_number}</td>
                      <td className="px-4 py-3 text-slate-600">{b.production_date}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{b.quantity_produced} savons</td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-bold text-slate-700">{b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          ✓ Dossier DIP Conforme
                        </span>
                      </td>
                    </tr>
                  ))}
                  {productBatches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500 italic">
                        Aucun lot encore créé pour ce savon.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALLERGENS */}
      {activeTab === 'allergens' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              Analyse des 26 Allergènes Cosmétiques Réglementés (Huiles Essentielles)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            En cosmétique rincée (ex: Savons à froid), tout allergène présent à plus de{' '}
            <strong className="text-slate-800">0.001% (10 ppm)</strong> dans le produit fini doit obligatoirement figurer sur l'étiquette.
          </p>

          {allergens.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Aucun allergène détecté dans la formule de ce savon (Sans parfum / Sans Huile Essentielle).</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allergens.map((alg) => (
                <div
                  key={alg.name}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    alg.isMandatoryOnLabel
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{alg.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      Concentration dans le savon :{' '}
                      <strong className="text-slate-800">{alg.percentageInProduct.toFixed(4)} %</strong>
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      alg.isMandatoryOnLabel
                        ? 'bg-amber-200 text-amber-900 border border-amber-300 shadow-sm'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {alg.isMandatoryOnLabel ? '⚠️ Déclaration Obligatoire' : 'Sous le Seuil (Libre)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LABEL PREVIEW */}
      {activeTab === 'label' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Aperçu de l'Étiquette Réglementaire Savon
            </h2>
            <button
              onClick={() => window.print()}
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-indigo-500 transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer l'Étiquette
            </button>
          </div>

          <div className="border-2 border-slate-900 p-6 rounded-2xl bg-white max-w-lg mx-auto text-slate-900 space-y-3 shadow-lg">
            <div className="border-b-2 border-slate-900 pb-2 text-center">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">SAVONNERIE ARTISANALE - SAPONIFICATION À FROID</span>
              <h3 className="text-xl font-black mt-0.5">{selectedProduct?.name}</h3>
              <span className="text-xs font-bold text-indigo-900">Fabriqué en France • Savon Surgras</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <strong className="block text-slate-900 font-bold uppercase text-[10px]">INGRÉDIENTS (INCI) :</strong>
                <p className="font-mono text-[11px] leading-snug text-slate-800">{inciFormula.inciFormattedString}</p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <strong className="block text-slate-900">Poids Net à l'emballage : 100g</strong>
                  <span className="text-slate-500">PAO : 12M 🧴</span>
                </div>
                <div className="text-right font-mono">
                  <span className="block font-bold">LOT : LOT-2026-012</span>
                  <span className="text-[10px] text-slate-500">L'Atelier des Restanques</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLP FOR CANDLES */}
      {activeTab === 'clp' && (
        <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Étiquette CLP & Conseils Sécurité AFNOR (Bougies / Senteurs)
          </h2>
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-xs">
            <div className="text-amber-400 font-bold uppercase text-[11px]">Pictogrammes requis : GHS07 (Sensibilisant), GHS09 (Environnement)</div>
            <p>H317 : Peut provoquer une allergie cutanée.</p>
            <p>P102 : Tenir hors de portée des enfants.</p>
          </div>
        </div>
      )}
    </div>
  );
}
