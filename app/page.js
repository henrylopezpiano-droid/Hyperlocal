'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [publicaciones, setPublicaciones] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function obtenerPublicaciones() {
      setCargando(true)
      const { data, error } = await supabase
        .from('publicaciones')
        .select(`
          *,
          perfiles (
            nombre,
            telefono,
            barrio
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar publicaciones:', error.message)
      } else {
        setPublicaciones(data || [])
      }
      setCargando(false)
    }

    obtenerPublicaciones()
  }, [])

  const publicacionesFiltradas = publicaciones.filter(pub => {
    const coincideTipo = filtroTipo === 'todos' || pub.tipo === filtroTipo
    const coincideCat = filtroCategoria === 'todas' || pub.categoria === filtroCategoria
    return coincideTipo && coincideCat
  })

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">Mercado Hiperlocal</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Conectando tu comunidad de manera directa y sin comisiones.</p>
          <div className="mt-4">
            <a 
              href="/publicar" 
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm text-sm sm:text-base"
            >
              + Publicar Anuncio
            </a>
          </div>
        </div>

        {/* Filtros modernos */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto justify-center overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                filtroTipo === 'todos' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('servicio')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                filtroTipo === 'servicio' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🛠️ Servicios
            </button>
            <button
              onClick={() => setFiltroTipo('producto')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                filtroTipo === 'producto' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🛒 Productos
            </button>
          </div>

          <div className="w-full md:w-auto">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas las categorías</option>
              <option value="Servicios">Servicios</option>
              <option value="Alimentos">Alimentos y Comidas</option>
              <option value="Ropa">Ropa y Moda</option>
              <option value="Herramientas y Hogar">Herramientas y Hogar</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        {/* Sección de Anuncios */}
        <h2 className="text-xl font-bold text-slate-800 mb-6">Publicaciones Recientes</h2>

        {cargando ? (
          <p className="text-center text-slate-500 py-12">Cargando anuncios de la comunidad...</p>
        ) : publicacionesFiltradas.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md mx-auto">
            <p className="text-slate-600 mb-3">No hay publicaciones disponibles con estos filtros.</p>
            <a href="/publicar" className="text-blue-600 font-medium hover:underline text-sm">
              ¡Sé el primero en publicar algo en tu barrio!
            </a>
          </div>
        ) : (
          /* Grilla optimizada con tarjetas de ancho controlado */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {publicacionesFiltradas.map((pub) => {
              const vendedor = pub.perfiles || {}
              const telefonoLimpio = vendedor.telefono ? vendedor.telefono.replace(/\D/g, '') : ''
              const mensajeWp = encodeURIComponent(`Hola ${vendedor.nombre || 'vecino'}, vi tu publicación "${pub.titulo}" en el Mercado Hiperlocal y me interesa.`)
              const enlaceWp = telefonoLimpio ? `https://wa.me/${telefonoLimpio}?text=${mensajeWp}` : '#'

              return (
                <div key={pub.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between w-full max-w-sm hover:shadow-md transition duration-200">
                  <div>
                    {/* Imagen en formato cuadrado perfecto (1:1) o aviso por defecto */}
                    {pub.imagen ? (
                      <div className="w-full aspect-square bg-slate-100 overflow-hidden">
                        <img 
                          src={pub.imagen} 
                          alt={pub.titulo} 
                          className="w-full h-full object-cover hover:scale-105 transition duration-300" 
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-sm border-b border-slate-100">
                        <span className="text-3xl mb-1">📦</span>
                        <span>Sin imagen</span>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wide">
                          {pub.tipo}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {pub.barrio || vendedor.barrio || 'Zona'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{pub.titulo}</h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{pub.descripcion}</p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 mt-auto">
                    <div className="border-t pt-4 flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs text-slate-400 block">Precio</span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          ${pub.precio?.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Vendedor</span>
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[110px] block">
                          {vendedor.nombre || 'Vecino'}
                        </span>
                      </div>
                    </div>

                    {telefonoLimpio ? (
                      <a
                        href={enlaceWp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        💬 Contactar por WhatsApp
                      </a>
                    ) : (
                      <div className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl text-sm text-center italic">
                        WhatsApp no disponible
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}