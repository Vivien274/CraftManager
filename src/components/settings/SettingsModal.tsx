'use client';

import { useState, useEffect } from 'react';
import { Store, User, Coins, Tag, Save, CheckCircle2, X, FileSpreadsheet } from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { createClient } from '@/lib/supabase/client';
import { CraftType, Organisation } from '@/lib/types/craft';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { organisation, updateOrganisation, importTraceabilitySeed } = useCraftStore();
  const [name, setName] = useState(organisation.name || "L'Atelier des Restanques");
  const [craftType, setCraftType] = useState<CraftType>(organisation.craft_type || 'savonnerie');
  const [currency, setCurrency] = useState(organisation.currency || 'EUR');
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setName(organisation.name || "L'Atelier des Restanques");
    setCraftType(organisation.craft_type || 'savonnerie');
    setCurrency(organisation.currency || 'EUR');

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || '');
        if (data.user.user_metadata?.full_name) {
          setFullName(data.user.user_metadata.full_name);
        }
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

          {/* Import Traceability Document Section (Strictly restricted to savonneriecyaness@gmail.com) */}
          {userEmail.toLowerCase() === 'savonneriecyaness@gmail.com' && (
            <div className="pt-3 border-t border-slate-100">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    Importation Traçabilité Atelier
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    55 Lots détectés
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Importer l'historique complet de votre fabrication (55 fournées, 23 formules, 49 ingrédients & 16 fournisseurs).
                </p>
                <button
                  type="button"
                  disabled={importing}
                  onClick={async () => {
                    setImporting(true);
                    const ok = await importTraceabilitySeed();
                    setImporting(false);
                    if (ok) {
                      setSavedSuccess(true);
                      setTimeout(() => {
                        setSavedSuccess(false);
                        onClose();
                      }, 1500);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {importing ? 'Importation des 55 lots en cours...' : '📥 Importer l\'Historique de Traçabilité'}
                </button>
              </div>
            </div>
          )}

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
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5 transition cursor-pointer"
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
