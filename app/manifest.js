export default function manifest() {
  return {
    name: 'Mercado Hiperlocal',
    short_name: 'Hiperlocal',
    description: 'Conectando tu comunidad sin comisiones.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#1f7a4d',
    theme_color: '#1f7a4d',
    lang: 'es',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
