'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../src/lib/supabase'
import { CATEGORIAS } from '../src/lib/categorias'
import { precioTexto } from '../src/lib/contacto'
import BotonContacto from './components/BotonContacto'
import ReportarModal from './components/ReportarModal'

const TIPOS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'servicio', etiqueta: 'Servicios' },
  { valor: 'producto', etiqueta: 'Productos' },
]

const selectClase =
  'h-11 w-full min-w-0 text-ellipsis rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none disabled:bg-surface disabled:text-muted md:h-10 md:w-auto'

function Etiqueta({ texto, onQuitar }) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-brand/30 bg-brand-soft pl-2.5 pr-1 text-xs font-semibold text-brand-dark">
      {texto}
      <button type="button" onClick={onQuitar} aria-label={`Quitar ${texto}`} className="grid h-6 w-6 place-items-center rounded-full text-sm leading-none hover:bg-white/70">
        ×
      </button>
    </span>
  )
}

function IconoFiltros() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand" aria-label="Vecino verificado">
      <title>Vecino verificado</title>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Bandera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 22V4M4 4h13l-2.5 4L17 12H4" />
    </svg>
  )
}

export default function Home() {
  const [publicaciones, setPublicaciones] = useState([])
  const [barrios, setBarrios] = useState([])
  const [sesion, setSesion] = useState(false)
  const [miVerificado, setMiVerificado] = useState(false)
  const [reportando, setReportando] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroMunicipio, setFiltroMunicipio] = useState('')
  const [filtroBarrio, setFiltroBarrio] = useState('')
  const [soloGratis, setSoloGratis] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false) // panel de filtros (celular)

  // Con el panel abierto: Escape lo cierra y la página de atrás no se desplaza
  useEffect(() => {
    if (!abierto) return
    const tecla = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('keydown', tecla)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = previo
    }
  }, [abierto])

  useEffect(() => {
    async function obtener() {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(!!session)
      if (session) {
        const { data: yo } = await supabase.from('perfiles').select('verificado').eq('id', session.user.id).maybeSingle()
        setMiVerificado(!!yo?.verificado)
      }

      // El teléfono solo se pide con sesión; la base de datos lo entrega únicamente a vecinos verificados
      const columnas = session
        ? 'nombre, barrio, municipio, verificado, contactos (telefono)'
        : 'nombre, barrio, municipio, verificado'

      const [pubs, lista] = await Promise.all([
        supabase
          .from('publicaciones')
          .select(`*, perfiles (${columnas})`)
          .eq('estado', 'activa')
          .gt('vence_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('barrios').select('municipio, nombre').order('nombre'),
      ])
      if (pubs.error) console.error('Error al cargar publicaciones:', pubs.error.message)
      else setPublicaciones(pubs.data || [])
      if (lista.error) console.error('Error al cargar barrios:', lista.error.message)
      else setBarrios(lista.data || [])
      setCargando(false)
    }
    obtener()
  }, [])

  const municipios = useMemo(
    () => [...new Set(barrios.map((b) => b.municipio))].sort((a, b) => a.localeCompare(b, 'es')),
    [barrios]
  )
  const barriosDelMunicipio = useMemo(
    () => barrios.filter((b) => b.municipio === filtroMunicipio),
    [barrios, filtroMunicipio]
  )

  const hayFiltros =
    filtroTipo !== 'todos' || filtroCategoria !== 'todas' || filtroMunicipio !== '' ||
    filtroBarrio !== '' || soloGratis || busqueda !== ''

  function limpiar() {
    setFiltroTipo('todos')
    setFiltroCategoria('todas')
    setFiltroMunicipio('')
    setFiltroBarrio('')
    setSoloGratis(false)
    setBusqueda('')
  }

  const nPanel = (filtroMunicipio ? 1 : 0) + (filtroBarrio ? 1 : 0) + (filtroCategoria !== 'todas' ? 1 : 0)
  const etiquetaCategoria = CATEGORIAS.find((c) => c.valor === filtroCategoria)?.etiqueta || filtroCategoria

  function limpiarPanel() {
    setFiltroMunicipio('')
    setFiltroBarrio('')
    setFiltroCategoria('todas')
  }

  function reportar(pub) {
    if (!sesion) {
      window.location.href = '/login?volver=/'
      return
    }
    setReportando(pub)
  }

  const filtradas = publicaciones.filter((pub) => {
    const vendedor = pub.perfiles || {}
    const barrioPub = pub.barrio || vendedor.barrio
    const texto = `${pub.titulo} ${pub.descripcion}`.toLowerCase()
    return (
      (filtroTipo === 'todos' || pub.tipo === filtroTipo) &&
      (filtroCategoria === 'todas' || pub.categoria === filtroCategoria) &&
      (!filtroMunicipio || vendedor.municipio === filtroMunicipio) &&
      (!filtroBarrio || barrioPub === filtroBarrio) &&
      (!soloGratis || pub.precio === 0) &&
      texto.includes(busqueda.toLowerCase())
    )
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Lo que ofrecen tus vecinos</h1>
        <p className="mt-1 text-sm text-muted">Contacta directo por WhatsApp. Sin comisiones.</p>
      </section>

      {abierto && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setAbierto(false)} />}

      <section className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none md:max-w-xs"
        />

        <div role="radiogroup" aria-label="Tipo de anuncio" className="flex h-10 w-full overflow-hidden rounded-lg border border-line bg-white md:w-auto">
          {TIPOS.map((t, i) => (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={filtroTipo === t.valor}
              onClick={() => setFiltroTipo(t.valor)}
              className={`flex-1 px-3 text-[13px] font-medium transition sm:text-sm md:flex-none md:px-4 ${i > 0 ? 'border-l border-line' : ''} ${
                filtroTipo === t.valor ? 'bg-brand text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border bg-white px-3 text-[13px] font-medium transition md:hidden ${
              nPanel > 0 ? 'border-brand text-brand' : 'border-line text-ink'
            }`}
          >
            <IconoFiltros />
            Filtros{nPanel > 0 ? ` · ${nPanel}` : ''}
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={soloGratis}
            onClick={() => setSoloGratis(!soloGratis)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition sm:text-sm ${
              soloGratis ? 'border-gold bg-gold-bg text-gold-ink' : 'border-line bg-white text-muted hover:text-ink'
            }`}
          >
            Gratis
            <span className={`relative h-4 w-7 rounded-full transition ${soloGratis ? 'bg-gold' : 'bg-line'}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${soloGratis ? 'left-3.5' : 'left-0.5'}`} />
            </span>
          </button>
        </div>

        <div
          className={`${abierto
      ? 'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-3 overflow-y-auto rounded-t-2xl bg-white p-4 pb-6 shadow-2xl'
      : 'hidden'} md:static md:z-auto md:flex md:max-h-none md:flex-row md:flex-wrap md:items-center md:gap-2 md:overflow-visible md:rounded-none md:bg-transparent md:p-0 md:shadow-none`}
        >
          <div className="flex items-center justify-between md:hidden">
            <h2 className="text-base font-extrabold">Filtros</h2>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar filtros" className="grid h-9 w-9 place-items-center rounded-full text-xl leading-none text-muted hover:bg-surface">
              ×
            </button>
          </div>

          <div className="md:contents">
            <label htmlFor="f-municipio" className="mb-1 block text-sm font-medium md:sr-only">Municipio</label>
            <select
              id="f-municipio"
              value={filtroMunicipio}
              onChange={(e) => { setFiltroMunicipio(e.target.value); setFiltroBarrio('') }}
              className={selectClase}
            >
              <option value="">Todos los municipios</option>
              {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="md:contents">
            <label htmlFor="f-barrio" className="mb-1 block text-sm font-medium md:sr-only">Barrio</label>
            <select
              id="f-barrio"
              value={filtroBarrio}
              onChange={(e) => setFiltroBarrio(e.target.value)}
              disabled={!filtroMunicipio}
              className={selectClase}
            >
              <option value="">{filtroMunicipio ? 'Todos los barrios' : 'Primero elige municipio'}</option>
              {barriosDelMunicipio.map((b) => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>

          <div className="md:contents">
            <label htmlFor="f-categoria" className="mb-1 block text-sm font-medium md:sr-only">Categoría</label>
            <select
              id="f-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={selectClase}
            >
              <option value="todas">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
            </select>
          </div>

          {hayFiltros && (
            <button type="button" onClick={limpiar} className="hidden h-10 items-center px-3 text-sm font-semibold text-brand hover:underline md:inline-flex">
              Limpiar todo
            </button>
          )}

          <div className="mt-1 flex gap-2 md:hidden">
            <button type="button" onClick={limpiarPanel} className="h-11 flex-1 rounded-lg border border-line text-sm font-semibold text-muted">
              Limpiar
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="h-11 flex-[2] rounded-lg bg-brand text-sm font-semibold text-white">
              Ver {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
            </button>
          </div>
        </div>

        {hayFiltros && (
          <div className="flex flex-wrap items-center gap-1.5 md:hidden">
            {filtroMunicipio && <Etiqueta texto={filtroMunicipio} onQuitar={() => { setFiltroMunicipio(''); setFiltroBarrio('') }} />}
            {filtroBarrio && <Etiqueta texto={filtroBarrio} onQuitar={() => setFiltroBarrio('')} />}
            {filtroCategoria !== 'todas' && <Etiqueta texto={etiquetaCategoria} onQuitar={() => setFiltroCategoria('todas')} />}
            <button type="button" onClick={limpiar} className="h-8 px-1 text-xs font-semibold text-brand hover:underline">
              Limpiar todo
            </button>
          </div>
        )}
      </section>

      {cargando ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-line" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white py-14 text-center">
          <p className="text-sm text-muted">No hay publicaciones con estos filtros.</p>
          {hayFiltros ? (
            <button onClick={limpiar} className="mt-2 text-sm font-semibold text-brand hover:underline">Quitar filtros</button>
          ) : (
            <a href="/publicar" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">Publica el primer anuncio</a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtradas.map((pub) => {
            const vendedor = pub.perfiles || {}
            return (
              <article key={pub.id} className="flex flex-col overflow-hidden rounded-xl border border-gold-soft bg-white transition hover:border-gold hover:shadow-md">
                <div className="relative aspect-[3/2] overflow-hidden bg-surface sm:aspect-[4/3]">
                  <Link href={`/anuncio/${pub.id}`} className="absolute inset-0 block" aria-label={`Ver ${pub.titulo}`}>
                    {pub.imagen ? (
                      <img src={pub.imagen} alt={pub.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted">Sin foto</div>
                    )}
                  </Link>
                  <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-white/95 px-2 py-0.5 text-xs font-semibold capitalize text-brand">
                    {pub.tipo}
                  </span>
                  <button
                    onClick={() => reportar(pub)}
                    aria-label="Reportar anuncio"
                    title="Reportar anuncio"
                    className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-muted transition hover:text-red-600"
                  >
                    <Bandera />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <Link href={`/anuncio/${pub.id}`} className="hover:underline">
                    <h3 className="line-clamp-2 text-sm font-bold sm:line-clamp-1">{pub.titulo}</h3>
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{pub.descripcion}</p>

                  {pub.precio === 0 ? (
                    <p className="mt-2">
                      <span className="rounded-md bg-gold-bg px-2 py-0.5 text-sm font-extrabold text-gold-ink">Gratis</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-base font-extrabold text-brand">{precioTexto(pub.precio)}</p>
                  )}

                  <p className="mb-3 mt-0.5 flex flex-col text-xs text-muted sm:flex-row sm:items-center sm:gap-1">
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="truncate">{vendedor.nombre || 'Vecino'}</span>
                      {vendedor.verificado && <Check />}
                    </span>
                    <span className="truncate">
                      <span className="hidden sm:inline">· </span>
                      {pub.barrio || vendedor.barrio || 'Zona'}
                    </span>
                  </p>

                  <BotonContacto
                    sesion={sesion}
                    verificado={miVerificado}
                    vendedor={vendedor}
                    titulo={pub.titulo}
                    volver="/"
                    clase="mt-auto"
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      {reportando && <ReportarModal publicacion={reportando} onClose={() => setReportando(null)} />}

      <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
        <a href="/privacidad" className="hover:text-ink hover:underline">Política de privacidad</a>
        <span className="mx-2">·</span>
        <a href="/terminos" className="hover:text-ink hover:underline">Términos y condiciones</a>
      </footer>
    </div>
  )
}
