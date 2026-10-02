'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import CampoClave from '../components/CampoClave'

export default function NuevaClavePage() {
  const [listo, setListo] = useState(false) // hay sesión de recuperación válida
  const [revisado, setRevisado] = useState(false)
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const { data: suscripcion } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') {
        setListo(true)
        setRevisado(true)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setListo(true)
      setRevisado(true)
    })

    return () => suscripcion.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMensaje('')
    setError(false)

    if (clave !== clave2) {
      setMensaje('Las contraseñas no coinciden.')
      setError(true)
      return
    }

    setGuardando(true)
    const { error: errorUpdate } = await supabase.auth.updateUser({ password: clave })

    if (errorUpdate) {
      setMensaje('No se pudo cambiar la contraseña: ' + errorUpdate.message)
      setError(true)
      setGuardando(false)
    } else {
      setMensaje('¡Contraseña actualizada! Te llevamos a la página principal...')
      setTimeout(() => (window.location.href = '/'), 1500)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Crea tu nueva contraseña</h1>

        {!revisado ? (
          <p className="mt-4 text-sm text-muted">Verificando enlace...</p>
        ) : !listo ? (
          <div className="mt-4 text-sm">
            <p className="rounded-lg bg-red-50 p-3 text-red-700">
              Este enlace no es válido o ya venció. Pide uno nuevo.
            </p>
            <a href="/recuperar" className="mt-4 inline-block font-semibold text-brand hover:underline">
              Pedir un enlace nuevo
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <CampoClave
              etiqueta="Contraseña nueva"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
            <CampoClave
              etiqueta="Repite la contraseña"
              value={clave2}
              onChange={(e) => setClave2(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
            <button
              type="submit"
              disabled={guardando}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {mensaje && (
          <p
            className={`mt-4 rounded-lg p-3 text-center text-sm ${
              error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'
            }`}
          >
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}