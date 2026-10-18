'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'
import { precioTexto, fotosDe } from '../../src/lib/contacto'

// ─────────────────────────────────────────────────────────────
// VIDEO EXPLICATIVO (opcional). Cuando lo tengas, pega aquí su enlace y listo:
//   · Un archivo en la carpeta public:  '/video-bienvenida.mp4'
//   · YouTube (no listado):  'https://www.youtube.com/embed/CODIGO'
// Si lo dejas vacío, en su lugar se muestran anuncios reales de tus vecinos.
const VIDEO_URL = ''
const VIDEO_POSTER = '' // imagen de portada del video (opcional), por ejemplo '/video-portada.jpg'
// ─────────────────────────────────────────────────────────────

const BENEFICIOS = [
  'Publicas en 2 minutos, con fotos desde tu celular',
  'Vendes, regalas o intercambias: tú decides',
  'Pides lo que necesitas en Clasificados y un vecino te ayuda',
  '100 % gratis y sin comisiones',
  'Solo vecinos verificados: nada de desconocidos',
]

const PASOS = [
  { n: '1', t: 'Crea tu cuenta', d: 'Toma un minuto y es gratis.' },
  { n: '2', t: 'Te verificamos por WhatsApp', d: 'Confirmamos que eres vecino de la zona.' },
  { n: '3', t: 'Publica o escribe a tus vecinos', d: 'Se ponen de acuerdo directo por WhatsApp.' },
]

const PREGUNTAS = [
  { p: '¿Tiene algún costo?', r: 'No. Es gratis y no cobramos comisiones por tus ventas.' },
  { p: '¿Para qué me verifican?', r: 'Para que todo sea entre vecinos reales. Te escribimos por WhatsApp para confirmar tu zona; así todos pueden confiar.' },
  { p: '¿Quién puede ver mi WhatsApp?', r: 'Solo los vecinos verificados. Los visitantes sin cuenta no lo ven.' },
  { p: '¿Qué puedo publicar?', r: 'Productos y servicios: los vendes, los regalas o los intercambias. Y en Clasificados pides lo que necesitas.' },
  { p: '¿Y si no tengo nada que vender?', r: 'Entra igual: busca lo que ofrecen tus vecinos o publica un clasificado diciendo qué necesitas.' },
]

function barajar(lista) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-brand">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Video() {
  if (!VIDEO_URL) return null
  const esEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(VIDEO_URL)
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-md">
      {esEmbed ? (
        <iframe src={VIDEO_URL} title="Cómo funciona Mercado Hiperlocal" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full" />
      ) : (
        <video controls playsInline preload="metadata" poster={VIDEO_POSTER || undefined} className="aspect-video w-full bg-black">
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

export default function BienvenidoPage() {
  const [barrio, setBarrio] = useState('')
  const [origen, setOrigen] = useState('')
  const [conSesion, setConSesion] = useState(false)
  const [anuncios, setAnuncios] = useState([])
  const [nVecinos, setNVecinos] = useState(0)
  const [nAnuncios, setNAnuncios] = useState(0)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setBarrio((p.get('barrio') || '').slice(0, 40))
    const o = p.get('origen') || ''
    if (['vecino', 'facebook', 'whatsapp', 'otro'].includes(o)) setOrigen(o)

    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession()
      setConSesion(!!session)

      const ahora = new Date().toISOString()
      const [lista, pubs, vecinos] = await Promise.all([
        supabase
          .from('publicaciones')
          .select('id, titulo, precio, imagen, imagenes, barrio')
          .eq('estado', 'activa')
          .gt('vence_at', ahora)
          .order('created_at', { ascending: false })
          .limit(80),
        supabase.from('publicaciones').select('id', { count: 'exact', head: true }).eq('estado', 'activa').gt('vence_at', ahora),
        supabase.from('perfiles').select('id', { count: 'exact', head: true }),
      ])
      if (!lista.error && lista.data) {
        // Solo anuncios CON foto; si hay suficientes con 2 o más fotos, se escogen entre esos (se ven mejor)
        const conFoto = lista.data.filter((a) => fotosDe(a).length > 0)
        const varias = conFoto.filter((a) => fotosDe(a).length >= 2)
        setAnuncios(barajar(varias.length >= 8 ? varias : conFoto).slice(0, 8))
      }
      if (!pubs.error && pubs.count) setNAnuncios(pubs.count)
      if (!vecinos.error && vecinos.count) setNVecinos(vecinos.count)
    }
    cargar()
  }, [])

  const params = new URLSearchParams({ registro: '1' })
  if (origen) params.set('origen', origen)
  if (barrio) params.set('barrio', barrio)
  const hrefRegistro = conSesion ? '/' : `/login?${params.toString()}`
  const textoBoton = conSesion ? 'Ir a Mercado Hiperlocal' : 'Crear mi cuenta gratis'

  const boton =
    'flex h-14 w-full items-center justify-center rounded-xl bg-brand px-6 text-base font-bold text-white shadow-md transition hover:bg-brand-dark sm:w-auto sm:min-w-72'

  const franja = anuncios.length > 0 && (
    <section className="mt-10">
      <h2 className="mb-3 text-center text-lg font-extrabold tracking-tight">Lo que ya ofrecen tus vecinos</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {anuncios.map((a) => (
          <div key={a.id} className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-gold-soft bg-white">
            <div className="relative aspect-square bg-surface">
              <img src={fotosDe(a)[0]} alt={a.titulo} loading="lazy" className="h-full w-full object-cover" />
              <span className={`absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-xs font-extrabold ${a.precio === 0 ? 'bg-gold-bg text-gold-ink' : 'bg-black/70 text-white'}`}>
                {precioTexto(a.precio)}
              </span>
            </div>
            <div className="p-2">
              <p className="line-clamp-1 text-sm font-bold">{a.titulo}</p>
              {a.barrio && <p className="truncate text-xs text-muted">{a.barrio}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto max-w-xl px-4 pt-8">
        {/* 1. Titular + subtítulo + (video o anuncios reales) + botón */}
        <section className="text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {barrio ? (
              <>Vecino de {barrio}: vende, regala o cambia lo que ya no usas</>
            ) : (
              <>Vende, regala o cambia lo que ya no usas… con tus vecinos</>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted">
            El mercado digital de tu zona. Gratis, sin comisiones y con vecinos verificados. Se escriben por WhatsApp y listo.
          </p>
        </section>

        {VIDEO_URL && (
          <div className="mt-6">
            <Video />
            <p className="mt-2 text-center text-xs text-muted">Mira cómo funciona en un minuto</p>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <a href={hrefRegistro} className={boton}>{textoBoton}</a>
          {!conSesion && <p className="text-xs text-muted">Toma un minuto. Sin costo y sin comisiones.</p>}
        </div>

        {!VIDEO_URL && franja}

        {/* 2. Beneficios */}
        <section className="mt-10 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-extrabold tracking-tight">¿Qué puedes hacer?</h2>
          <ul className="space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm">
                <Check />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Cómo funciona */}
        <section className="mt-10">
          <h2 className="mb-4 text-center text-lg font-extrabold tracking-tight">Así de simple</h2>
          <ol className="space-y-3">
            {PASOS.map((p) => (
              <li key={p.n} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{p.n}</span>
                <div>
                  <p className="text-sm font-bold">{p.t}</p>
                  <p className="text-sm text-muted">{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Prueba social */}
        {VIDEO_URL && franja}
        {nVecinos >= 50 && (
          <p className="mt-8 text-center text-sm text-muted">
            Ya somos <strong className="text-ink">{nVecinos} vecinos</strong>
            {nAnuncios >= 20 && (
              <>
                {' '}y hay <strong className="text-ink">{nAnuncios} anuncios</strong> publicados
              </>
            )}
            .
          </p>
        )}

        {/* 5. Preguntas */}
        <section className="mt-10">
          <h2 className="mb-3 text-center text-lg font-extrabold tracking-tight">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {PREGUNTAS.map((q) => (
              <details key={q.p} className="group rounded-xl border border-line bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {q.p}
                  <span className="text-lg text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 6. Botón final */}
        <section className="mt-10 flex flex-col items-center gap-2 rounded-2xl bg-brand-soft p-6 text-center">
          <h2 className="text-xl font-extrabold tracking-tight">Haz parte de los primeros vecinos</h2>
          <p className="mb-2 text-sm text-muted">Entre todos hacemos que la economía de la zona crezca.</p>
          <a href={hrefRegistro} className={boton}>{textoBoton}</a>
        </section>

        <footer className="mt-10 border-t border-line pb-8 pt-6 text-center text-xs text-muted">
          <a href="/privacidad" className="hover:text-ink hover:underline">Política de privacidad</a>
          <span className="mx-2">·</span>
          <a href="/terminos" className="hover:text-ink hover:underline">Términos y condiciones</a>
        </footer>
      </div>

      {/* Botón fijo en el celular */}
      {!conSesion && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
          <a href={hrefRegistro} className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white">
            {textoBoton}
          </a>
        </div>
      )}
    </div>
  )
}
