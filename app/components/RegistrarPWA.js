'use client'
import { useEffect } from 'react'

// Registra el service worker y guarda el aviso de "instalable" del navegador
// (llega una sola vez, al cargar la página), para que otras pantallas lo usen después.
export default function RegistrarPWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    function antes(e) {
      e.preventDefault()
      window.__pwaEvento = e
      window.dispatchEvent(new Event('pwa-listo'))
    }
    window.addEventListener('beforeinstallprompt', antes)
    return () => window.removeEventListener('beforeinstallprompt', antes)
  }, [])
  return null
}
