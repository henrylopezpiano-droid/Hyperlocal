'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PublicarPage() {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('Servicios')
  const [tipo, setTipo] = useState('servicio')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function verificarSesion() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMensaje('Debes iniciar sesión para publicar.')
        return
      }
      setUsuario(user)

      const { data: perfilData, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !perfilData) {
        setMensaje('No se encontró tu perfil de usuario.')
      } else {
        setPerfil(perfilData)
      }
    }
    verificarSesion()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!perfil || !perfil.verificado) {
      setMensaje('Tu cuenta aún no está verificada por el administrador para realizar publicaciones.')
      return
    }

    setCargando(true)
    setMensaje('Subiendo imagen y publicando...')

    let imagenUrlFinal = null

    // Si el usuario seleccionó una imagen, la subimos a Supabase Storage
    if (imagenArchivo) {
      const nombreArchivo = `${Date.now()}-${imagenArchivo.name.replace(/\s+/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(nombreArchivo, imagenArchivo)

      if (uploadError) {
        setMensaje('Error al subir la imagen: ' + uploadError.message)
        setCargando(false)
        return
      }

      // Obtenemos la URL pública de la imagen alojada en Supabase
      const { data: publicData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(nombreArchivo)

      imagenUrlFinal = publicData.publicUrl
    }

    // Insertamos la publicación con la URL de la imagen en la base de datos
    const { error } = await supabase.from('publicaciones').insert([
      {
        titulo,
        descripcion,
        precio: parseFloat(precio),
        categoria,
        tipo,
        imagen: imagenUrlFinal,
        user_id: usuario.id,
        barrio: perfil.barrio
      }
    ])

    if (error) {
      setMensaje('Error al publicar: ' + error.message)
    } else {
      setMensaje('¡Publicación creada con éxito!')
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setImagenArchivo(null)
      setCategoria('Servicios')
      setTipo('servicio')
    }
    setCargando(false)
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-4">Acceso Requerido</h1>
          <p className="text-slate-600 mb-4">Debes iniciar sesión para poder publicar en el mercado hiperlocal.</p>
          <a href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition">
            Ir a Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-blue-600 mb-1 text-center">Crear Publicación</h1>
        <p className="text-slate-500 text-sm mb-6 text-center">Comparte tu producto o servicio con tus vecinos</p>

        {perfil && !perfil.verificado && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm text-center">
            ⚠️ Tu cuenta está registrada pero <strong>pendiente de verificación</strong> por el administrador.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">¿Qué deseas publicar?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('servicio')}
                className={`py-2 px-4 rounded-xl border font-medium text-sm transition ${
                  tipo === 'servicio' 
                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🛠️ Servicio
              </button>
              <button
                type="button"
                onClick={() => setTipo('producto')}
                className={`py-2 px-4 rounded-xl border font-medium text-sm transition ${
                  tipo === 'producto' 
                    ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🛒 Producto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input 
              type="text" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              required 
              placeholder="Ej. Taladro percutor, Almuerzo casero..."
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría general</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
            >
              <option value="Servicios">Servicios (Oficios, reparaciones, etc.)</option>
              <option value="Alimentos">Alimentos y Comidas</option>
              <option value="Ropa">Ropa y Moda</option>
              <option value="Herramientas y Hogar">Herramientas y Hogar</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio (COP)</label>
            <input 
              type="number" 
              value={precio} 
              onChange={(e) => setPrecio(e.target.value)} 
              required 
              placeholder="Ej. 45000"
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto del producto o servicio</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImagenArchivo(e.target.files[0])} 
              className="w-full px-3 py-2 border rounded-xl text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">Sube una foto clara desde tu dispositivo.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              rows="3" 
              required 
              placeholder="Detalles, estado, horarios o condiciones..."
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={cargando || (perfil && !perfil.verificado)}
            className={`w-full py-3 rounded-xl font-medium text-white transition shadow-sm ${
              perfil && !perfil.verificado ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {cargando ? 'Publicando...' : 'Publicar Anuncio'}
          </button>
        </form>

        {mensaje && (
          <p className="mt-4 text-center text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {mensaje}
          </p>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm font-medium text-blue-600 hover:underline">
            ← Volver al Mercado
          </a>
        </div>
      </div>
    </div>
  )
}