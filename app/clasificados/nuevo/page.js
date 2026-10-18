'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import { CATEGORIAS } from '../../../src/lib/categorias'

const campo = 'w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none'

export default function NuevoClasificadoPage() {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function revisar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?volver=/clasificados/nuevo'
        return
      }
      setUsuario(user)
      const { data } = await supabase.from('perfiles').select('nombre, barrio, verificado').eq('id', user.id).maybeSingle()
      setPerfil(data || null)
      setVerificando(false)
    }
    revisar()
  }, [])

  function avisar(texto, esError = false) {
    setMensaje(texto)
    setError(esError)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!perfil?.verificado) {
      avisar('Tu cuenta aún no está verificada por el administrador.', true)
      return
    }
    const limpio = titulo.trim()
    if (limpio.length < 4) {
      avisar('Escribe qué necesitas (mínimo 4 letras).', true)
      return
    }
    let valor = null
    if (presupuesto.trim() !== '') {
      valor = parseInt(presupuesto.replace(/\D/g, ''), 10)
      if (!valor || valor < 0) {
        avisar('El presupuesto debe ser un número, o déjalo vacío.', true)
        return
      }
    }
    setEnviando(true)
    avisar('')
    const { error: err } = await supabase.from('clasificados').insert([
      {
        user_id: usuario.id,
        titulo: limpio,
        descripcion: descripcion.trim() || null,
        categoria: categoria || 'Otros',
        presupuesto: valor,
      },
    ])
    if (err) {
      avisar(
        (err.message || '').includes('limite_clasificados')
          ? 'Ya tienes 3 clasificados activos. Marca uno como resuelto o elimínalo en "Mis publicaciones" para publicar otro.'
          : 'No se pudo publicar: ' + err.message,
        true
      )
      setEnviando(false)
      return
    }
    window.location.href = '/clasificados'
  }

  if (verificando) return <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-muted">Cargando...</div>

  const pendiente = !perfil?.verificado

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Publicar clasificado</h1>
        <p className="mb-5 mt-1 text-sm text-muted">
          Cuéntales a tus vecinos{perfil?.barrio ? ` de ${perfil.barrio}` : ''} qué necesitas. Dura 30 días y es gratis.
        </p>

        <div className="mb-5 rounded-lg border border-gold/40 bg-gold-bg p-3 text-sm text-gold-ink">
          <p>
            <strong>Aquí pides lo que necesitas</strong> (por ejemplo, "busco quién me repare un computador").
          </p>
          <p className="mt-1">
            ¿Quieres <strong>vender u ofrecer</strong> algo? Eso va como anuncio:{' '}
            <a href="/publicar" className="font-semibold underline">publicar un anuncio</a>.
          </p>
        </div>

        {pendiente && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Tu cuenta está registrada pero <strong>pendiente de verificación</strong>. Podrás publicar cuando el administrador te apruebe.
          </div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">¿Qué necesitas o buscas?</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={80}
              placeholder="Ej. Busco quién me repare un computador"
              className={`${campo} h-11`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${campo} h-11`}>
              <option value="">Otros</option>
              {CATEGORIAS.filter((c) => c.valor !== 'Otros').map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Detalles <span className="font-normal text-muted">(opcional)</span></label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ej. Se pone lento y se demora en encender. Prefiero que lo revisen en mi casa."
              className={`${campo} py-2`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">¿Cuánto podrías pagar? <span className="font-normal text-muted">(opcional)</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value.replace(/\D/g, ''))}
                placeholder="50000"
                className={`${campo} h-11 pl-7`}
              />
            </div>
          </div>

          <p className="rounded-lg bg-surface p-3 text-xs text-muted">
            Aquí no se piden ni se ofrecen cosas ilegales, programas piratas ni nada que ponga en riesgo a otro vecino.
            Quien te quiera ayudar te escribirá directo por WhatsApp.
          </p>

          {mensaje && (
            <p className={`rounded-lg p-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>{mensaje}</p>
          )}

          <button
            type="submit"
            disabled={enviando || pendiente}
            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {enviando ? 'Publicando...' : 'Publicar clasificado'}
          </button>
          <a href="/clasificados" className="block text-center text-sm font-semibold text-muted hover:text-ink">Cancelar</a>
        </form>
      </div>
    </div>
  )
}
