import './globals.css'

export const metadata = {
  title: 'Mercado Hiperlocal',
  description: 'Conectando tu comunidad sin comisiones.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}