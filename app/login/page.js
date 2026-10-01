'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [barrio, setBarrio] = useState('')
  const [telefono, setTelefono] = useState('')
  const [mensaje, setMensaje] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setMensaje('Procesando...')

    if (isRegistering) {
      // 1. Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setMensaje('Error al registrar: ' + authError.message)
        return
      }

      const user = authData.user
      if (user) {
        // 2. Guardar el perfil asociado con el ID del usuario recién creado
        const { error: perfilError } = await supabase.from('perfiles').insert([
          {
            id: user.id,
            nombre,
            barrio,
            telefono,
            verificado: false // Por defecto pendiente de aprobación
          }
        ])

        if (perfilError) {
          setMensaje('Cuenta creada, pero error en perfil: ' + perfilError.message)
        } else {
          setMensaje('¡Registro exitoso! Por favor verifica tu correo si es necesario o inicia sesión.')
          setIsRegistering(false)
        }
      }
    } else {
      // Iniciar sesión
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMensaje('Error al entrar: ' + error.message)
      } else {
        setMensaje('¡Inicio de sesión exitoso! Redirigiendo...')
        window.location.href = '/publicar'
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-600 mb-1 text-center">
          {isRegistering ? 'Registro de Vecino' : 'Iniciar Sesión'}
        </h1>
        <p className="text-slate-500 text-sm mb-6 text-center">Mercado Hiperlocal - Sin Comisiones</p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Barrio</label>
                <input 
                  type="text" 
                  value={barrio} 
                  onChange={(e) => setBarrio(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
                <input 
                  type="text" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setMensaje(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

        {mensaje && (
          <p className="mt-4 text-center text-sm font-medium text-slate-700 bg-slate-100 p-3 rounded-lg">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}