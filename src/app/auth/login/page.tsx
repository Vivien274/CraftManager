'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Sparkles, AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Identifiants incorrects. Veuillez réessayer.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-500/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Craft Manager</h1>
          <p className="text-xs font-semibold text-slate-500">
            Connexion à votre espace Savonnerie Artisanale
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-900 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Adresse E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="artisan@savonnerie.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full text-slate-900 font-semibold"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
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
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 py-3.5 rounded-xl font-black text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Pas encore de compte atelier ?{' '}
          <Link href="/auth/register" className="font-extrabold text-indigo-600 hover:underline">
            Créer ma Savonnerie
          </Link>
        </div>
      </div>
    </div>
  );
}
