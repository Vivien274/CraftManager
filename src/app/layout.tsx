import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Craft Manager - Gestionnaire de Production & Caisse pour Artisans',
  description:
    'SaaS de gestion de matières premières, coût de revient, suivi de cure/séchage et caisse tactile pour artisans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
