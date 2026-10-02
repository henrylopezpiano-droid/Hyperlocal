'use client'
import { telefonoDe, enlaceWhatsApp } from '../../src/lib/contacto'

// Tres estados: sin sesión, con sesión sin verificar, y verificado (ve el WhatsApp)
export default function BotonContacto({ sesion, verificado, vendedor, titulo, volver = '/', grande = false, clase = '' }) {
  const base = `block rounded-lg text-center font-semibold ${grande ? 'py-3 text-sm' : 'py-2 text-xs'} ${clase}`
  const tel = telefonoDe(vendedor)

  if (!sesion) {
    return (
      <a href={`/login?volver=${encodeURIComponent(volver)}`} className={`${base} border border-brand bg-white text-brand transition hover:bg-brand-soft`}>
        Ingresa para contactar
      </a>
    )
  }
  if (tel) {
    return (
      <a href={enlaceWhatsApp(tel, vendedor?.nombre, titulo)} target="_blank" rel="noopener noreferrer" className={`${base} bg-brand text-white transition hover:bg-brand-dark`}>
        Escribir por WhatsApp
      </a>
    )
  }
  if (!verificado) {
    return <span className={`${base} bg-gold-bg text-gold-ink`}>Verifica tu cuenta para contactar</span>
  }
  return <span className={`${base} bg-surface font-normal text-muted`}>Sin WhatsApp</span>
}
