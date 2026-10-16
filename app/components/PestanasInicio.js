import Link from 'next/link'

// Selector "Anuncios | Clasificados" que va arriba de la portada y de la página de clasificados
export default function PestanasInicio({ activa }) {
  const items = [
    { id: 'anuncios', href: '/', texto: 'Anuncios' },
    { id: 'clasificados', href: '/clasificados', texto: 'Clasificados' },
  ]
  return (
    <nav aria-label="Secciones" className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-1 sm:w-80">
      {items.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={activa === t.id ? 'page' : undefined}
          className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition ${
            activa === t.id ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {t.texto}
        </Link>
      ))}
    </nav>
  )
}
