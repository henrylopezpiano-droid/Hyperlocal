'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../src/lib/supabase'
import { CATEGORIAS } from '../src/lib/categorias'

const TIPOS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'servicio', etiqueta: 'Servicios' },
  { valor: 'producto', etiqueta: 'Productos' },
]

const selectClase =
  'h-10 rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none disabled:bg-surface disabled:text-muted'

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand" aria-label="Vecino verificado">
      <title>Vecino verificado</title>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Home() {
  const [publicaciones, setPublicaciones] = useState([])
  const [barrios, setBarrios] = useState([])
  const [sesion, setSesion] = useState(false)
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
      const conSesion = !!session
      setSesion(conSesion)

      // Sin sesión no se pide el teléfono
      const columnas = conSesion
        ? 'nombre, telefono, barrio, municipio, verificado'
        : 'nombre, barrio, municipio, verificado'

      const [pubs, lista] = await Promise.all([
        supabase
          .from('publicaciones')
          .select(`*, perfiles (${columnas})`)
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
          <div className="flex gap-1.5 overflow-x-auto">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                onClick={() => setFiltroTipo(t.valor)}
                className={`h-10 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition ${
                  filtroTipo === t.valor ? 'bg-brand text-white' : 'border border-line bg-white text-muted hover:text-ink'
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
            <button
              onClick={() => setSoloGratis(!soloGratis)}
              className={`h-10 whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition ${
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
            <option value="">Todos los municipios</option>
            {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={filtroBarrio}
            onChange={(e) => setFiltroBarrio(e.target.value)}
            disabled={!filtroMunicipio}
            className={selectClase}
          >
            <option value="">{filtroMunicipio ? 'Todos los barrios' : 'Elige municipio'}</option>
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
            const tel = vendedor.telefono ? vendedor.telefono.replace(/\D/g, '') : ''
            const mensaje = encodeURIComponent(
              `Hola ${vendedor.nombre || 'vecino'}, vi tu publicación "${pub.titulo}" en el Mercado Hiperlocal y me interesa.`
            )
            return (
              <article
                key={pub.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gold-soft bg-white transition hover:border-gold hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                  {pub.imagen ? (
                    <img src={pub.imagen} alt={pub.titulo} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted">Sin foto</div>
                  )}
                  <span className="absolute left-2 top-2 z-10 rounded-md bg-white/95 px-2 py-0.5 text-xs font-semibold capitalize text-brand">
                    {pub.tipo}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-1 text-sm font-bold">{pub.titulo}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{pub.descripcion}</p>

                  {pub.precio === 0 ? (
                    <p className="mt-2">
                      <span className="rounded-md bg-gold-bg px-2 py-0.5 text-sm font-extrabold text-gold-ink">Gratis</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-base font-extrabold text-brand">${pub.precio?.toLocaleString('es-CO')}</p>
                  )}

                  <p className="mb-3 mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <span className="truncate">{vendedor.nombre || 'Vecino'}</span>
                    {vendedor.verificado && <Check />}
                    <span className="truncate">· {pub.barrio || vendedor.barrio || 'Zona'}</span>
                  </p>

                  {!sesion ? (
                    <a href="/login?volver=/" className="mt-auto rounded-lg border border-brand bg-white py-2 text-center text-xs font-semibold text-brand transition hover:bg-brand-soft">
                      Ingresa para contactar
                    </a>
                  ) : tel ? (
                    <a
                      href={`https://wa.me/${tel}?text=${mensaje}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto rounded-lg bg-brand py-2 text-center text-xs font-semibold text-white transition hover:bg-brand-dark"
                    >
                      Escribir por WhatsApp
                    </a>
                  ) : (
                    <span className="mt-auto rounded-lg bg-surface py-2 text-center text-xs text-muted">Sin WhatsApp</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
