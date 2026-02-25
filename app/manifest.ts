import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aerojet Aviation Training Academy',
    short_name: 'Aerojet Academy',
    description: 'EASA Part-66 Aviation Maintenance Training in Accra, Ghana',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#002a5c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/android-chrome-192x192.webp',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.webp',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
