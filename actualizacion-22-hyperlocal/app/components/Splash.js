'use client'
import { useEffect, useState } from 'react'

// Pantalla de bienvenida: SOLO se ve cuando la app está instalada (abierta desde el icono).
// En el navegador normal no aparece. Se muestra una vez por apertura.
export default function Splash() {
  const [fuera, setFuera] = useState(false)
  const [quitar, setQuitar] = useState(false)

  useEffect(() => {
    let visto = false
    try { visto = sessionStorage.getItem('splash-visto') === '1' } catch {}
    if (visto) { setQuitar(true); return }
    try { sessionStorage.setItem('splash-visto', '1') } catch {}
    const t1 = setTimeout(() => setFuera(true), 1700)
    const t2 = setTimeout(() => setQuitar(true), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (quitar) return null

  return (
    <div className={`splash ${fuera ? 'splash-fuera' : ''}`} aria-hidden="true">
      <style>{`
        .splash{display:none;position:fixed;inset:0;z-index:9999;background:#1f7a4d;align-items:center;justify-content:center;flex-direction:column;gap:28px;transition:opacity .5s ease;overflow:hidden}
        @media (display-mode: standalone){.splash{display:flex}}
        .splash-fuera{opacity:0;pointer-events:none}
        .splash .caja{position:relative;width:min(46vw,200px);aspect-ratio:1;display:flex;align-items:center;justify-content:center}
        .splash .caja svg{width:100%;height:auto;position:relative;z-index:2;animation:sp-m .45s ease-out both, sp-tiembla .5s ease-in-out .5s 2}
        .splash .onda{position:absolute;inset:0;border-radius:50%;border:4px solid rgba(255,255,255,.75);opacity:0;animation:sp-onda 1.6s ease-out infinite}
        .splash .onda:nth-child(2){animation-delay:.4s}
        .splash .onda:nth-child(3){animation-delay:.8s}
        .splash .onda:nth-child(4){animation-delay:1.2s}
        .splash .nombre{color:#fff;font-weight:800;letter-spacing:.02em;font-size:20px;opacity:0;animation:sp-m .5s ease-out .6s both}
        @keyframes sp-m{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
        @keyframes sp-tiembla{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-3px) rotate(-1.5deg)}40%{transform:translateX(3px) rotate(1.5deg)}60%{transform:translateX(-2px) rotate(-1deg)}80%{transform:translateX(2px) rotate(1deg)}}
        @keyframes sp-onda{0%{opacity:.8;transform:scale(.7)}100%{opacity:0;transform:scale(4.2)}}
        @media (prefers-reduced-motion: reduce){.splash *{animation:none!important}.splash .nombre{opacity:1}.splash .onda{display:none}}
      `}</style>

      <div className="caja">
        <span className="onda" /><span className="onda" /><span className="onda" /><span className="onda" />
        <svg viewBox="30 40 180 165" role="img">
          <path fill="#fff" d="M30 205V40h40l50 90 50-90h40v165h-36V105l-38 66h-32l-38-66v100z" />
        </svg>
      </div>
      <div className="nombre">Mercado Hiperlocal</div>
    </div>
  )
}
