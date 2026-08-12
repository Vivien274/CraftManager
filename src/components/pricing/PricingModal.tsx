'use client';

import { useState } from 'react';
import { Sparkles, Check, Zap, ShieldCheck, X, Crown, ArrowRight } from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { PLAN_CONFIGS } from '@/lib/utils/permissions';
import { PlanTier } from '@/lib/types/craft';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { organisation, updateOrganisation } = useCraftStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const currentTier: PlanTier = organisation.plan_tier || 'expert';

  if (!isOpen) return null;

  const handleSelectPlan = async (tier: PlanTier) => {
    setLoadingTier(tier);
    try {
      await updateOrganisation({ plan_tier: tier });
      setTimeout(() => {
        setLoadingTier(null);
        onClose();
      }, 600);
    } catch (e) {
      console.error(e);
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 my-8 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Formules & Abonnements</h2>
              <p className="text-xs font-semibold text-slate-500">Choisissez le palier adapté à votre Atelier Artisan</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Toggle (Monthly / Annual) */}
        <div className="flex items-center justify-center gap-3 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto border border-slate-200">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              !isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paiement mensuel
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              isAnnual ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Paiement annuel</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-300">
              -20% gratuit
            </span>
          </button>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {(['starter', 'pro', 'expert'] as PlanTier[]).map((tier) => {
            const config = PLAN_CONFIGS[tier];
            const isCurrent = currentTier === tier;
            const isExpert = tier === 'expert';
            const isPro = tier === 'pro';

            const monthlyPrice = tier === 'starter' ? 9 : tier === 'pro' ? 19 : 29;
            const finalPrice = isAnnual ? Math.round(monthlyPrice * 0.8) : monthlyPrice;

            return (
              <div
                key={tier}
                className={`relative rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-6 ${
                  isCurrent
                    ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-xl bg-gradient-to-b from-indigo-50/30 to-white'
                    : isExpert
                    ? 'border-amber-300 shadow-lg bg-gradient-to-b from-amber-50/40 via-white to-white hover:border-amber-400'
                    : 'border-slate-200 shadow-md bg-white hover:border-slate-300'
                }`}
              >
                {/* Popular / Recommended Badge */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Le Plus Populaire
                  </div>
                )}
                {isExpert && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-200" /> Tout Inclus
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg text-slate-900">{config.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-300">
                        Plan Actuel
                      </span>
                    )}
                  </div>

                  {/* Price display */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{finalPrice}€</span>
                      <span className="text-xs font-semibold text-slate-500">/ mois</span>
                    </div>
                    {isAnnual && (
                      <span className="text-[10px] text-emerald-700 font-bold">
                        Facturé {finalPrice * 12}€ / an
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {config.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Ce qui est inclus :
                    </span>
                    <ul className="space-y-2">
                      {config.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isExpert ? 'text-amber-600' : 'text-emerald-600'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Selection Action Button */}
                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-extrabold text-xs bg-slate-100 text-slate-500 border border-slate-200 cursor-default"
                    >
                      ✓ Formule Actuelle
                    </button>
                  ) : (
                    <button
                      disabled={loadingTier === tier}
                      onClick={() => handleSelectPlan(tier)}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                        isExpert
                          ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:opacity-95 text-white shadow-amber-500/20'
                          : isPro
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {loadingTier === tier ? (
                        <span>Changement en cours...</span>
                      ) : (
                        <>
                          <span>{tier === 'expert' ? 'Choisir la Formule Expert' : `Passer à l'offre ${config.name}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sans engagement de durée. Changez ou résiliez votre formule à tout moment en 1 clic.</span>
        </div>
      </div>
    </div>
  );
}
