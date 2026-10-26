'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('mutabaah_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'musyrif') {
          router.replace('/musyrif');
        } else {
          router.replace('/dashboard');
        }
      } catch {
        localStorage.removeItem('mutabaah_user');
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-3 transition-colors">
      <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
        Membuka Mutabaah Space...
      </p>
    </div>
  );
}
