'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { NOMBRE_APP, precioTexto } from '../../../src/lib/contacto'
import BotonContacto from '../../components/BotonContacto'
import ReportarModal from '../../components/ReportarModal'

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand" aria-label="Vecino verificado">
      <title>Vecino verificado</title>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function AnuncioCliente({ id }) {
  const [pub, setPub] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | noExiste | ok
  const [sesion, setSesion] = useState(false)
  const [miVerificado, setMiVerificado] = useState(false)
  const [reportando, setReportando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(!!session)
      if (session) {
        const { data: yo } = await supabase.from('perfiles').select('verificado').eq('id', session.user.id).maybeSingle()
        setMiVerificado(!!yo?.verificado)
      }

      const columnas = session
        ? 'nombre, barrio, municipio, verificado, contactos (telefono)'
        : 'nombre, barrio, municipio, verificado'

      const { data, error } = await supabase
        .from('publicaciones')
        .select(`*, perfiles (${columnas})`)
        .eq('id', id)
        .maybeSingle()

      if (error || !data) setEstado('noExiste')
      else {
        setPub(data)
        setEstado('ok')
      }
    }
    cargar()
  }, [id])

  const rutaVolver = `/anuncio/${id}`

  function textoCompartir() {
    const precio = pub.precio === 0 ? 'Gratis' : precioTexto(pub.precio)
    return `Mira esto en ${NOMBRE_APP}: ${pub.titulo} (${precio})\n${window.location.origin}${rutaVolver}`
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${rutaVolver}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (_) {
      window.prompt('Copia este enlace:', `${window.location.origin}${rutaVolver}`)
    }
  }

  function reportar() {
    if (!sesion) {
      window.location.href = `/login?volver=${encodeURIComponent(rutaVolver)}`
      return
    }
    setReportando(true)
  }

  if (estado === 'cargando') {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-muted">Cargando...</div>
  }

  if (estado === 'noExiste') {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-extrabold">No encontramos este anuncio</h1>
          <p className="mt-2 text-sm text-muted">Puede que ya se haya eliminado.</p>
          <a href="/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">← Ver otros anuncios</a>
        </div>
      </div>
    )
  }

  const vendedor = pub.perfiles || {}
  const noDisponible = pub.estado === 'cerrada' || new Date(pub.vence_at) < new Date()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <a href="/" className="text-sm font-semibold text-brand hover:underline">← Volver</a>

      <article className="mt-3 overflow-hidden rounded-2xl border border-gold-soft bg-white shadow-sm">
        <div className="relative aspect-[4/3] bg-surface">
          {pub.imagen ? (
            <img src={pub.imagen} alt={pub.titulo} className="absolute inset-0 h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">Sin foto</div>
          )}
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-semibold capitalize text-brand">{pub.tipo}</span>
        </div>

        <div className="p-5 sm:p-6">
          {noDisponible && (
            <p className="mb-4 rounded-lg bg-surface p-3 text-sm font-medium text-muted">
              Este anuncio ya no está disponible.
            </p>
          )}

          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{pub.titulo}</h1>

          {pub.precio === 0 ? (
            <p className="mt-2"><span className="rounded-md bg-gold-bg px-2 py-0.5 text-base font-extrabold text-gold-ink">Gratis</span></p>
          ) : (
            <p className="mt-2 text-2xl font-extrabold text-brand">{precioTexto(pub.precio)}</p>
          )}

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{pub.descripcion}</p>

          <div className="mt-5 flex items-center gap-1.5 border-t border-line pt-4 text-sm text-muted">
            <span className="font-semibold text-ink">{vendedor.nombre || 'Vecino'}</span>
            {vendedor.verificado && <Check />}
            <span>· {pub.barrio || vendedor.barrio || 'Zona'}{vendedor.municipio ? `, ${vendedor.municipio}` : ''}</span>
          </div>
          {pub.created_at && (
            <p className="mt-1 text-xs text-muted">Publicado el {new Date(pub.created_at).toLocaleDateString('es-CO')}</p>
          )}

          {!noDisponible && (
            <div className="mt-5">
              <BotonContacto sesion={sesion} verificado={miVerificado} vendedor={vendedor} titulo={pub.titulo} volver={rutaVolver} grande />
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(textoCompartir())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-lg border border-line text-center text-sm font-semibold leading-10 text-ink transition hover:bg-surface"
            >
              Compartir por WhatsApp
            </a>
            <button onClick={copiar} className="h-10 rounded-lg border border-line text-sm font-semibold text-ink transition hover:bg-surface">
              {copiado ? '¡Enlace copiado!' : 'Copiar enlace'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button onClick={reportar} className="text-xs font-medium text-muted hover:text-red-600 hover:underline">
              Reportar este anuncio
            </button>
          </div>
        </div>
      </article>

      {reportando && <ReportarModal publicacion={pub} onClose={() => setReportando(false)} />}
    </div>
  )
}
