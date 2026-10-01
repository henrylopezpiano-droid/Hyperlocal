'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../src/lib/supabase'

function formatearCelular(tel) {
  const d = (tel || '').replace(/\D/g, '')
  const local = d.length === 12 && d.startsWith('57') ? d.slice(2) : d
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : tel || 'Sin celular'
}

export default function AdminPage() {
  const [estado, setEstado] = useState('cargando') // cargando | sinAcceso | ok
  const [perfiles, setPerfiles] = useState([])
  const [pestana, setPestana] = useState('pendientes')
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

      // Solo los administradores aparecen en esta tabla
      const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      if (!admin) {
        setEstado('sinAcceso')
        return
      }

      const { data, error } = await supabase.from('perfiles').select('*')
      if (error) {
        setAviso('No se pudo cargar la lista: ' + error.message)
        setEsError(true)
      } else {
        setPerfiles(data || [])
      }
      setEstado('ok')
    }
    cargar()
  }, [])

  const pendientes = useMemo(() => perfiles.filter((p) => !p.verificado), [perfiles])
  const verificados = useMemo(() => perfiles.filter((p) => p.verificado), [perfiles])
  const lista = pestana === 'pendientes' ? pendientes : verificados

  async function cambiarVerificacion(perfil, valor) {
    setProcesandoId(perfil.id)
    setAviso('')

    // .select() permite saber si realmente se cambió la fila (si no hay permiso, vuelve vacío)
    const { data, error } = await supabase
      .from('perfiles')
      .update({ verificado: valor })
      .eq('id', perfil.id)
      .select('id')

    if (error || !data || data.length === 0) {
      setAviso('No se pudo guardar el cambio. Revisa que tu cuenta tenga permisos de administrador.')
      setEsError(true)
    } else {
      setPerfiles((prev) => prev.map((p) => (p.id === perfil.id ? { ...p, verificado: valor } : p)))
      setAviso(valor ? `${perfil.nombre} ya es vecino verificado.` : `Se quitó la verificación a ${perfil.nombre}.`)
      setEsError(false)
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
          <a href="/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            ← Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Verificar vecinos</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Escríbeles por WhatsApp para confirmar que viven en el barrio y luego verifica su cuenta con un clic.
      </p>

      <div className="mb-4 flex gap-2">
        {[
          { id: 'pendientes', etiqueta: `Pendientes (${pendientes.length})` },
          { id: 'verificados', etiqueta: `Verificados (${verificados.length})` },
        ].map((t) => (
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

      {aviso && (
        <p className={`mb-4 rounded-lg p-3 text-sm ${esError ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>
          {aviso}
        </p>
      )}

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
          {pestana === 'pendientes' ? 'No hay vecinos pendientes por verificar.' : 'Todavía no hay vecinos verificados.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => {
            const tel = (p.telefono || '').replace(/\D/g, '')
            const texto = encodeURIComponent(
              `Hola ${p.nombre || ''}, te escribo de Mercado Hiperlocal. Para verificar tu cuenta, ¿me confirmas que vives en ${p.barrio || 'el barrio'}${p.municipio ? ` (${p.municipio})` : ''} y en qué conjunto o calle? Gracias.`
            )
            return (
              <li key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.nombre || 'Sin nombre'}</p>
                    <p className="text-sm text-muted">
                      {p.barrio || 'Sin barrio'}
                      {p.municipio ? ` · ${p.municipio}` : ''}
                    </p>
                    <p className="text-sm text-muted">
                      {formatearCelular(p.telefono)}
                      {p.created_at ? ` · registrado el ${new Date(p.created_at).toLocaleDateString('es-CO')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tel && (
                      <a
                        href={`https://wa.me/${tel}?text=${texto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-lg border border-brand px-3 text-sm font-semibold leading-10 text-brand transition hover:bg-brand-soft"
                      >
                        Confirmar por WhatsApp
                      </a>
                    )}
                    {p.verificado ? (
                      <button
                        onClick={() => cambiarVerificacion(p, false)}
                        disabled={procesandoId === p.id}
                        className="h-10 rounded-lg border border-line px-3 text-sm font-semibold text-muted transition hover:text-ink disabled:opacity-60"
                      >
                        Quitar verificación
                      </button>
                    ) : (
                      <button
                        onClick={() => cambiarVerificacion(p, true)}
                        disabled={procesandoId === p.id}
                        className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                      >
                        {procesandoId === p.id ? 'Guardando...' : 'Verificar'}
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
