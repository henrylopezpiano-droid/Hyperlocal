'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../src/lib/supabase'
import { rutasEnStorage, precioTexto } from '../../src/lib/contacto'
import { CATEGORIAS, CATEGORIA_INMUEBLES } from '../../src/lib/categorias'
import AvisoInmueble from '../components/AvisoInmueble'

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
  const [metricas, setMetricas] = useState({})
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState({ titulo: '', tipo: 'servicio', descripcion: '', categoria: '', modo: 'precio', precio: '' })

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

      // Visitas y contactos de mis anuncios (si falla, simplemente no se muestran)
      const { data: m } = await supabase.from('metricas_totales').select('publicacion_id, visitas, contactos')
      if (m) setMetricas(Object.fromEntries(m.map((x) => [x.publicacion_id, x])))
    }
    cargar()
  }, [])

  async function actualizar(pub, cambios) {
    setTrabajandoId(pub.id)
    setAviso('')
    const { data, error } = await supabase.from('publicaciones').update(cambios).eq('id', pub.id).select()
    if (error || !data || data.length === 0) {
      setAviso('No se pudo guardar el cambio. Intenta de nuevo.')
      setTrabajandoId(null)
      return false
    }
    setPublicaciones((lista) => lista.map((p) => (p.id === pub.id ? { ...p, ...data[0] } : p)))
    setTrabajandoId(null)
    return true
  }

  function empezarEdicion(pub) {
    setAviso('')
    setForm({
      titulo: pub.titulo || '',
      tipo: pub.tipo || 'servicio',
      descripcion: pub.descripcion || '',
      categoria: pub.categoria || '',
      modo: pub.precio === 0 ? 'gratis' : pub.precio == null ? 'convenir' : 'precio',
      precio: pub.precio ? String(pub.precio) : '',
    })
    setEditandoId(pub.id)
  }

  // Solo se cambian estos 4 campos: la fecha de vencimiento y el estado NO se tocan,
  // así que editar un anuncio no reinicia ni alarga sus 30 días.
  async function guardarEdicion(e, pub) {
    e.preventDefault()
    const aConvenir = form.modo === 'convenir' && form.tipo === 'servicio'
    const precio = form.modo === 'gratis' ? 0 : aConvenir ? null : parseInt(form.precio, 10)
    if (form.modo !== 'gratis' && !aConvenir && (!precio || precio <= 0)) {
      setAviso('Escribe un precio válido, o elige "Lo regalo".')
      return
    }
    const ok = await actualizar(pub, {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      precio,
    })
    if (ok) setEditandoId(null)
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="text-base font-extrabold leading-none text-ink">{metricas[pub.id]?.visitas ?? 0}</span>
                        <span className="text-xs text-muted">{(metricas[pub.id]?.visitas ?? 0) === 1 ? 'visita' : 'visitas'}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                          (metricas[pub.id]?.contactos ?? 0) > 0 ? 'border-brand/40 bg-brand-soft' : 'border-line bg-surface'
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={(metricas[pub.id]?.contactos ?? 0) > 0 ? 'text-brand' : 'text-muted'} aria-hidden="true">
                          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                        </svg>
                        <span className={`text-base font-extrabold leading-none ${(metricas[pub.id]?.contactos ?? 0) > 0 ? 'text-brand-dark' : 'text-ink'}`}>
                          {metricas[pub.id]?.contactos ?? 0}
                        </span>
                        <span className={`text-xs ${(metricas[pub.id]?.contactos ?? 0) > 0 ? 'font-semibold text-brand-dark' : 'text-muted'}`}>
                          {(metricas[pub.id]?.contactos ?? 0) === 1 ? 'contacto' : 'contactos'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {editandoId === pub.id && (
                  <form onSubmit={(e) => guardarEdicion(e, pub)} className="mt-3 space-y-3 border-t border-line pt-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">¿Qué es?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ valor: 'servicio', etiqueta: 'Servicio' }, { valor: 'producto', etiqueta: 'Producto' }].map((t) => (
                          <button key={t.valor} type="button" onClick={() => setForm({ ...form, tipo: t.valor, modo: t.valor === 'producto' && form.modo === 'convenir' ? 'precio' : form.modo })}
                            className={`h-9 rounded-lg border text-xs font-semibold transition ${form.tipo === t.valor ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-muted hover:text-ink'}`}>
                            {t.etiqueta}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Título</label>
                      <input required maxLength={80} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Categoría</label>
                      <select required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none">
                        {!CATEGORIAS.some((c) => c.valor === form.categoria) && form.categoria && <option value={form.categoria}>{form.categoria}</option>}
                        {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
                      </select>
                    </div>
                    {form.categoria === CATEGORIA_INMUEBLES && <AvisoInmueble />}
                    <div>
                      <label className="mb-1 block text-xs font-medium">Precio (COP)</label>
                      <div role="radiogroup" aria-label="Tipo de precio" className={`mb-2 grid gap-2 ${form.tipo === 'servicio' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {[
                          { valor: 'precio', etiqueta: 'Con precio' },
                          ...(form.tipo === 'servicio' ? [{ valor: 'convenir', etiqueta: 'A convenir' }] : []),
                          { valor: 'gratis', etiqueta: 'Lo regalo' },
                        ].map((o) => (
                          <button key={o.valor} type="button" role="radio" aria-checked={form.modo === o.valor} onClick={() => setForm({ ...form, modo: o.valor })}
                            className={`h-9 rounded-lg border text-xs font-semibold transition ${form.modo === o.valor ? (o.valor === 'gratis' ? 'border-gold bg-gold-bg text-gold-ink' : 'border-brand bg-brand-soft text-brand') : 'border-line bg-white text-muted hover:text-ink'}`}>
                            {o.etiqueta}
                          </button>
                        ))}
                      </div>
                      {form.modo === 'precio' && (
                        <input type="number" inputMode="numeric" min="1" required value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Ej. 45000" className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none" />
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Descripción</label>
                      <textarea required rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none" />
                    </div>
                    <p className="text-xs text-muted">Editar no cambia los días que le quedan al anuncio.</p>
                    <div className="flex gap-2">
                      <button type="submit" disabled={ocupado} className="h-10 flex-1 rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                        {ocupado ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button type="button" onClick={() => setEditandoId(null)} disabled={ocupado} className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted hover:text-ink">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <button onClick={() => (editandoId === pub.id ? setEditandoId(null) : empezarEdicion(pub))} disabled={ocupado} className={`${boton} border-line text-ink hover:bg-surface`}>
                    {editandoId === pub.id ? 'Cerrar edición' : 'Editar'}
                  </button>
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
