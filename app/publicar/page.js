'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import { CATEGORIAS } from '../../src/lib/categorias'
import { comprimirImagen } from '../../src/lib/imagenes'

const MAX_FOTOS = 3
const MAX_BYTES = 30 * 1024 * 1024

const campo =
  'w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none'

export default function PublicarPage() {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [gratis, setGratis] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [tipo, setTipo] = useState('servicio')
  const [fotos, setFotos] = useState([]) // archivos elegidos (la primera es la principal)
  const [previas, setPrevias] = useState([]) // vistas previas de esos archivos
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

  // Vistas previas de las fotos elegidas
  useEffect(() => {
    const urls = fotos.map((f) => URL.createObjectURL(f))
    setPrevias(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [fotos])

  function avisar(texto, esError = false) {
    setMensaje(texto)
    setError(esError)
  }

  function agregarFotos(e) {
    const nuevas = Array.from(e.target.files || [])
    e.target.value = '' // permite volver a elegir la misma foto
    if (nuevas.length === 0) return

    const validas = nuevas.filter((f) => f.size <= MAX_BYTES)
    const espacio = MAX_FOTOS - fotos.length
    const aceptadas = validas.slice(0, espacio)
    setFotos([...fotos, ...aceptadas])

    if (validas.length < nuevas.length) avisar('Alguna foto es demasiado grande y no se agregó.', true)
    else if (validas.length > espacio) avisar(`Máximo ${MAX_FOTOS} fotos por anuncio.`, true)
    else avisar('')
  }

  function quitarFoto(i) {
    setFotos(fotos.filter((_, j) => j !== i))
    avisar('')
  }

  function hacerPrincipal(i) {
    setFotos([fotos[i], ...fotos.filter((_, j) => j !== i)])
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

    setCargando(true)

    const subidos = [] // rutas ya subidas a Storage
    const urls = []
    // Si algo falla, se borran las fotos ya subidas para no dejar archivos sueltos
    async function limpiar() {
      if (subidos.length) await supabase.storage.from('imagenes').remove(subidos)
    }

    for (let i = 0; i < fotos.length; i++) {
      avisar(fotos.length > 1 ? `Subiendo foto ${i + 1} de ${fotos.length}...` : 'Subiendo la foto...')
      // Reduce cada foto en el navegador antes de subirla (ahorra datos y espacio)
      const foto = await comprimirImagen(fotos[i])
      const extension = foto.type === 'image/jpeg' ? 'jpg' : (foto.name.split('.').pop() || 'jpg').toLowerCase()
      const nombreArchivo = `${usuario.id}-${Date.now()}-${i}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('imagenes')
        .upload(nombreArchivo, foto, { contentType: foto.type || 'image/jpeg', cacheControl: '31536000' })

      if (errorSubida) {
        await limpiar()
        avisar(`Error al subir la foto ${i + 1}: ` + errorSubida.message, true)
        setCargando(false)
        return
      }
      subidos.push(nombreArchivo)
      urls.push(supabase.storage.from('imagenes').getPublicUrl(nombreArchivo).data.publicUrl)
    }

    avisar('Publicando...')

    const { error: errorInsert } = await supabase.from('publicaciones').insert([
      {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: precioNumero,
        categoria,
        tipo,
        imagen: urls[0] || null, // la principal, la que se ve en la portada
        imagenes: urls,
        user_id: usuario.id,
        barrio: perfil.barrio,
      },
    ])

    if (errorInsert) {
      await limpiar()
      avisar('Error al publicar: ' + errorInsert.message, true)
    } else {
      avisar('¡Publicación creada con éxito!')
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setGratis(false)
      setFotos([])
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
            <label className="mb-1 block text-sm font-medium">
              Fotos <span className="font-normal text-muted">(hasta {MAX_FOTOS})</span>
            </label>

            {previas.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {previas.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface">
                    <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => quitarFoto(i)}
                      aria-label={`Quitar foto ${i + 1}`}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-sm font-bold leading-none text-red-600 shadow"
                    >
                      ×
                    </button>
                    {i === 0 ? (
                      <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-center text-[10px] font-semibold text-brand">
                        Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => hacerPrincipal(i)}
                        className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-center text-[10px] font-semibold text-muted hover:text-brand"
                      >
                        Hacer principal
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {fotos.length < MAX_FOTOS ? (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={agregarFotos}
                className="w-full cursor-pointer rounded-lg border border-line bg-white p-2 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand"
              />
            ) : (
              <p className="rounded-lg bg-surface p-2 text-center text-xs text-muted">Llegaste al máximo de {MAX_FOTOS} fotos.</p>
            )}
            <p className="mt-1 text-xs text-muted">
              La principal es la que se ve en la portada. Sube las fotos que quieras: las ajustamos automáticamente.
            </p>
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
