'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Sparkles,
  Store,
  Menu,
  X,
  LayoutDashboard,
  Boxes,
  BookOpenCheck,
  Hourglass,
  ShieldCheck,
  Receipt,
  User,
  LogOut,
  LogIn,
  GraduationCap,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { useCraftStore } from '@/lib/store/craftStore';
import { createClient } from '@/lib/supabase/client';
import SettingsModal from '../settings/SettingsModal';
import OnboardingModal from '../onboarding/OnboardingModal';

const NAV_ITEMS = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Matières Premières', href: '/raw-materials', icon: Boxes },
  { name: 'Produits & Recettes', href: '/products', icon: BookOpenCheck },
  { name: 'Production & Cure', href: '/production', icon: Hourglass },
  { name: 'Commandes', href: '/orders', icon: ClipboardList },
  { name: 'Conformité & DIP / CLP', href: '/compliance', icon: ShieldCheck },
  { name: 'Coûts & Finances', href: '/finances', icon: Receipt },
  { name: 'Caisse Stand & Marché', href: '/pos', icon: ShoppingBag, highlight: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { organisation, cart } = useCraftStore();
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 px-4 lg:px-8 py-3 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Brand & Organization Title */}
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              aria-label="Ouvrir le menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[2px] shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-amber-700">
                  Craft Manager
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hidden md:flex items-center text-xs text-slate-500 pl-4 border-l border-slate-200 space-x-2 hover:bg-slate-100/80 px-2 py-1 rounded-xl transition cursor-pointer"
              title="Cliquer pour modifier les paramètres de l'Atelier"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-slate-800">{organisation.name || "L'Atelier des Restanques"}</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-bold flex items-center gap-1">
                <span>🧼 {organisation.craft_type || 'Savonnerie'}</span>
                <Settings className="w-3 h-3 text-slate-500" />
              </span>
            </button>
          </div>

          {/* Right Actions: Didacticiel, Settings, Auth Profile & POS Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-extrabold transition border border-amber-300 shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Didacticiel</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 border border-slate-200 transition cursor-pointer"
                  title="Paramètres de l'Atelier"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="line-clamp-1 max-w-[120px]">{user.user_metadata?.full_name || user.email}</span>
                  <Settings className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-xl transition text-xs font-bold flex items-center gap-1"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Déconnexion</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>Connexion</span>
              </Link>
            )}

            <Link
              href="/pos"
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                pathname === '/pos'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Caisse Tactile</span>
              <span className="xs:hidden">Caisse</span>
              {cartCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white text-indigo-900 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase text-slate-400">
              Menu Navigation
            </div>
            <div className="grid grid-cols-1 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-bold transition ${
                      isActive
                        ? item.highlight
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Atelier: {organisation.name || "L'Atelier des Restanques"}</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 rounded text-[11px] flex items-center gap-1">
                  <span>🧼 {organisation.craft_type || 'Savonnerie'}</span>
                  <Settings className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
