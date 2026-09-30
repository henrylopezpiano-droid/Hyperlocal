'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarPublicaciones() {
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando publicaciones:', error)
      } else {
        setPublicaciones(data || [])
      }
      setLoading(false)
    }

    cargarPublicaciones()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Mercado Hiperlocal</h1>
          <p className="text-gray-600">Conectando tu comunidad de manera directa y sin comisiones.</p>
        </header>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Publicaciones Recientes</h2>

          {loading ? (
            <p className="text-gray-500">Cargando productos y servicios...</p>
          ) : publicaciones.length === 0 ? (
            <p className="text-gray-500">Aún no hay publicaciones registradas en la base de datos.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {publicaciones.map((pub) => (
                <div key={pub.id} className="border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    {pub.imagen_url && (
                      <img src={pub.imagen_url} alt={pub.titulo} className="w-full h-48 object-cover rounded-md mb-3" />
                    )}
                    <span className="text-xs font-semibold uppercase px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {pub.categoria}
                    </span>
                    <h3 className="font-bold text-lg text-blue-700 mt-2">{pub.titulo}</h3>
                    <p className="text-gray-600 mt-1">{pub.descripcion}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">
                      ${pub.precio ? Number(pub.precio).toLocaleString() : '0'}
                    </span>
                    <span className="text-xs text-gray-500">{pub.barrio}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}