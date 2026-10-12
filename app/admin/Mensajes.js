'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../src/lib/supabase'
import { telefonoDe, fotosDe } from '../../src/lib/contacto'

const PLANTILLA_CON =
  'Hola {nombre}, soy Henry, el administrador de Mercado Hiperlocal 👋 Gracias por publicar "{anuncio}". Un favor: comparte el enlace de tu anuncio en tu estado de WhatsApp o en tu grupo de vecinos, así más gente lo ve y te escribe más rápido: {enlace}'
const PLANTILLA_SIN =
  'Hola {nombre}, soy Henry, el administrador de Mercado Hiperlocal 👋 Ya eres vecino verificado, pero todavía no tienes anuncios activos. Publicar es gratis y toma un par de minutos: {enlace}'
const PLANTILLA_FOTO =
  'Hola {nombre}, soy Henry, el administrador de Mercado Hiperlocal 👋 Vi que tu anuncio "{anuncio}" todavía no tiene foto. Con foto se ve mucho mejor y te escriben más. Entra aquí y toca "Agregar foto" (toma un minuto): {enlace}'
const CLAVE_FOTO = 'admin-plantilla-foto-v1'
const CLAVE_CON = 'admin-plantilla-con-v2'
const CLAVE_SIN = 'admin-plantilla-sin-v2'
const CLAVE_ENVIADOS = 'admin-mensajes-enviados'

function leer(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave)
    return v === null ? porDefecto : v
  } catch (_) {
    return porDefecto
  }
}
function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, valor)
  } catch (_) {}
}

function primerNombre(n) {
  const p = (n || '').trim().split(/\s+/)[0] || 'vecino'
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

function vigente(a) {
  return a.estado !== 'cerrada' && (!a.vence_at || new Date(a.vence_at) > new Date())
}

export default function PanelMensajes({ anuncios, perfiles }) {
  const [plantillaCon, setPlantillaCon] = useState(PLANTILLA_CON)
  const [plantillaSin, setPlantillaSin] = useState(PLANTILLA_SIN)
  const [plantillaFoto, setPlantillaFoto] = useState(PLANTILLA_FOTO)
  const [grupo, setGrupo] = useState('con') // 'con' | 'sin' | 'foto'
  const [envio, setEnvio] = useState('todos') // 'todos' | 'pendientes' | 'enviados'
  const [busqueda, setBusqueda] = useState('')
  const [enviados, setEnviados] = useState([])
  const [listo, setListo] = useState(false)
  const [avisoActual, setAvisoActual] = useState(null)
  const [textoAviso, setTextoAviso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [estadoAviso, setEstadoAviso] = useState({ texto: '', error: false })

  useEffect(() => {
    setPlantillaCon(leer(CLAVE_CON, PLANTILLA_CON))
    setPlantillaSin(leer(CLAVE_SIN, PLANTILLA_SIN))
    setPlantillaFoto(leer(CLAVE_FOTO, PLANTILLA_FOTO))
    try {
      const lista = JSON.parse(leer(CLAVE_ENVIADOS, '[]'))
      if (Array.isArray(lista)) setEnviados(lista)
    } catch (_) {}
    setListo(true)

    // Aviso que está activo ahora (si la tabla aún no existe, simplemente no hay aviso)
    supabase
      .from('avisos')
      .select('id, mensaje')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) {
          setAvisoActual(data[0])
          setTextoAviso(data[0].mensaje)
        }
      })
  }, [])

  useEffect(() => {
    if (listo) guardar(CLAVE_CON, plantillaCon)
  }, [plantillaCon, listo])
  useEffect(() => {
    if (listo) guardar(CLAVE_SIN, plantillaSin)
  }, [plantillaSin, listo])
  useEffect(() => {
    if (listo) guardar(CLAVE_FOTO, plantillaFoto)
  }, [plantillaFoto, listo])
  useEffect(() => {
    if (listo) guardar(CLAVE_ENVIADOS, JSON.stringify(enviados))
  }, [enviados, listo])

  // Vecinos verificados con celular, separados en: con anuncio vigente / sin anuncio vigente
  const { con, sin, foto } = useMemo(() => {
    const porUsuario = new Map()
    for (const a of anuncios) {
      if (!a.user_id || !vigente(a)) continue
      if (!porUsuario.has(a.user_id)) porUsuario.set(a.user_id, [])
      porUsuario.get(a.user_id).push(a)
    }
    const ordenar = (x, y) => x.nombre.localeCompare(y.nombre, 'es')
    const conLista = []
    for (const [id, lista] of porUsuario.entries()) {
      const perfil = perfiles.find((p) => p.id === id)
      const ordenados = lista.slice().sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
      conLista.push({
        id,
        nombre: perfil?.nombre || ordenados[0].perfiles?.nombre || '',
        tel: telefonoDe(perfil),
        n: lista.length,
        principal: ordenados[0],
      })
    }
    const sinLista = perfiles
      .filter((p) => p.verificado && !porUsuario.has(p.id))
      .map((p) => ({ id: p.id, nombre: p.nombre || '', tel: telefonoDe(p), n: 0, principal: null }))
    // Vecinos con algún anuncio vigente SIN foto (se le muestra el más reciente sin foto)
    const sinFoto = new Map()
    for (const a of anuncios) {
      if (!a.user_id || !vigente(a) || fotosDe(a).length > 0) continue
      if (!sinFoto.has(a.user_id)) sinFoto.set(a.user_id, [])
      sinFoto.get(a.user_id).push(a)
    }
    const fotoLista = []
    for (const [id, lista] of sinFoto.entries()) {
      const perfil = perfiles.find((p) => p.id === id)
      const ordenados = lista.slice().sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
      fotoLista.push({
        id,
        nombre: perfil?.nombre || ordenados[0].perfiles?.nombre || '',
        tel: telefonoDe(perfil),
        n: lista.length,
        principal: ordenados[0],
      })
    }
    return { con: conLista.sort(ordenar), sin: sinLista.sort(ordenar), foto: fotoLista.sort(ordenar) }
  }, [anuncios, perfiles])

  const origen = typeof window !== 'undefined' ? window.location.origin : ''
  const plantilla = grupo === 'con' ? plantillaCon : grupo === 'sin' ? plantillaSin : plantillaFoto
  const setPlantilla = grupo === 'con' ? setPlantillaCon : grupo === 'sin' ? setPlantillaSin : setPlantillaFoto
  const plantillaInicial = grupo === 'con' ? PLANTILLA_CON : grupo === 'sin' ? PLANTILLA_SIN : PLANTILLA_FOTO

  function armar(u) {
    const enlace = !u.principal
      ? origen
      : grupo === 'foto'
        ? `${origen}/mis-publicaciones?editar=${u.principal.id}` // abre directo el editor
        : `${origen}/anuncio/${u.principal.id}`
    return plantilla
      .replaceAll('{nombre}', primerNombre(u.nombre))
      .replaceAll('{anuncio}', u.principal ? u.principal.titulo : '')
      .replaceAll('{enlace}', enlace)
  }

  function marcar(id) {
    setEnviados((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const grupoLista = grupo === 'con' ? con : grupo === 'sin' ? sin : foto
  const nEnviados = grupoLista.filter((u) => enviados.includes(u.id)).length
  const q = busqueda.trim().toLowerCase()
  const visibles = grupoLista.filter((u) => {
    const hecho = enviados.includes(u.id)
    if (envio === 'pendientes' && hecho) return false
    if (envio === 'enviados' && !hecho) return false
    if (q && !u.nombre.toLowerCase().includes(q)) return false
    return true
  })
  const ejemplo = grupoLista[0] ? armar(grupoLista[0]) : ''

  async function publicarAviso() {
    const texto = textoAviso.trim()
    if (!texto) return
    setGuardando(true)
    setEstadoAviso({ texto: '', error: false })

    await supabase.from('avisos').update({ activo: false }).eq('activo', true)
    const { data, error } = await supabase.from('avisos').insert([{ mensaje: texto }]).select('id, mensaje').single()

    if (error || !data) {
      setEstadoAviso({ texto: 'No se pudo publicar el aviso. ¿Ejecutaste el SQL de la actualización 15?', error: true })
    } else {
      setAvisoActual(data)
      setEstadoAviso({ texto: 'Aviso publicado. Lo verán los vecinos con anuncios en Mis publicaciones.', error: false })
    }
    setGuardando(false)
  }

  async function quitarAviso() {
    setGuardando(true)
    setEstadoAviso({ texto: '', error: false })
    const { error } = await supabase.from('avisos').update({ activo: false }).eq('activo', true)
    if (error) {
      setEstadoAviso({ texto: 'No se pudo quitar el aviso.', error: true })
    } else {
      setAvisoActual(null)
      setTextoAviso('')
      setEstadoAviso({ texto: 'Aviso quitado.', error: false })
    }
    setGuardando(false)
  }

  return (
    <div className="space-y-4">
      {/* Filtro principal */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'con', etiqueta: `Con anuncios vigentes (${con.length})` },
          { id: 'sin', etiqueta: `Sin anuncios vigentes (${sin.length})` },
          { id: 'foto', etiqueta: `Anuncio sin foto (${foto.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setGrupo(t.id)}
            className={`h-10 rounded-lg border px-4 text-sm font-semibold transition ${
              grupo === t.id ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-extrabold">1. Tu mensaje</h2>
          <p className="mt-1 break-words text-xs text-muted">
            {grupo === 'con'
              ? 'Mensaje para vecinos con anuncios. '
              : grupo === 'sin'
                ? 'Mensaje para vecinos verificados sin anuncios. '
                : 'Mensaje para vecinos con un anuncio vigente sin foto. '}
            Se reemplaza solo: <strong>{'{nombre}'}</strong> (su primer nombre)
            {grupo !== 'sin' && (
              <>
                , <strong>{'{anuncio}'}</strong> (el título de su anuncio)
              </>
            )}{' '}
            y <strong>{'{enlace}'}</strong> ({grupo === 'con' ? 'el enlace a su anuncio' : grupo === 'foto' ? 'abre directo el editor de ese anuncio' : 'el enlace a la página'}).
          </p>
          <textarea
            value={plantilla}
            onChange={(e) => setPlantilla(e.target.value)}
            rows={8}
            className="mt-3 block w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setPlantilla(plantillaInicial)}
            className="mt-2 text-xs font-semibold text-brand hover:underline"
          >
            Restaurar mensaje de ejemplo
          </button>
          {ejemplo && (
            <div className="mt-3 rounded-lg bg-surface p-3">
              <p className="text-xs font-semibold text-muted">Así le llegaría a {primerNombre(grupoLista[0].nombre)}:</p>
              <p className="mt-1 whitespace-pre-line text-sm [overflow-wrap:anywhere]">{ejemplo}</p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">2. Vecinos</h2>
              <p className="mt-1 text-xs text-muted">
                {grupoLista.length} {grupo === 'con' ? 'con anuncio vigente' : grupo === 'sin' ? 'verificados sin anuncio vigente' : 'con anuncio vigente sin foto'} ·{' '}
                <strong className="text-ink">{nEnviados}</strong> enviados en esta tanda
              </p>
            </div>
            {nEnviados > 0 && (
              <button
                type="button"
                onClick={() => setEnviados((prev) => prev.filter((id) => !grupoLista.some((u) => u.id === id)))}
                className="shrink-0 text-xs font-semibold text-brand hover:underline"
              >
                Tanda nueva
              </button>
            )}
          </div>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            className="mt-3 block h-10 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { id: 'todos', etiqueta: 'Todos' },
              { id: 'pendientes', etiqueta: 'Por enviar' },
              { id: 'enviados', etiqueta: 'Ya enviados' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEnvio(t.id)}
                className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
                  envio === t.id ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="mt-4 rounded-lg bg-surface p-3 text-center text-sm text-muted">No hay vecinos con este filtro.</p>
          ) : (
            <ul className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {visibles.map((u) => {
                const hecho = enviados.includes(u.id)
                return (
                  <li
                    key={u.id}
                    className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                      hecho ? 'border-brand/30 bg-brand-soft' : 'border-line'
                    }`}
                  >
                    <div className="min-w-0 sm:flex-1">
                      <p className="break-words text-sm font-semibold">{u.nombre || 'Sin nombre'}</p>
                      <p className="line-clamp-2 break-words text-xs text-muted">
                        {u.principal
                          ? `${u.n} ${u.n === 1 ? 'anuncio' : 'anuncios'} · ${u.principal.titulo}`
                          : 'Sin anuncios vigentes'}
                      </p>
                    </div>
                    {u.tel ? (
                      <a
                        href={`https://wa.me/${u.tel}?text=${encodeURIComponent(armar(u))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcar(u.id)}
                        className={`flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold transition ${
                          hecho ? 'border border-brand text-brand-dark hover:bg-white' : 'bg-brand text-white hover:bg-brand-dark'
                        }`}
                      >
                        {hecho ? '✓ Enviado · otra vez' : 'Enviar por WhatsApp'}
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted">Sin celular</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-extrabold">Aviso dentro de la app</h2>
        <p className="mt-1 text-xs text-muted">
          Lo ven en <strong>Mis publicaciones</strong> los vecinos que tienen anuncios. Solo hay un aviso activo a la vez.
        </p>
        <textarea
          value={textoAviso}
          onChange={(e) => setTextoAviso(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Ej. Comparte el enlace de tu anuncio en tu estado de WhatsApp para que más vecinos lo vean."
          className="mt-3 block w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={publicarAviso}
            disabled={guardando || !textoAviso.trim()}
            className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {avisoActual ? 'Reemplazar aviso' : 'Publicar aviso'}
          </button>
          {avisoActual && (
            <button
              type="button"
              onClick={quitarAviso}
              disabled={guardando}
              className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition hover:text-ink disabled:opacity-60"
            >
              Quitar aviso
            </button>
          )}
          <span className="text-xs text-muted">{avisoActual ? 'Hay un aviso activo.' : 'No hay aviso activo.'}</span>
        </div>
        {estadoAviso.texto && (
          <p className={`mt-3 rounded-lg p-3 text-sm ${estadoAviso.error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>
            {estadoAviso.texto}
          </p>
        )}
      </section>
    </div>
  )
}
