'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Sparkles, AlertCircle, CheckCircle2, Store, User, Mail, Lock, Tag, Coins } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [organisationName, setOrganisationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [craftType, setCraftType] = useState('savonnerie');
  const [currency, setCurrency] = useState('EUR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            organisation_name: organisationName,
            full_name: fullName,
            craft_type: craftType,
            currency: currency,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Erreur lors de la création du compte.');
      } else {
        setSuccessMsg(
          'Compte et Atelier créés avec succès ! Redirection vers votre tableau de bord...'
        );
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Créer mon Atelier Artisan</h1>
          <p className="text-xs font-semibold text-slate-500">
            Rejoignez Craft Manager pour gérer vos recettes, stocks, DIP & caisse
          </p>
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-900 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom de votre Savonnerie / Atelier *</label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="ex: Savonnerie Nature & Sens"
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Spécialité Artisanale *</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                  className="glass-input w-full text-slate-900 font-semibold cursor-pointer"
                  style={{ paddingLeft: '2.75rem' }}
                >
                  <option value="savonnerie">🧼 Savonnerie à froid (SAF)</option>
                  <option value="cosmetiques">🌿 Cosmétiques Solides & Soins</option>
                  <option value="bougies">🕯️ Bougies & Parfums d'ambiance</option>
                  <option value="artisanat">🎨 Artisanat Général & Créations</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Devise Principale *</label>
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
                  <option value="CAD">$ Dollar Canadien (CAD)</option>
                  <option value="GBP">£ Livre Sterling (GBP)</option>
                  <option value="USD">$ Dollar US (USD)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom & Prénom de l'Artisan(e) *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="ex: Marie Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Adresse E-mail Professionnelle *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="marie@savonnerie.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mot de passe (6 caractères min.) *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white py-3.5 rounded-xl font-black text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <span>Création de l'Atelier...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Créer mon Compte Artisan
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Vous avez déjà un compte ?{' '}
          <Link href="/auth/login" className="font-extrabold text-indigo-600 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

