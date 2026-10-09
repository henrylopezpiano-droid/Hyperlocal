// Aviso contra estafas para arriendos e inmuebles
export default function AvisoInmueble({ clase = '' }) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 ${clase}`}>
      <p className="font-semibold">Cuidado con las estafas</p>
      <p className="mt-0.5 text-xs leading-relaxed">
        No pagues anticipos, reservas ni "separaciones" sin ver el inmueble en persona y conocer a quien lo ofrece.
        Si algo te parece raro, repórtalo.
      </p>
    </div>
  )
}
