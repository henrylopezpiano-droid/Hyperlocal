// Utilidades compartidas de contacto y textos.
// Para cambiar el nombre de la app en los mensajes y en la vista previa, edita solo esta línea.
export const NOMBRE_APP = 'Mercado Hiperlocal'

// WhatsApp necesita el indicativo del país. Si un celular colombiano de 10 dígitos
// (empieza por 3) llega sin el 57, se lo agregamos para que el enlace no falle.
export function normalizarCelular(valor) {
  const d = String(valor || '').replace(/\D/g, '')
  return d.length === 10 && d.startsWith('3') ? '57' + d : d
}

// El teléfono vive en la tabla "contactos" y solo llega a vecinos verificados.
export function telefonoDe(perfil) {
  const c = perfil?.contactos
  const t = Array.isArray(c) ? c[0]?.telefono : c?.telefono
  return t ? normalizarCelular(t) : ''
}

export function enlaceWhatsApp(tel, nombre, titulo) {
  const texto = encodeURIComponent(
    `Hola ${nombre || 'vecino'}, vi tu publicación "${titulo}" en ${NOMBRE_APP} y me interesa.`
  )
  return `https://wa.me/${normalizarCelular(tel)}?text=${texto}`
}

export function precioTexto(precio) {
  return precio === 0 ? 'Gratis' : `$${Number(precio || 0).toLocaleString('es-CO')}`
}

// Saca la ruta del archivo dentro del bucket a partir de la URL pública
export function rutaEnStorage(url) {
  if (!url) return null
  const partes = url.split('/imagenes/')
  return partes.length > 1 ? decodeURIComponent(partes[1].split('?')[0]) : null
}

// Lista de fotos de un anuncio. Los anuncios viejos solo tienen "imagen".
export function fotosDe(pub) {
  const lista = Array.isArray(pub?.imagenes) ? pub.imagenes.filter(Boolean) : []
  if (lista.length) return lista
  return pub?.imagen ? [pub.imagen] : []
}

// Rutas en Storage de todas las fotos del anuncio (para borrarlas)
export function rutasEnStorage(pub) {
  return fotosDe(pub).map(rutaEnStorage).filter(Boolean)
}
