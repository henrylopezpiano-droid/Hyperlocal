import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Header from './components/Header'
import RegistrarPWA from './components/RegistrarPWA'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata = {
  title: 'Mercado Hiperlocal',
  description: 'Conectando tu comunidad sin comisiones.',
  applicationName: 'Mercado Hiperlocal',
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Hiperlocal', statusBarStyle: 'default' },
}

export const viewport = {
  themeColor: '#1f7a4d',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body>
        <RegistrarPWA />
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}