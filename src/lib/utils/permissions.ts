import { PlanTier } from '../types/craft';

export type FeatureKey =
  | 'pos'
  | 'compliance'
  | 'batches'
  | 'orders'
  | 'finances'
  | 'unlimited_materials'
  | 'unlimited_products';

export interface PlanConfig {
  name: string;
  badge: string;
  price: string;
  period: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  features: string[];
  maxMaterials: number; // Infinity for unlimited
  maxProducts: number; // Infinity for unlimited
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  starter: {
    name: 'Starter',
    badge: '🌱 Starter',
    price: '9€',
    period: '/ mois',
    color: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
    description: 'Idéal pour démarrer la gestion de stock & recettes simples.',
    features: [
      'Jusqu\'à 15 matières premières',
      'Jusqu\'à 5 produits & formules',
      'Calcul automatique du coût de revient',
      'Alertes de stock minimum',
    ],
    maxMaterials: 15,
    maxProducts: 5,
  },
  pro: {
    name: 'Artisan Pro',
    badge: '🧼 Pro',
    price: '19€',
    period: '/ mois',
    color: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    bgColor: 'bg-indigo-50',
    description: 'Pour les ateliers actifs qui gèrent la fabrication et les commandes.',
    features: [
      'Matières premières & Fournisseurs illimités',
      'Produits & Recettes illimités',
      'Suivi des fournées de fabrication & cure (Kanban 28j)',
      'Carnet de commandes B2B & B2C',
      'Suivi financier & charges d\'exploitation',
    ],
    maxMaterials: Infinity,
    maxProducts: Infinity,
  },
  expert: {
    name: 'Expert Tout-Inclus',
    badge: '⭐ Expert',
    price: '29€',
    period: '/ mois',
    color: 'text-amber-800',
    borderColor: 'border-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    description: 'L\'expérience complète avec Caisse Tactile pour marchés & Conformité DIP/INCI.',
    features: [
      'Tout du Plan Artisan Pro',
      '🛒 Caisse tactile Stand & Marché (POS)',
      '🛡️ Module Conformité Cosmétique (INCI, 26 Allergènes, FDS/CLP)',
      'Impression d\'étiquettes & fiches laboratoire DIP',
      'Rapports de rentabilité & exports avancés',
      'Support prioritaire atelier',
    ],
    maxMaterials: Infinity,
    maxProducts: Infinity,
  },
};

export function hasFeatureAccess(planTier: PlanTier = 'expert', feature: FeatureKey): boolean {
  if (planTier === 'expert') return true;

  if (planTier === 'pro') {
    return feature !== 'pos' && feature !== 'compliance';
  }

  // starter plan
  return feature === 'unlimited_materials' ? false : feature === 'unlimited_products' ? false : false;
}

export function canAddMaterial(planTier: PlanTier = 'expert', currentCount: number): boolean {
  const max = PLAN_CONFIGS[planTier]?.maxMaterials || Infinity;
  return currentCount < max;
}

export function canAddProduct(planTier: PlanTier = 'expert', currentCount: number): boolean {
  const max = PLAN_CONFIGS[planTier]?.maxProducts || Infinity;
  return currentCount < max;
}
