'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'
import { haceTiempo } from '../../src/lib/contacto'

const boton = 'h-9 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-60'

// Sección "Mis clasificados" dentro de Mis publicaciones
export default function MisClasificados() {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ocupadoId, setOcupadoId] = useState(null)
  const [aviso, setAviso] = useState({ texto: '', error: false })

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setCargando(false)
      const { data } = await supabase
        .from('clasificados')
        .select('id, titulo, estado, created_at, vence_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setLista(data || [])
      setCargando(false)
    }
    cargar()
  }, [])

  function estadoDe(c) {
    if (c.estado === 'resuelto') return 'resuelto'
    return new Date(c.vence_at) < new Date() ? 'vencido' : 'activo'
  }

  async function cambiar(c, cambios, ok) {
    setOcupadoId(c.id)
    setAviso({ texto: '', error: false })
    const { data, error } = await supabase.from('clasificados').update(cambios).eq('id', c.id).select('id, titulo, estado, created_at, vence_at')
    if (error || !data || data.length === 0) {
      setAviso({
        texto: (error?.message || '').includes('limite_clasificados')
          ? 'Ya tienes 3 clasificados activos. Resuelve o elimina uno primero.'
          : 'No se pudo guardar el cambio.',
        error: true,
      })
    } else {
      setLista((prev) => prev.map((x) => (x.id === c.id ? data[0] : x)))
      setAviso({ texto: ok, error: false })
    }
    setOcupadoId(null)
  }

  async function eliminar(c) {
    if (!window.confirm(`¿Eliminar el clasificado "${c.titulo}"?`)) return
    setOcupadoId(c.id)
    const { error } = await supabase.from('clasificados').delete().eq('id', c.id)
    if (error) setAviso({ texto: 'No se pudo eliminar.', error: true })
    else {
      setLista((prev) => prev.filter((x) => x.id !== c.id))
      setAviso({ texto: 'Clasificado eliminado.', error: false })
    }
    setOcupadoId(null)
  }

  if (cargando) return null

  return (
    <section id="clasificados" className="mt-10 scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold tracking-tight">Mis clasificados</h2>
        <Link href="/clasificados/nuevo" className="text-sm font-semibold text-brand hover:underline">+ Nuevo clasificado</Link>
      </div>

      {aviso.texto && (
        <p className={`mb-3 rounded-lg p-3 text-sm ${aviso.error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>{aviso.texto}</p>
      )}

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white p-5 text-center text-sm text-muted">
          ¿Necesitas algo? Pídeselo a tus vecinos con un clasificado, es gratis.
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => {
            const est = estadoDe(c)
            const ocupado = ocupadoId === c.id
            const dias = Math.max(0, Math.ceil((new Date(c.vence_at).getTime() - Date.now()) / 86400000))
            return (
              <li key={c.id} className="rounded-xl border border-gold-soft border-l-4 border-l-gold bg-white p-3">
                <p className="break-words text-sm font-bold">{c.titulo}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {est === 'activo' && `Activo · vence en ${dias} ${dias === 1 ? 'día' : 'días'}`}
                  {est === 'vencido' && 'Vencido'}
                  {est === 'resuelto' && 'Resuelto'} · publicado {haceTiempo(c.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {est === 'activo' && (
                    <button disabled={ocupado} onClick={() => cambiar(c, { estado: 'resuelto' }, '¡Qué bueno! Marcado como resuelto.')} className={`${boton} border-brand text-brand hover:bg-brand-soft`}>
                      Ya lo resolví
                    </button>
                  )}
                  {est !== 'activo' && (
                    <button
                      disabled={ocupado}
                      onClick={() => cambiar(c, { estado: 'activa', vence_at: new Date(Date.now() + 30 * 86400000).toISOString() }, 'Clasificado publicado otra vez por 30 días.')}
                      className={`${boton} border-brand text-brand hover:bg-brand-soft`}
                    >
                      {est === 'vencido' ? 'Renovar 30 días' : 'Volver a publicar'}
                    </button>
                  )}
                  <button disabled={ocupado} onClick={() => eliminar(c)} className={`${boton} ml-auto border-line text-red-600 hover:bg-red-50`}>
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
