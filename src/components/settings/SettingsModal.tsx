'use client';

import { useState, useEffect } from 'react';
import { Store, User, Coins, Tag, Save, CheckCircle2, X } from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { createClient } from '@/lib/supabase/client';
import { CraftType, Organisation } from '@/lib/types/craft';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { organisation, updateOrganisation } = useCraftStore();
  const [name, setName] = useState(organisation.name || "L'Atelier des Restanques");
  const [craftType, setCraftType] = useState<CraftType>(organisation.craft_type || 'savonnerie');
  const [currency, setCurrency] = useState(organisation.currency || 'EUR');
  const [fullName, setFullName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(organisation.name || "L'Atelier des Restanques");
    setCraftType(organisation.craft_type || 'savonnerie');
    setCurrency(organisation.currency || 'EUR');

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.full_name) {
        setFullName(data.user.user_metadata.full_name);
      }
    });
  }, [organisation, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      await updateOrganisation({
        name,
        craft_type: craftType,
        currency,
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { full_name: fullName, organisation_name: name, craft_type: craftType, currency },
        });
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold border border-amber-300">
              <Store className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Mon Atelier & Profil</h2>
              <p className="text-[11px] font-semibold text-slate-500">Personnalisez votre activité</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-900 font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Modifications de l'Atelier enregistrées !</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom de votre Savonnerie / Atelier *</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom & Prénom de l'Artisan(e)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Spécialité Artisanale</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value as CraftType)}
                  className="glass-input w-full text-slate-900 font-semibold cursor-pointer"
                  style={{ paddingLeft: '2.75rem' }}
                >
                  <option value="savonnerie">🧼 Savonnerie à froid</option>
                  <option value="bougies">🕯️ Bougies & Parfums</option>
                  <option value="ceramique">🏺 Céramique & Poterie</option>
                  <option value="couture">🧵 Couture & Textile</option>
                  <option value="bijouterie">💎 Bijouterie & Joaillerie</option>
                  <option value="apiculture">🐝 Apiculture & Miel</option>
                  <option value="autre">🎨 Autre Création</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Devise Principale</label>
              <div className="relative">
                <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="glass-input w-full text-slate-900 font-semibold cursor-pointer"
                  style={{ paddingLeft: '2.75rem' }}
                >
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="CHF">CHF Franc Suisse</option>
                  <option value="CAD">$ Dollar Canadien</option>
                  <option value="GBP">£ Livre Sterling</option>
                  <option value="USD">$ Dollar US</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
