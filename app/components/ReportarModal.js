'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'

const MOTIVOS = [
  'Parece una estafa o engaño',
  'Contenido inapropiado u ofensivo',
  'Producto o servicio prohibido',
  'Información o foto falsa',
  'Ya no está disponible',
  'Otro motivo',
]

export default function ReportarModal({ publicacion, onClose }) {
  const [motivo, setMotivo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [onClose])

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    const { error } = await supabase
      .from('reportes')
      .insert([{ publicacion_id: publicacion.id, motivo, detalle: detalle.trim() || null }])

    if (!error) setResultado({ ok: true, texto: 'Gracias. Un administrador revisará este anuncio.' })
    else if (error.code === '23505') setResultado({ ok: true, texto: 'Ya habías reportado este anuncio. Lo estamos revisando.' })
    else setResultado({ ok: false, texto: 'No se pudo enviar el reporte. Intenta de nuevo.' })
    setEnviando(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Reportar anuncio" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-extrabold tracking-tight">Reportar anuncio</h2>
        <p className="mt-1 truncate text-sm text-muted">{publicacion.titulo}</p>

        {resultado?.ok ? (
          <div className="mt-4">
            <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand-dark">{resultado.texto}</p>
            <button onClick={onClose} className="mt-4 h-10 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">¿Qué pasa con este anuncio?</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none">
                <option value="">Elige un motivo...</option>
                {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Detalles (opcional)</label>
              <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={3} maxLength={500} className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" />
            </div>
            {resultado && !resultado.ok && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{resultado.texto}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-10 flex-1 rounded-lg border border-line text-sm font-semibold text-muted hover:text-ink">Cancelar</button>
              <button disabled={enviando} className="h-10 flex-1 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                {enviando ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
