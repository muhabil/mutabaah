import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mutabaah Space - Liqo LDK',
    short_name: 'Mutabaah',
    description: 'Back to Basic • Track Your Spiritual Glow Up',
    start_url: '/',
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
  };
}