// Parte del servidor: genera el título y la foto que WhatsApp muestra al compartir el enlace
import { supabase } from '../../../src/lib/supabase'
import { NOMBRE_APP } from '../../../src/lib/contacto'
import AnuncioCliente from './AnuncioCliente'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data } = await supabase
    .from('publicaciones')
    .select('titulo, descripcion, imagen')
    .eq('id', id)
    .maybeSingle()

  if (!data) return { title: NOMBRE_APP }
  const descripcion = (data.descripcion || '').slice(0, 160)
  return {
    title: `${data.titulo} · ${NOMBRE_APP}`,
    description: descripcion,
    openGraph: {
      title: data.titulo,
      description: descripcion,
      images: data.imagen ? [data.imagen] : [],
    },
  }
}

export default async function PaginaAnuncio({ params }) {
  const { id } = await params
  return <AnuncioCliente id={id} />
}
