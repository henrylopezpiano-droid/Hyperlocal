'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Header() {
  const [sesion, setSesion] = useState(false)
  const [verificado, setVerificado] = useState(null)

  useEffect(() => {
    async function actualizar(session) {
      setSesion(!!session)
      if (!session) {
        setVerificado(null)
        return
      }
      const { data } = await supabase.from('perfiles').select('verificado').eq('id', session.user.id).single()
      setVerificado(data ? !!data.verificado : null)
    }
    supabase.auth.getSession().then(({ data }) => actualizar(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      setTimeout(() => actualizar(session), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function salir() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const enlace = 'rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-ink'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm text-white">M</span>
          <span className="hidden sm:inline">Mercado Hiperlocal</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          {sesion && verificado !== null && (
            <span
              className={`mr-1 hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold md:inline-flex ${
                verificado ? 'bg-brand-soft text-brand-dark' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {verificado && <Check />}
              {verificado ? 'Vecino verificado' : 'Pendiente de verificación'}
            </span>
          )}
          {sesion ? (
            <>
              <Link href="/mis-publicaciones" className={enlace}>Mis publicaciones</Link>
              <button onClick={salir} className={enlace}>Salir</button>
            </>
          ) : (
            <Link href="/login" className={enlace}>Ingresar</Link>
          )}
          <Link href="/publicar" className="ml-1 rounded-lg bg-brand px-4 py-2 text-white transition hover:bg-brand-dark">
            Publicar
          </Link>
        </nav>
      </div>
    </header>
  )
}
