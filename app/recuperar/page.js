'use client'
import { useState } from 'react'
import { supabase } from '../../src/lib/supabase'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setMensaje('')
    setError(false)

    const { error: errorReset } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-clave`,
    })

    if (errorReset) {
      const limite = errorReset.status === 429 || /rate limit/i.test(errorReset.message)
      setMensaje(
        limite
          ? 'Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
          : 'No se pudo enviar el correo: ' + errorReset.message
      )
      setError(true)
    } else {
      // Mensaje igual exista o no el correo, para no revelar quién tiene cuenta
      setEnviado(true)
    }
    setEnviando(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Recuperar contraseña</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
        </p>

        {enviado ? (
          <p className="rounded-lg bg-brand-soft p-3 text-center text-sm text-brand-dark">
            Si ese correo tiene cuenta, te enviamos un enlace. Revisa tu bandeja y también la carpeta de spam.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Enviar enlace'}
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

        <div className="mt-5 text-center">
          <a href="/login" className="text-sm font-semibold text-brand hover:underline">
            Volver a iniciar sesión
          </a>
        </div>
      </div>
    </div>
  )
}