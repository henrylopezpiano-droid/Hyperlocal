'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'
import { rutasEnStorage, precioTexto } from '../../src/lib/contacto'

const DIA = 24 * 60 * 60 * 1000

function estadoDe(p) {
  if (p.estado === 'cerrada') return 'cerrada'
  if (p.vence_at && new Date(p.vence_at) < new Date()) return 'vencida'
  return 'activa'
}

function diasRestantes(p) {
  return Math.max(0, Math.ceil((new Date(p.vence_at) - Date.now()) / DIA))
}

// Texto del botón según lo que se publicó
function textoCierre(p) {
  if (p.precio === 0) return 'Ya lo regalé'
  return p.tipo === 'servicio' ? 'Ya no disponible' : 'Ya se vendió'
}
function etiquetaCerrada(p) {
  if (p.precio === 0) return 'Regalado'
  return p.tipo === 'servicio' ? 'No disponible' : 'Vendido'
}

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [trabajandoId, setTrabajandoId] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?volver=/mis-publicaciones'
        return
      }
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) setAviso('No se pudieron cargar tus publicaciones: ' + error.message)
      else setPublicaciones(data || [])
      setCargando(false)
    }
    cargar()
  }, [])

  async function actualizar(pub, cambios) {
    setTrabajandoId(pub.id)
    setAviso('')
    const { data, error } = await supabase.from('publicaciones').update(cambios).eq('id', pub.id).select()
    if (error || !data || data.length === 0) {
      setAviso('No se pudo guardar el cambio. Intenta de nuevo.')
    } else {
      setPublicaciones((lista) => lista.map((p) => (p.id === pub.id ? { ...p, ...data[0] } : p)))
    }
    setTrabajandoId(null)
  }

  const cerrar = (pub) => actualizar(pub, { estado: 'cerrada', cerrada_at: new Date().toISOString() })
  const renovar = (pub) =>
    actualizar(pub, { estado: 'activa', cerrada_at: null, vence_at: new Date(Date.now() + 30 * DIA).toISOString() })

  async function eliminar(pub) {
    if (!window.confirm(`¿Eliminar "${pub.titulo}"? Esta acción no se puede deshacer.`)) return
    setTrabajandoId(pub.id)
    setAviso('')

    const { error } = await supabase.from('publicaciones').delete().eq('id', pub.id)
    if (error) {
      setAviso('No se pudo eliminar: ' + error.message)
      setTrabajandoId(null)
      return
    }

    // Borra tambien todas las fotos para no dejar archivos huerfanos
    const rutas = rutasEnStorage(pub)
    if (rutas.length) await supabase.storage.from('imagenes').remove(rutas)

    setPublicaciones((lista) => lista.filter((p) => p.id !== pub.id))
    setTrabajandoId(null)
  }

  const boton = 'h-9 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50'

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mis publicaciones</h1>
          <p className="mt-1 text-sm text-muted">Los anuncios duran 30 días. Puedes renovarlos cuando quieras.</p>
        </div>
        <a href="/publicar" className="h-10 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-semibold leading-10 text-white transition hover:bg-brand-dark">
          + Publicar
        </a>
      </div>

      {aviso && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{aviso}</p>}

      {cargando ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-line" />)}
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white py-14 text-center">
          <p className="text-sm text-muted">Aún no tienes publicaciones.</p>
          <a href="/publicar" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">Crea tu primer anuncio</a>
        </div>
      ) : (
        <ul className="space-y-3">
          {publicaciones.map((pub) => {
            const est = estadoDe(pub)
            const ocupado = trabajandoId === pub.id
            return (
              <li key={pub.id} className={`rounded-xl border border-gold-soft bg-white p-3 ${est !== 'activa' ? 'opacity-90' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 flex-none overflow-hidden rounded-lg bg-surface">
                    {pub.imagen ? (
                      <img src={pub.imagen} alt={pub.titulo} className={`h-full w-full object-cover ${est !== 'activa' ? 'grayscale' : ''}`} />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted">Sin foto</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link href={`/anuncio/${pub.id}`} className="block truncate text-sm font-bold hover:underline">{pub.titulo}</Link>
                    <p className={`mt-0.5 text-sm font-extrabold ${pub.precio === 0 ? 'text-gold-ink' : 'text-brand'}`}>{precioTexto(pub.precio)}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span className="capitalize">{pub.tipo}</span>
                      {est === 'activa' && (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand-dark">
                          Activo · vence en {diasRestantes(pub)} {diasRestantes(pub) === 1 ? 'día' : 'días'}
                        </span>
                      )}
                      {est === 'vencida' && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">Vencido</span>}
                      {est === 'cerrada' && <span className="rounded-full bg-gold-bg px-2 py-0.5 font-semibold text-gold-ink">{etiquetaCerrada(pub)}</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {est === 'activa' && (
                    <button onClick={() => cerrar(pub)} disabled={ocupado} className={`${boton} border-brand text-brand hover:bg-brand-soft`}>
                      {textoCierre(pub)}
                    </button>
                  )}
                  {est === 'vencida' && (
                    <button onClick={() => renovar(pub)} disabled={ocupado} className={`${boton} border-brand text-brand hover:bg-brand-soft`}>
                      Renovar 30 días
                    </button>
                  )}
                  {est === 'cerrada' && (
                    <button onClick={() => renovar(pub)} disabled={ocupado} className={`${boton} border-brand text-brand hover:bg-brand-soft`}>
                      Volver a publicar
                    </button>
                  )}
                  <button onClick={() => eliminar(pub)} disabled={ocupado} className={`${boton} ml-auto border-line text-red-600 hover:bg-red-50`}>
                    {ocupado ? 'Un momento...' : 'Eliminar'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
