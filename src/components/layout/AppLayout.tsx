'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <main className="w-full max-w-md">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  );
}
