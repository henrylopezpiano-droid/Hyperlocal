'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../src/lib/supabase'
import { telefonoDe, rutaEnStorage } from '../../src/lib/contacto'

function formatearCelular(tel) {
  const d = (tel || '').replace(/\D/g, '')
  const local = d.length === 12 && d.startsWith('57') ? d.slice(2) : d
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : tel || 'Sin celular'
}

export default function AdminPage() {
  const [estado, setEstado] = useState('cargando') // cargando | sinAcceso | ok
  const [miId, setMiId] = useState(null)
  const [perfiles, setPerfiles] = useState([])
  const [reportes, setReportes] = useState([])
  const [pestana, setPestana] = useState('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [procesandoId, setProcesandoId] = useState(null)
  const [aviso, setAviso] = useState('')
  const [esError, setEsError] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?volver=/admin'
        return
      }
      setMiId(user.id)

      // Solo los administradores aparecen en esta tabla
      const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      if (!admin) {
        setEstado('sinAcceso')
        return
      }

      const [perf, rep] = await Promise.all([
        supabase.from('perfiles').select('*, contactos (telefono)'),
        supabase
          .from('reportes')
          .select('id, motivo, detalle, created_at, publicaciones (id, titulo, imagen)')
          .eq('resuelto', false)
          .order('created_at', { ascending: false }),
      ])
      if (perf.error) {
        setAviso('No se pudo cargar la lista: ' + perf.error.message)
        setEsError(true)
      } else {
        setPerfiles(perf.data || [])
      }
      if (!rep.error) setReportes(rep.data || [])
      setEstado('ok')
    }
    cargar()
  }, [])

  const pendientes = useMemo(() => perfiles.filter((p) => !p.verificado), [perfiles])
  const verificados = useMemo(() => perfiles.filter((p) => p.verificado), [perfiles])

  const base = pestana === 'pendientes' ? pendientes : pestana === 'verificados' ? verificados : perfiles
  const q = busqueda.trim().toLowerCase()
  const qDigitos = q.replace(/\D/g, '')
  const lista = !q
    ? base
    : base.filter((p) => {
        const enTexto = [p.nombre, p.barrio, p.municipio].some((v) => (v || '').toLowerCase().includes(q))
        const enCelular = qDigitos && (telefonoDe(p) || '').replace(/\D/g, '').includes(qDigitos)
        return enTexto || enCelular
      })

  function avisar(texto, error = false) {
    setAviso(texto)
    setEsError(error)
  }

  async function cambiarVerificacion(perfil, valor) {
    setProcesandoId(perfil.id)
    setAviso('')

    // .select() permite saber si realmente se cambió la fila (si no hay permiso, vuelve vacío)
    const { data, error } = await supabase.from('perfiles').update({ verificado: valor }).eq('id', perfil.id).select('id')

    if (error || !data || data.length === 0) {
      avisar('No se pudo guardar el cambio. Revisa que tu cuenta tenga permisos de administrador.', true)
    } else {
      setPerfiles((prev) => prev.map((p) => (p.id === perfil.id ? { ...p, verificado: valor } : p)))
      avisar(valor ? `${perfil.nombre} ya es vecino verificado.` : `Se quitó la verificación a ${perfil.nombre}.`)
    }
    setProcesandoId(null)
  }

  async function eliminarUsuario(perfil) {
    const respuesta = window.prompt(
      `Vas a eliminar a ${perfil.nombre || 'este usuario'}, con todos sus anuncios y sus datos. Esto no se puede deshacer.\n\nEscribe ELIMINAR para confirmar.`
    )
    if (!respuesta || respuesta.trim().toUpperCase() !== 'ELIMINAR') return

    setProcesandoId(perfil.id)
    setAviso('')

    // Antes de borrar, guardamos cuáles eran sus anuncios y fotos
    const { data: anuncios } = await supabase.from('publicaciones').select('id, imagen').eq('user_id', perfil.id)

    const { error } = await supabase.rpc('admin_eliminar_usuario', { p_user_id: perfil.id })
    if (error) {
      avisar('No se pudo eliminar: ' + error.message, true)
      setProcesandoId(null)
      return
    }

    // Borra las fotos para no dejar archivos huérfanos
    const rutas = (anuncios || []).map((a) => rutaEnStorage(a.imagen)).filter(Boolean)
    if (rutas.length > 0) await supabase.storage.from('imagenes').remove(rutas)

    const idsAnuncios = new Set((anuncios || []).map((a) => a.id))
    setPerfiles((prev) => prev.filter((p) => p.id !== perfil.id))
    setReportes((prev) => prev.filter((r) => !idsAnuncios.has(r.publicaciones?.id)))
    avisar(`Se eliminó a ${perfil.nombre || 'el usuario'} y todos sus datos.`)
    setProcesandoId(null)
  }

  async function descartarReporte(rep) {
    setProcesandoId(rep.id)
    const { data, error } = await supabase.from('reportes').update({ resuelto: true }).eq('id', rep.id).select('id')
    if (error || !data || data.length === 0) avisar('No se pudo descartar el reporte.', true)
    else {
      setReportes((prev) => prev.filter((r) => r.id !== rep.id))
      avisar('Reporte descartado.')
    }
    setProcesandoId(null)
  }

  async function eliminarAnuncio(rep) {
    const pub = rep.publicaciones
    if (!pub) return
    if (!window.confirm(`¿Eliminar el anuncio "${pub.titulo}"? Se cierran también los reportes sobre él.`)) return
    setProcesandoId(rep.id)

    const { data, error } = await supabase.from('publicaciones').delete().eq('id', pub.id).select('id')
    if (error || !data || data.length === 0) {
      avisar('No se pudo eliminar el anuncio. ¿Ejecutaste el SQL de la actualización?', true)
    } else {
      const ruta = rutaEnStorage(pub.imagen)
      if (ruta) await supabase.storage.from('imagenes').remove([ruta])
      setReportes((prev) => prev.filter((r) => r.publicaciones?.id !== pub.id))
      avisar('Anuncio eliminado.')
    }
    setProcesandoId(null)
  }

  if (estado === 'cargando') {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-muted">Cargando...</div>
  }

  if (estado === 'sinAcceso') {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-extrabold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted">Esta sección es solo para administradores.</p>
          <a href="/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">← Volver al inicio</a>
        </div>
      </div>
    )
  }

  const pestanas = [
    { id: 'pendientes', etiqueta: `Pendientes (${pendientes.length})` },
    { id: 'verificados', etiqueta: `Verificados (${verificados.length})` },
    { id: 'todos', etiqueta: `Todos (${perfiles.length})` },
    { id: 'reportes', etiqueta: `Reportes (${reportes.length})` },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Administración</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Verifica vecinos escribiéndoles por WhatsApp, revisa los anuncios reportados y administra las cuentas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {pestanas.map((t) => (
          <button
            key={t.id}
            onClick={() => setPestana(t.id)}
            className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${
              pestana === t.id ? 'bg-brand text-white' : 'border border-line bg-white text-muted hover:text-ink'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {pestana !== 'reportes' && (
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, barrio o celular..."
          className="mb-4 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none"
        />
      )}

      {aviso && (
        <p className={`mb-4 rounded-lg p-3 text-sm ${esError ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>{aviso}</p>
      )}

      {pestana === 'reportes' ? (
        reportes.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">No hay reportes pendientes.</div>
        ) : (
          <ul className="space-y-3">
            {reportes.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="h-16 w-16 flex-none overflow-hidden rounded-lg bg-surface">
                    {r.publicaciones?.imagen && <img src={r.publicaciones.imagen} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    {r.publicaciones ? (
                      <a href={`/anuncio/${r.publicaciones.id}`} target="_blank" rel="noopener noreferrer" className="block truncate font-bold hover:underline">
                        {r.publicaciones.titulo}
                      </a>
                    ) : (
                      <p className="font-bold">Anuncio eliminado</p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-red-700">{r.motivo}</p>
                    {r.detalle && <p className="mt-0.5 text-sm text-muted">{r.detalle}</p>}
                    <p className="mt-1 text-xs text-muted">{new Date(r.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <button onClick={() => eliminarAnuncio(r)} disabled={procesandoId === r.id || !r.publicaciones} className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                    Eliminar anuncio
                  </button>
                  <button onClick={() => descartarReporte(r)} disabled={procesandoId === r.id} className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-muted transition hover:text-ink disabled:opacity-60">
                    Descartar reporte
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          {q
            ? 'Ningún vecino coincide con la búsqueda.'
            : pestana === 'pendientes'
              ? 'No hay vecinos pendientes por verificar.'
              : pestana === 'verificados'
                ? 'Todavía no hay vecinos verificados.'
                : 'Todavía no hay vecinos registrados.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => {
            const tel = telefonoDe(p)
            const texto = encodeURIComponent(
              `Hola ${p.nombre || ''}, te escribo de Mercado Hiperlocal. Para verificar tu cuenta, ¿me confirmas que vives en ${p.barrio || 'el barrio'}${p.municipio ? ` (${p.municipio})` : ''} y en qué conjunto o calle? Gracias.`
            )
            return (
              <li key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {p.nombre || 'Sin nombre'}
                      {p.verificado && (
                        <span className="ml-2 rounded-md bg-brand-soft px-2 py-0.5 align-middle text-xs font-semibold text-brand">
                          Verificado
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {p.barrio || 'Sin barrio'}
                      {p.municipio ? ` · ${p.municipio}` : ''}
                    </p>
                    <p className="text-sm text-muted">
                      {formatearCelular(tel)}
                      {p.created_at ? ` · registrado el ${new Date(p.created_at).toLocaleDateString('es-CO')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tel && (
                      <a href={`https://wa.me/${tel}?text=${texto}`} target="_blank" rel="noopener noreferrer" className="h-10 rounded-lg border border-brand px-3 text-sm font-semibold leading-10 text-brand transition hover:bg-brand-soft">
                        Confirmar por WhatsApp
                      </a>
                    )}
                    {p.verificado ? (
                      <button onClick={() => cambiarVerificacion(p, false)} disabled={procesandoId === p.id} className="h-10 rounded-lg border border-line px-3 text-sm font-semibold text-muted transition hover:text-ink disabled:opacity-60">
                        Quitar verificación
                      </button>
                    ) : (
                      <button onClick={() => cambiarVerificacion(p, true)} disabled={procesandoId === p.id} className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                        {procesandoId === p.id ? 'Guardando...' : 'Verificar'}
                      </button>
                    )}
                    {p.id !== miId && (
                      <button onClick={() => eliminarUsuario(p)} disabled={procesandoId === p.id} className="h-10 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                        Eliminar usuario
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}