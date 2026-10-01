'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import { CATEGORIAS } from '../../src/lib/categorias'

const campo =
  'w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none'

export default function PublicarPage() {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [gratis, setGratis] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState('servicio')
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function verificarSesion() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?volver=/publicar'
        return
      }
      setUsuario(user)

      const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      setPerfil(perfilData || null)
      setVerificando(false)
    }
    verificarSesion()
  }, [])

  function avisar(texto, esError = false) {
    setMensaje(texto)
    setError(esError)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!perfil || !perfil.verificado) {
      avisar('Tu cuenta aún no está verificada por el administrador.', true)
      return
    }

    const precioNumero = gratis ? 0 : parseInt(precio, 10)
    if (!gratis && (!precioNumero || precioNumero <= 0)) {
      avisar('Escribe un precio válido o marca "Lo regalo".', true)
      return
    }
    if (imagenArchivo && imagenArchivo.size > 5 * 1024 * 1024) {
      avisar('La foto es muy pesada. Máximo 5 MB.', true)
      return
    }

    setCargando(true)
    avisar('Publicando...')

    let imagenUrl = null
    if (imagenArchivo) {
      const extension = (imagenArchivo.name.split('.').pop() || 'jpg').toLowerCase()
      const nombreArchivo = `${usuario.id}-${Date.now()}.${extension}`
      const { error: errorSubida } = await supabase.storage.from('imagenes').upload(nombreArchivo, imagenArchivo)

      if (errorSubida) {
        avisar('Error al subir la foto: ' + errorSubida.message, true)
        setCargando(false)
        return
      }
      const { data: publicData } = supabase.storage.from('imagenes').getPublicUrl(nombreArchivo)
      imagenUrl = publicData.publicUrl
    }

    const { error: errorInsert } = await supabase.from('publicaciones').insert([
      {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: precioNumero,
        categoria,
        tipo,
        imagen: imagenUrl,
        user_id: usuario.id,
        barrio: perfil.barrio,
      },
    ])

    if (errorInsert) {
      avisar('Error al publicar: ' + errorInsert.message, true)
    } else {
      avisar('¡Publicación creada con éxito!')
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setGratis(false)
      setImagenArchivo(null)
      setCategoria('')
      setTipo('servicio')
      e.target.reset()
    }
    setCargando(false)
  }

  if (verificando) {
    return <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-muted">Cargando...</div>
  }

  const pendiente = !perfil || !perfil.verificado

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Crear publicación</h1>
        <p className="mb-5 mt-1 text-sm text-muted">
          Comparte tu producto o servicio con tus vecinos{perfil?.barrio ? ` de ${perfil.barrio}` : ''}.
        </p>

        {pendiente && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Tu cuenta está registrada pero <strong>pendiente de verificación</strong>. Podrás publicar cuando el
            administrador te apruebe.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">¿Qué deseas publicar?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { valor: 'servicio', etiqueta: 'Servicio' },
                { valor: 'producto', etiqueta: 'Producto' },
              ].map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`h-11 rounded-lg border text-sm font-semibold transition ${
                    tipo === t.valor ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-white text-muted hover:text-ink'
                  }`}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={80}
              placeholder="Ej. Taladro percutor, Almuerzo casero..."
              className={`${campo} h-11`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} required className={`${campo} h-11`}>
              <option value="">Elige una categoría...</option>
              {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Precio (COP)</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={gratis ? '' : precio}
              onChange={(e) => setPrecio(e.target.value)}
              required={!gratis}
              disabled={gratis}
              placeholder={gratis ? 'Gratis' : 'Ej. 45000'}
              className={`${campo} h-11 disabled:bg-surface`}
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-gold-soft bg-gold-bg/50 p-3 text-sm">
              <input
                type="checkbox"
                checked={gratis}
                onChange={(e) => setGratis(e.target.checked)}
                className="h-4 w-4 accent-[#1f7a4d]"
              />
              <span>
                <strong>Lo regalo</strong> <span className="text-muted">— sin costo para el vecino</span>
              </span>
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagenArchivo(e.target.files[0] || null)}
              className="w-full cursor-pointer rounded-lg border border-line bg-white p-2 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand"
            />
            <p className="mt-1 text-xs text-muted">Una foto clara. Máximo 5 MB.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              required
              placeholder="Detalles, estado, horarios o condiciones..."
              className={`${campo} py-2`}
            />
          </div>

          <button
            type="submit"
            disabled={cargando || pendiente}
            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            {cargando ? 'Publicando...' : 'Publicar anuncio'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-4 rounded-lg p-3 text-center text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>
            {mensaje}
          </p>
        )}

        <div className="mt-5 text-center">
          <a href="/mis-publicaciones" className="text-sm font-semibold text-brand hover:underline">
            Ver mis publicaciones
          </a>
        </div>
      </div>
    </div>
  )
}
