'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Flecha({ abierto }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`text-muted transition ${abierto ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export default function Header() {
  const [sesion, setSesion] = useState(false)
  const [nombre, setNombre] = useState('')
  const [verificado, setVerificado] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    async function actualizar(session) {
      setSesion(!!session)
      if (!session) {
        setNombre('')
        setVerificado(null)
        setEsAdmin(false)
        setAbierto(false)
        return
      }
      const { data } = await supabase.from('perfiles').select('nombre, verificado').eq('id', session.user.id).single()
      setNombre(data?.nombre || '')
      setVerificado(data ? !!data.verificado : null)
      // Solo los administradores figuran en la tabla admins
      const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      setEsAdmin(!!admin)
    }
    supabase.auth.getSession().then(({ data }) => actualizar(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      setTimeout(() => actualizar(session), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // El menú se cierra al tocar fuera de él o al presionar Escape
  useEffect(() => {
    if (!abierto) return
    function fuera(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setAbierto(false)
    }
    function tecla(e) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('touchstart', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('touchstart', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  async function salir() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const inicial = (nombre || '?').trim().charAt(0).toUpperCase() || '?'
  const itemMenu = 'block w-full px-4 py-3 text-left text-sm text-ink hover:bg-surface'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm text-white">M</span>
          <span className="hidden sm:inline">Mercado Hiperlocal</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium">
          {!sesion && (
            <Link href="/login" className="whitespace-nowrap rounded-lg px-3 py-2 text-muted hover:bg-surface hover:text-ink">
              Ingresar
            </Link>
          )}

          <Link href="/publicar" className="whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-white transition hover:bg-brand-dark">
            Publicar
          </Link>

          {sesion && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAbierto(!abierto)}
                aria-haspopup="menu"
                aria-expanded={abierto}
                aria-label="Mi cuenta"
                className="flex h-10 items-center gap-1 rounded-full border border-line bg-white py-1 pl-1 pr-2 transition hover:bg-surface"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
                  {inicial}
                </span>
                <Flecha abierto={abierto} />
              </button>

              {abierto && (
                <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-bold">{nombre || 'Mi cuenta'}</p>
                    {verificado !== null && (
                      <p
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          verificado ? 'bg-brand-soft text-brand-dark' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {verificado && <Check />}
                        {verificado ? 'Vecino verificado' : 'Pendiente de verificación'}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link role="menuitem" href="/mis-publicaciones" onClick={() => setAbierto(false)} className={itemMenu}>
                      Mis publicaciones
                    </Link>
                    {esAdmin && (
                      <Link role="menuitem" href="/admin" onClick={() => setAbierto(false)} className={itemMenu}>
                        Panel de administrador
                      </Link>
                    )}
                    <button role="menuitem" onClick={salir} className={`${itemMenu} border-t border-line`}>
                      Salir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
