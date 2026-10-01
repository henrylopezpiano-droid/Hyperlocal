'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../src/lib/supabase'

// Devuelve el telefono con indicativo de Colombia (57) o null si es invalido
function normalizarTelefono(valor) {
  const d = valor.replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('3')) return '57' + d
  if (d.length === 12 && d.startsWith('57')) return d
  return null
}

// A dónde volver después de ingresar (solo rutas internas)
function destino() {
  const v = new URLSearchParams(window.location.search).get('volver')
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/'
}

const campo =
  'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none'

export default function LoginPage() {
  const [registrando, setRegistrando] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [barrio, setBarrio] = useState('')
  const [barrios, setBarrios] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function cargarBarrios() {
      const { data, error } = await supabase.from('barrios').select('municipio, nombre').order('nombre')
      if (error) console.error('Error al cargar barrios:', error.message)
      else setBarrios(data || [])
    }
    cargarBarrios()
  }, [])

  const municipios = useMemo(
    () => [...new Set(barrios.map((b) => b.municipio))].sort((a, b) => a.localeCompare(b, 'es')),
    [barrios]
  )
  const barriosDelMunicipio = useMemo(
    () => barrios.filter((b) => b.municipio === municipio),
    [barrios, municipio]
  )

  function avisar(texto, esError = false) {
    setMensaje(texto)
    setError(esError)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setEnviando(true)
    avisar('Procesando...')

    if (registrando) {
      const tel = normalizarTelefono(telefono)
      if (!tel) {
        avisar('Escribe un celular válido de 10 dígitos, por ejemplo 3001234567.', true)
        setEnviando(false)
        return
      }
      if (!municipio || !barrio) {
        avisar('Elige tu municipio y tu barrio.', true)
        setEnviando(false)
        return
      }

      // El perfil lo crea un trigger en la base de datos con estos datos
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre: nombre.trim(), municipio, barrio, telefono: tel } },
      })

      if (authError) {
        avisar('Error al registrar: ' + authError.message, true)
      } else if (data.session) {
        avisar('¡Cuenta creada! Un administrador debe verificarte antes de que puedas publicar.')
        setTimeout(() => (window.location.href = destino()), 1500)
      } else {
        avisar('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
        setRegistrando(false)
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        avisar('Correo o contraseña incorrectos.', true)
      } else {
        window.location.href = destino()
        return
      }
    }
    setEnviando(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {registrando ? 'Únete a tus vecinos' : 'Bienvenido de nuevo'}
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          {registrando
            ? 'Regístrate para publicar y contactar. Explorar no requiere cuenta.'
            : 'Inicia sesión para contactar vecinos y gestionar tus anuncios.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {registrando && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre completo</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={campo} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Celular / WhatsApp</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  placeholder="3001234567"
                  className={campo}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Municipio</label>
                  <select
                    value={municipio}
                    onChange={(e) => { setMunicipio(e.target.value); setBarrio('') }}
                    required
                    className={campo}
                  >
                    <option value="">Elige...</option>
                    {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Barrio</label>
                  <select
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    required
                    disabled={!municipio}
                    className={`${campo} disabled:bg-surface disabled:text-muted`}
                  >
                    <option value="">{municipio ? 'Elige...' : 'Primero el municipio'}</option>
                    {barriosDelMunicipio.map((b) => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={campo} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={campo} />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {registrando ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-4 rounded-lg p-3 text-center text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>
            {mensaje}
          </p>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => { setRegistrando(!registrando); setMensaje('') }}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {registrando ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}
