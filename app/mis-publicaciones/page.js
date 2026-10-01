'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'

// Saca la ruta del archivo dentro del bucket a partir de la URL publica
function rutaEnStorage(url) {
  if (!url) return null
  const partes = url.split('/imagenes/')
  return partes.length > 1 ? decodeURIComponent(partes[1].split('?')[0]) : null
}

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [borrandoId, setBorrandoId] = useState(null)
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

  async function eliminar(pub) {
    if (!window.confirm(`¿Eliminar "${pub.titulo}"? Esta acción no se puede deshacer.`)) return
    setBorrandoId(pub.id)
    setAviso('')

    const { error } = await supabase.from('publicaciones').delete().eq('id', pub.id)
    if (error) {
      setAviso('No se pudo eliminar: ' + error.message)
      setBorrandoId(null)
      return
    }

    // Borra tambien la foto para no dejar archivos huerfanos
    const ruta = rutaEnStorage(pub.imagen)
    if (ruta) await supabase.storage.from('imagenes').remove([ruta])

    setPublicaciones((lista) => lista.filter((p) => p.id !== pub.id))
    setBorrandoId(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mis publicaciones</h1>
          <p className="mt-1 text-sm text-muted">Los anuncios que has publicado en tu barrio.</p>
        </div>
        <a
          href="/publicar"
          className="h-10 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-semibold leading-10 text-white transition hover:bg-brand-dark"
        >
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
          <a href="/publicar" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
            Crea tu primer anuncio
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {publicaciones.map((pub) => (
            <li key={pub.id} className="flex items-center gap-4 rounded-xl border border-gold-soft bg-white p-3">
              <div className="h-20 w-20 flex-none overflow-hidden rounded-lg bg-surface">
                {pub.imagen ? (
                  <img src={pub.imagen} alt={pub.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted">Sin foto</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{pub.titulo}</p>
                {pub.precio === 0 ? (
                  <p className="mt-0.5 text-sm font-extrabold text-gold-ink">Gratis</p>
                ) : (
                  <p className="mt-0.5 text-sm font-extrabold text-brand">${pub.precio?.toLocaleString('es-CO')}</p>
                )}
                <p className="text-xs capitalize text-muted">{pub.tipo}</p>
              </div>

              <button
                onClick={() => eliminar(pub)}
                disabled={borrandoId === pub.id}
                className="h-9 rounded-lg border border-line px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {borrandoId === pub.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
