'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Boxes,
  BookOpenCheck,
  Hourglass,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Play,
  Zap,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: '1. Enregistrer vos Matières Premières',
    subtitle: 'Huiles végétales, beurres, soude & huiles essentielles',
    icon: Boxes,
    color: 'from-amber-500 to-orange-500',
    description:
      'Commencez par ajouter vos corps gras (Huile d\'Olive, Karité, Coco), votre réactif de saponification (Lessive de Soude) et vos parfums/HE avec leur prix d\'achat et stock initial.',
    href: '/raw-materials',
    actionText: 'Gérer les Matières Premières',
    tip: '💡 Astuce : Le coût au gramme est calculé automatiquement pour alimenter vos coûts de revient.',
  },
  {
    title: '2. Créer vos Formules & Recettes de Savon',
    subtitle: 'Pourcentage de surgraissage & ordonnancement INCI',
    icon: BookOpenCheck,
    color: 'from-indigo-600 to-purple-600',
    description:
      'Formulez vos savons à froid en définissant le pourcentage d\'ingrédients, le surgraissage (ex: 8%) et le temps de cure (ex: 28 jours).',
    href: '/products',
    actionText: 'Créer une Formule & Savon',
    tip: '💡 Astuce : L\'application génère automatiquement la liste INCI officielle par ordre décroissant de concentration.',
  },
  {
    title: '3. Suivre vos Lots de Fabrication & Cure',
    subtitle: 'Kanban temps réel & transfert automatique en stock',
    icon: Hourglass,
    color: 'from-teal-600 to-emerald-600',
    description:
      'Suivez l\'avancement de vos fournées de savons (En Cure vs Prêt). Dès que la cure de 28 jours s\'achève, les savons sont automatiquement transférés dans votre stock vente !',
    href: '/production',
    actionText: 'Accéder au Suivi de Cure',
    tip: '💡 Astuce : Un décompte visuel de la cure vous alerte quand un lot est bon à emballer.',
  },
  {
    title: '4. Valider le DIP & les Étiquettes Réglementaires',
    subtitle: 'Règlement CE 1223/2009 & 26 Allergènes',
    icon: ShieldCheck,
    color: 'from-blue-600 to-cyan-600',
    description:
      'Vérifiez la conformité cosmétique de vos savons, contrôlez la présence d\'allergènes étiquetables (> 0.001%) et imprimez la maquette d\'étiquette légale pour le laboratoire DIP.',
    href: '/compliance',
    actionText: 'Vérifier la Conformité DIP',
    tip: '💡 Astuce : Les alertes vous indiquent les substances à déclarer obligatoirement sur l\'emballage.',
  },
  {
    title: '5. Encaisser sur les Marchés avec la Caisse Tactile',
    subtitle: 'Calculateur de monnaie & déstockage automatique',
    icon: ShoppingBag,
    color: 'from-amber-600 to-rose-600',
    description:
      'Sur vos stands de marchés ou à l\'atelier, encaissez en 2 clics (Espèces, CB, QR Paylib) et laissez la caisse calculer la monnaie à rendre et déstocker vos savons en direct !',
    href: '/pos',
    actionText: 'Ouvrir la Caisse Tactile',
    tip: '💡 Astuce : Utilisez les boutons rapides 10€ / 20€ / 50€ pour rendre la monnaie instantanément.',
  },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { addRawMaterial, addProduct, addProductionBatch } = useCraftStore();
  const [loadedDemo, setLoadedDemo] = useState(false);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  const handleLoadDemoStarterKit = async () => {
    // Populate standard starter materials for Savonnerie
    await addRawMaterial({
      name: "Huile d'Olive Vierge Extra BIO",
      category: 'Huiles Végétales',
      unit: 'g',
      purchase_price: 48.0,
      purchase_quantity: 5000,
      stock_quantity: 10000,
      min_stock_alert: 2000,
    });

    await addRawMaterial({
      name: 'Beurre de Karité Brut BIO',
      category: 'Beurres',
      unit: 'g',
      purchase_price: 24.0,
      purchase_quantity: 1000,
      stock_quantity: 3000,
      min_stock_alert: 800,
    });

    await addRawMaterial({
      name: 'Lessive de Soude 30%',
      category: 'Saponification',
      unit: 'g',
      purchase_price: 8.5,
      purchase_quantity: 1000,
      stock_quantity: 4000,
      min_stock_alert: 1000,
    });

    await addProduct({
      name: "Savon Pur Olive & Karité (100g)",
      category: 'Savons à Froid',
      sku: 'SAV-OLIV-100',
      selling_price: 7.5,
      packaging_cost: 0.45,
      extra_costs: 0.3,
      curing_days: 28,
      stock_quantity: 24,
    });

    setLoadedDemo(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Didacticiel Savonnerie</h2>
              <p className="text-[11px] text-slate-500">Guide de prise en main pas à pas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Stepper Indicator */}
        <div className="flex items-center justify-between gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-indigo-600 ring-2 ring-indigo-600/30'
                  : idx < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Card Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shrink-0 shadow-lg`}
            >
              <StepIcon className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Étape {currentStep + 1} sur {STEPS.length}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{step.title}</h3>
              <p className="text-xs font-semibold text-slate-500">{step.subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {step.description}
          </p>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium flex items-center gap-2">
            <span>{step.tip}</span>
          </div>

          {/* Quick Demo Template Loader */}
          {currentStep === 0 && (
            <div className="pt-1">
              <button
                onClick={handleLoadDemoStarterKit}
                disabled={loadedDemo}
                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                {loadedDemo ? '✓ Ingrédients Exemple Injectés !' : 'Charger un Kit Ingrédients Exemple Savonnerie'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-700 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={step.href}
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1"
            >
              <span>{step.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Terminer le Guide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
