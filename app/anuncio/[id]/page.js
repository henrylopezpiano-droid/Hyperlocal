// Parte del servidor: genera el título y la foto que WhatsApp muestra al compartir el enlace
import { supabase } from '../../../src/lib/supabase'
import { NOMBRE_APP, precioTexto, fotosDe } from '../../../src/lib/contacto'
import AnuncioCliente from './AnuncioCliente'

export const dynamic = 'force-dynamic'

// Recorta en el límite de una palabra para que no se corte a la mitad
function resumen(texto, max) {
  const t = (texto || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  return corte.slice(0, Math.max(corte.lastIndexOf(' '), 40)).trim() + '…'
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data } = await supabase
    .from('publicaciones')
    .select('titulo, descripcion, imagen, imagenes, precio, barrio')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { title: NOMBRE_APP }
  // Ej.: "Queso de cabeza artesanal · $15.000 · El Llano"
  const titulo = [data.titulo, precioTexto(data.precio), data.barrio].filter(Boolean).join(' · ')
  const descripcion = resumen(data.descripcion, 110)
  const foto = fotosDe(data)[0]
  return {
    title: `${titulo} · ${NOMBRE_APP}`,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      siteName: NOMBRE_APP,
      images: foto ? [foto] : [],
    },
  }
}

export default async function PaginaAnuncio({ params }) {
  const { id } = await params
  return <AnuncioCliente id={id} />
}
