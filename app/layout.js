import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Header from './components/Header'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata = {
  title: 'Mercado Hiperlocal',
  description: 'Conectando tu comunidad sin comisiones.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}