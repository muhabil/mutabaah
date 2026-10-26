import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mutabaah Space - LDK Al-Futuwwah ITPLN',
    short_name: 'Al-Futuwwah ITPLN',
    description: 'Portal Mentoring & Mutabaah UKM LDK Al-Futuwwah Institut Teknologi PLN',
    start_url: '/dashboard',
    display: 'standalone', // Menghilangkan bar URL browser saat dibuka dari HP
    background_color: '#f5f5f4',
    theme_color: '#059669', // Warna hijau emerald di status bar HP
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Amal Yaumi',
        short_name: 'Amal Yaumi',
        description: 'Buka checklist ibadah harian pribadi',
        url: '/dashboard',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Kelompok & Setoran',
        short_name: 'Kelompok',
        description: 'Lihat info kelompok liqo & tasmi hafalan',
        url: '/dashboard?tab=kelompok',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
