'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../src/lib/supabase'
import { telefonoDe } from '../../src/lib/contacto'

const PLANTILLA_INICIAL =
  'Hola {nombre}, soy Henry de Mercado Hiperlocal 👋 Gracias por publicar "{anuncio}". Un favor: comparte el enlace de tu anuncio en tu estado de WhatsApp o en tu grupo de vecinos, así más gente lo ve y te escribe más rápido: {enlace}'
const CLAVE_PLANTILLA = 'admin-plantilla-mensaje'
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
  const [plantilla, setPlantilla] = useState(PLANTILLA_INICIAL)
  const [enviados, setEnviados] = useState([])
  const [listo, setListo] = useState(false)
  const [avisoActual, setAvisoActual] = useState(null)
  const [textoAviso, setTextoAviso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [estadoAviso, setEstadoAviso] = useState({ texto: '', error: false })

  useEffect(() => {
    setPlantilla(leer(CLAVE_PLANTILLA, PLANTILLA_INICIAL))
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
    if (listo) guardar(CLAVE_PLANTILLA, plantilla)
  }, [plantilla, listo])
  useEffect(() => {
    if (listo) guardar(CLAVE_ENVIADOS, JSON.stringify(enviados))
  }, [enviados, listo])

  // Vecinos con al menos un anuncio vigente (activo y sin vencer)
  const anunciantes = useMemo(() => {
    const porUsuario = new Map()
    for (const a of anuncios) {
      if (!a.user_id || !vigente(a)) continue
      if (!porUsuario.has(a.user_id)) porUsuario.set(a.user_id, [])
      porUsuario.get(a.user_id).push(a)
    }
    return [...porUsuario.entries()]
      .map(([id, lista]) => {
        const perfil = perfiles.find((p) => p.id === id)
        const ordenados = lista.slice().sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
        return {
          id,
          nombre: perfil?.nombre || ordenados[0].perfiles?.nombre || '',
          tel: telefonoDe(perfil),
          n: lista.length,
          principal: ordenados[0],
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [anuncios, perfiles])

  const origen = typeof window !== 'undefined' ? window.location.origin : ''

  function armar(u) {
    return plantilla
      .replaceAll('{nombre}', primerNombre(u.nombre))
      .replaceAll('{anuncio}', u.principal.titulo)
      .replaceAll('{enlace}', `${origen}/anuncio/${u.principal.id}`)
  }

  function marcar(id) {
    setEnviados((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const nEnviados = anunciantes.filter((u) => enviados.includes(u.id)).length
  const ejemplo = anunciantes[0] ? armar(anunciantes[0]) : ''

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
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="text-base font-extrabold">1. Tu mensaje</h2>
          <p className="mt-1 text-xs text-muted">
            Se reemplaza solo: <strong>{'{nombre}'}</strong> (su primer nombre), <strong>{'{anuncio}'}</strong> (el título de su
            anuncio) y <strong>{'{enlace}'}</strong> (el enlace a su anuncio).
          </p>
          <textarea
            value={plantilla}
            onChange={(e) => setPlantilla(e.target.value)}
            rows={9}
            className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setPlantilla(PLANTILLA_INICIAL)}
            className="mt-2 text-xs font-semibold text-brand hover:underline"
          >
            Restaurar mensaje de ejemplo
          </button>
          {ejemplo && (
            <div className="mt-3 rounded-lg bg-surface p-3">
              <p className="text-xs font-semibold text-muted">Así le llegaría a {primerNombre(anunciantes[0].nombre)}:</p>
              <p className="mt-1 whitespace-pre-line break-words text-sm">{ejemplo}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">2. Anunciantes</h2>
              <p className="mt-1 text-xs text-muted">
                {anunciantes.length} con anuncio vigente · <strong className="text-ink">{nEnviados}</strong> enviados en esta tanda
              </p>
            </div>
            {nEnviados > 0 && (
              <button type="button" onClick={() => setEnviados([])} className="text-xs font-semibold text-brand hover:underline">
                Tanda nueva
              </button>
            )}
          </div>

          {anunciantes.length === 0 ? (
            <p className="mt-4 rounded-lg bg-surface p-3 text-center text-sm text-muted">No hay anunciantes con anuncios vigentes.</p>
          ) : (
            <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {anunciantes.map((u) => {
                const hecho = enviados.includes(u.id)
                return (
                  <li key={u.id} className={`flex items-center justify-between gap-2 rounded-lg border p-2 ${hecho ? 'border-brand/30 bg-brand-soft' : 'border-line'}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.nombre || 'Sin nombre'}</p>
                      <p className="truncate text-xs text-muted">
                        {u.n} {u.n === 1 ? 'anuncio' : 'anuncios'} · {u.principal.titulo}
                      </p>
                    </div>
                    {u.tel ? (
                      <a
                        href={`https://wa.me/${u.tel}?text=${encodeURIComponent(armar(u))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcar(u.id)}
                        className={`h-9 shrink-0 rounded-lg px-3 text-xs font-semibold leading-9 transition ${
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

      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
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
          className="mt-3 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
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
