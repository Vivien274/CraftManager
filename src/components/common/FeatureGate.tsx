'use client';

import { useState } from 'react';
import { Lock, Sparkles, Crown, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { FeatureKey, hasFeatureAccess, PLAN_CONFIGS } from '@/lib/utils/permissions';
import PricingModal from '../pricing/PricingModal';
import { PlanTier } from '@/lib/types/craft';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiredTier?: PlanTier;
}

export default function FeatureGate({
  feature,
  children,
  title,
  description,
  requiredTier = 'expert',
}: FeatureGateProps) {
  const { organisation } = useCraftStore();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const currentTier: PlanTier = organisation.plan_tier || 'expert';

  const hasAccess = hasFeatureAccess(currentTier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const reqConfig = PLAN_CONFIGS[requiredTier];

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      {/* Blurred background preview */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-sm overflow-hidden select-none">
        {children}
      </div>

      {/* Lock Card Overlay */}
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-amber-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            Réservé à la Formule {reqConfig.name}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {title || `Débloquez l'accès à cette fonctionnalité`}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {description ||
              `Cette fonctionnalité avancée fait partie de l'offre ${reqConfig.name}. Surclassez votre atelier pour l'activer instantanément.`}
          </p>
        </div>

        {/* Feature Teaser List */}
        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 text-left space-y-2 text-xs">
          <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Ce que cette formule débloque pour vous :
          </span>
          <ul className="space-y-1.5 text-slate-700 font-semibold pl-2">
            {reqConfig.features.slice(1, 5).map((f, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Upgrade Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setIsPricingOpen(true)}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span>Passer à la Formule {reqConfig.name} ({reqConfig.price}/mois)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-400 font-medium">
            Changement instantané et sans engagement
          </p>
        </div>
      </div>

      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
}
