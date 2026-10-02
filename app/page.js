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
  'h-10 min-w-0 text-ellipsis rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none disabled:bg-surface disabled:text-muted'

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

      <section className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none sm:max-w-xs"
          />
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                onClick={() => setFiltroTipo(t.valor)}
                className={`h-10 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                  filtroTipo === t.valor ? 'bg-brand text-white' : 'border border-line bg-white text-muted hover:text-ink'
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
            <button
              onClick={() => setSoloGratis(!soloGratis)}
              className={`h-10 whitespace-nowrap rounded-lg border px-2.5 text-[13px] font-medium transition sm:px-4 sm:text-sm ${
                soloGratis ? 'border-gold bg-gold-bg text-gold-ink' : 'border-line bg-white text-muted hover:text-ink'
              }`}
            >
              Gratis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filtroMunicipio}
            onChange={(e) => { setFiltroMunicipio(e.target.value); setFiltroBarrio('') }}
            className={selectClase}
          >
            <option value="">Municipio</option>
            {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={filtroBarrio}
            onChange={(e) => setFiltroBarrio(e.target.value)}
            disabled={!filtroMunicipio}
            className={selectClase}
          >
            <option value="">{filtroMunicipio ? 'Barrio' : 'Elige municipio'}</option>
            {barriosDelMunicipio.map((b) => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className={`${selectClase} col-span-2 sm:col-span-1`}
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
          </select>

          {hayFiltros && (
            <button onClick={limpiar} className="col-span-2 h-10 rounded-lg px-3 text-sm font-semibold text-brand hover:underline sm:col-span-1">
              Limpiar filtros
            </button>
          )}
        </div>
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
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
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
