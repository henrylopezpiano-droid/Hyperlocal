'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'
import { CATEGORIAS } from '../../src/lib/categorias'
import { telefonoDe, enlaceWhatsAppClasificado, haceTiempo } from '../../src/lib/contacto'
import PestanasInicio from '../components/PestanasInicio'

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function ClasificadosPage() {
  const [lista, setLista] = useState([])
  const [sesion, setSesion] = useState(false)
  const [miId, setMiId] = useState(null)
  const [miVerificado, setMiVerificado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [falla, setFalla] = useState(false)
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function obtener() {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(!!session)
      if (session) {
        setMiId(session.user.id)
        const { data: yo } = await supabase.from('perfiles').select('verificado').eq('id', session.user.id).maybeSingle()
        setMiVerificado(!!yo?.verificado)
      }
      // El teléfono solo se pide con sesión; la base de datos lo entrega únicamente a vecinos verificados
      const columnas = session ? 'nombre, barrio, verificado, contactos (telefono)' : 'nombre, barrio'
      const { data, error } = await supabase
        .from('clasificados')
        .select(`id, user_id, titulo, descripcion, categoria, presupuesto, created_at, perfiles (${columnas})`)
        .eq('estado', 'activa')
        .gt('vence_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) setFalla(true)
      else setLista(data || [])
      setCargando(false)
    }
    obtener()
  }, [])

  const q = busqueda.trim().toLowerCase()
  const visibles = lista.filter(
    (c) =>
      (categoria === 'todas' || c.categoria === categoria) &&
      (!q || `${c.titulo} ${c.descripcion || ''}`.toLowerCase().includes(q))
  )
  const etiquetaCategoria = (v) => CATEGORIAS.find((c) => c.valor === v)?.etiqueta || v

  function Boton({ c }) {
    const base = 'mt-3 block rounded-lg py-2.5 text-center text-sm font-semibold'
    const vecino = c.perfiles || {}
    if (c.user_id === miId) {
      return <a href="/mis-publicaciones#clasificados" className={`${base} border border-line text-muted hover:text-ink`}>Es tuyo · Administrar</a>
    }
    if (!sesion) {
      return <a href="/login?volver=/clasificados" className={`${base} border border-brand bg-white text-brand transition hover:bg-brand-soft`}>Ingresa para responder</a>
    }
    const tel = telefonoDe(vecino)
    if (tel) {
      return (
        <a href={enlaceWhatsAppClasificado(tel, vecino.nombre, c.titulo)} target="_blank" rel="noopener noreferrer" className={`${base} bg-brand text-white transition hover:bg-brand-dark`}>
          Yo te ayudo · WhatsApp
        </a>
      )
    }
    if (!miVerificado) return <span className={`${base} bg-gold-bg text-gold-ink`}>Verifica tu cuenta para responder</span>
    return <span className={`${base} bg-surface font-normal text-muted`}>Sin WhatsApp</span>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PestanasInicio activa="clasificados" />

      <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Lo que buscan tus vecinos</h1>
          <p className="mt-1 text-sm text-muted">¿Lo tienes o sabes hacerlo? Escríbeles directo. ¿Necesitas algo? Pídelo gratis.</p>
        </div>
        <Link href="/clasificados/nuevo" className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gold px-5 text-sm font-bold text-ink shadow-sm transition hover:bg-gold-soft sm:w-auto">
          + Publicar clasificado
        </Link>
      </section>

      <section className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none sm:max-w-xs"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Categoría"
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none sm:w-auto"
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
        </select>
      </section>

      {cargando ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-line" />)}
        </div>
      ) : falla ? (
        <div className="rounded-xl border border-dashed border-line bg-white py-14 text-center text-sm text-muted">
          Esta sección se está activando. Vuelve en un momento.
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white py-14 text-center">
          <p className="text-sm text-muted">{lista.length === 0 ? 'Todavía nadie ha publicado un clasificado.' : 'No hay clasificados con estos filtros.'}</p>
          <Link href="/clasificados/nuevo" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">Publica el primero</Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibles.map((c) => {
            const vecino = c.perfiles || {}
            return (
              <article key={c.id} className="flex min-w-0 flex-col rounded-xl border border-gold-soft border-l-4 border-l-gold bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-gold-bg px-2 py-0.5 font-bold text-gold-ink">Busco</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 font-semibold text-muted">{etiquetaCategoria(c.categoria)}</span>
                  <span className="ml-auto text-muted">{haceTiempo(c.created_at)}</span>
                </div>
                <h3 className="break-words text-base font-bold leading-snug">{c.titulo}</h3>
                {c.descripcion && <p className="mt-1 line-clamp-4 whitespace-pre-line break-words text-sm text-muted">{c.descripcion}</p>}
                {c.presupuesto != null && (
                  <p className="mt-2 text-sm font-semibold text-gold-ink">Presupuesto: ${Number(c.presupuesto).toLocaleString('es-CO')}</p>
                )}
                <p className="mt-2 flex min-w-0 items-center gap-1 text-xs text-muted">
                  <span className="truncate">{vecino.nombre || 'Vecino'}</span>
                  {vecino.verificado && <Check />}
                  <span className="truncate">· {vecino.barrio || 'Zona'}</span>
                </p>
                <Boton c={c} />
              </article>
            )
          })}
        </div>
      )}

      <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
        <a href="/privacidad" className="hover:text-ink hover:underline">Política de privacidad</a>
        <span className="mx-2">·</span>
        <a href="/terminos" className="hover:text-ink hover:underline">Términos y condiciones</a>
      </footer>
    </div>
  )
}
