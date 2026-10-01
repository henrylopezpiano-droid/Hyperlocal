// Reduce y comprime una foto en el navegador antes de subirla.
// Una foto de celular (3 a 8 MB) queda en ~200-400 KB sin que se note en pantalla.
// Si algo falla, devuelve la foto original para no bloquear la publicación.

const MAX_LADO = 1280 // píxeles del lado más largo
const CALIDAD = 0.8 // calidad JPEG (0 a 1)

async function cargarImagen(archivo) {
  // Respeta la orientación de la foto (EXIF) en los navegadores modernos
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    } catch (_) {
      // sigue con el método alterno
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function comprimirImagen(archivo, { maxLado = MAX_LADO, calidad = CALIDAD } = {}) {
  if (!archivo || !archivo.type || !archivo.type.startsWith('image/')) return archivo
  // No se tocan GIF ni SVG
  if (archivo.type === 'image/gif' || archivo.type === 'image/svg+xml') return archivo

  try {
    const imagen = await cargarImagen(archivo)
    const ancho0 = imagen.naturalWidth || imagen.width
    const alto0 = imagen.naturalHeight || imagen.height
    if (!ancho0 || !alto0) return archivo

    const escala = Math.min(1, maxLado / Math.max(ancho0, alto0))
    const ancho = Math.round(ancho0 * escala)
    const alto = Math.round(alto0 * escala)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    ctx.fillStyle = '#ffffff' // fondo blanco para PNG con transparencia
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(imagen, 0, 0, ancho, alto)
    if (typeof imagen.close === 'function') imagen.close()

    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', calidad))
    if (!blob) return archivo

    // Si la foto ya era un JPEG pequeño y no mejora, se deja como estaba
    if (archivo.type === 'image/jpeg' && escala === 1 && blob.size >= archivo.size) return archivo

    const nombre = (archivo.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg' })
  } catch (_) {
    return archivo
  }
}
