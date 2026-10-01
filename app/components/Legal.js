// Piezas compartidas por las páginas legales (privacidad y términos)

export function Pagina({ titulo, version, children }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-xs text-muted">{version}</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed">{children}</div>
        <div className="mt-8 border-t border-line pt-4 text-center">
          <a href="/" className="text-sm font-semibold text-brand hover:underline">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}

export function Seccion({ titulo, children }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold">{titulo}</h2>
      <div className="space-y-2 text-ink/90">{children}</div>
    </section>
  )
}

export function Lista({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
