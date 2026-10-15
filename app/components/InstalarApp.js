'use client'
import { useEffect, useState } from 'react'

const CLAVE = 'instalar-app-oculto'

// Invitación discreta a instalar la app. Se oculta sola si ya está instalada
// o si la persona toca "Ahora no".
export default function InstalarApp() {
  const [visible, setVisible] = useState(false)
  const [esIos, setEsIos] = useState(false)
  const [mostrarPasosIos, setMostrarPasosIos] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE) === '1') return
    } catch (_) {}

    const instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (instalada) return

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setEsIos(true)
      setVisible(true)
      return
    }

    if (window.__pwaEvento) setVisible(true)
    const alListo = () => setVisible(true)
    const alInstalar = () => setVisible(false)
    window.addEventListener('pwa-listo', alListo)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('pwa-listo', alListo)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  function ocultar() {
    try {
      localStorage.setItem(CLAVE, '1')
    } catch (_) {}
    setVisible(false)
  }

  async function instalar() {
    if (esIos) {
      setMostrarPasosIos(true)
      return
    }
    const ev = window.__pwaEvento
    if (!ev) return
    ev.prompt()
    try {
      await ev.userChoice
    } catch (_) {}
    window.__pwaEvento = null
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-4 rounded-xl border border-line bg-white p-3 text-sm">
      <p className="font-semibold">📲 Ten Mercado Hiperlocal a un toque</p>
      <p className="mt-0.5 text-xs text-muted">Agrégala a la pantalla de tu celular y ábrela como una app, sin buscar el enlace.</p>
      {mostrarPasosIos && (
        <p className="mt-2 rounded-lg bg-surface p-2 text-xs">
          En iPhone: abre esta página en <strong>Safari</strong>, toca el botón <strong>Compartir</strong> y elige{' '}
          <strong>Agregar a pantalla de inicio</strong>.
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={instalar} className="h-9 rounded-lg bg-brand px-4 text-xs font-semibold text-white transition hover:bg-brand-dark">
          {esIos ? 'Cómo instalarla' : 'Instalar'}
        </button>
        <button type="button" onClick={ocultar} className="h-9 rounded-lg border border-line px-4 text-xs font-semibold text-muted hover:text-ink">
          Ahora no
        </button>
      </div>
    </div>
  )
}
