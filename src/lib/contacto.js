// Utilidades compartidas de contacto y textos.
// Para cambiar el nombre de la app en los mensajes y en la vista previa, edita solo esta línea.
export const NOMBRE_APP = 'Mercado Hiperlocal'

// El teléfono vive en la tabla "contactos" y solo llega a vecinos verificados.
export function telefonoDe(perfil) {
  const c = perfil?.contactos
  const t = Array.isArray(c) ? c[0]?.telefono : c?.telefono
  return t ? String(t).replace(/\D/g, '') : ''
}

export function enlaceWhatsApp(tel, nombre, titulo) {
  const texto = encodeURIComponent(
    `Hola ${nombre || 'vecino'}, vi tu publicación "${titulo}" en ${NOMBRE_APP} y me interesa.`
  )
  return `https://wa.me/${tel}?text=${texto}`
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
