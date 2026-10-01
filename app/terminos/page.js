import { Pagina, Seccion, Lista } from '../components/Legal'

export const metadata = {
  title: 'Términos y condiciones | Mercado Hiperlocal',
  description: 'Términos y condiciones de uso de Mercado Hiperlocal.',
}

export default function Terminos() {
  return (
    <Pagina titulo="Términos y condiciones de uso" version="Versión 1.0 · 1 de octubre de 2026">
      <p>
        Al crear una cuenta o usar Mercado Hiperlocal aceptas estos términos. Si no estás de acuerdo con ellos, te
        pedimos que no uses la plataforma.
      </p>

      <Seccion titulo="1. Qué es Mercado Hiperlocal">
        <p>
          Es una plataforma gratuita que permite a los vecinos de un mismo barrio publicar productos y servicios y
          contactarse directamente por WhatsApp. No cobramos comisiones por las ventas o acuerdos entre vecinos.
        </p>
        <p>
          Mercado Hiperlocal no es vendedor, comprador ni intermediario de las transacciones: los acuerdos de precio,
          pago y entrega se hacen directamente entre los usuarios.
        </p>
      </Seccion>

      <Seccion titulo="2. Tu cuenta y la verificación">
        <Lista
          items={[
            'Debes ser mayor de 18 años y entregar información veraz (nombre, celular, municipio y barrio).',
            'Puedes explorar los anuncios sin cuenta. Para contactar vecinos o publicar necesitas registrarte.',
            'Para publicar, un administrador debe verificar que perteneces a la comunidad. Podemos rechazar o retirar la verificación cuando haya dudas o incumplimientos.',
            'Tu cuenta es personal. Eres responsable de la confidencialidad de tu contraseña y de lo que se haga con ella.',
          ]}
        />
      </Seccion>

      <Seccion titulo="3. Reglas para tus publicaciones">
        <p>Tus anuncios deben ser veraces, estar relacionados con lo que ofreces y usar fotos propias o que tengas derecho a usar. No está permitido publicar:</p>
        <Lista
          items={[
            'Armas, municiones, explosivos o material peligroso.',
            'Drogas o sustancias ilícitas, y medicamentos que requieran fórmula médica.',
            'Productos robados, falsificados o de procedencia ilegal.',
            'Contenido sexual, violento, discriminatorio, ofensivo o que incite al odio.',
            'Animales silvestres o especies protegidas.',
            'Productos o servicios cuya venta requiera un permiso que no tengas.',
            'Anuncios engañosos, estafas o datos personales de terceros sin su permiso.',
            'Cualquier cosa que sea contraria a la ley colombiana.',
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Contacto y transacciones entre vecinos">
        <p>
          Los vecinos se contactan por WhatsApp usando el número que cada usuario registró. Úsalo únicamente para
          hablar del anuncio de interés; no está permitido enviar spam ni acosar a otros usuarios.
        </p>
        <p>
          Recomendaciones de seguridad: reúnete en lugares públicos del barrio, revisa el producto antes de pagar y no
          adelantes dinero a personas que no conoces.
        </p>
      </Seccion>

      <Seccion titulo="5. Responsabilidad">
        <p>
          Mercado Hiperlocal ofrece la plataforma tal como está y no garantiza la calidad, legalidad, disponibilidad
          o entrega de lo que se publica, ni responde por los acuerdos, pagos o disputas entre usuarios. Cada usuario es
          responsable de lo que publica y de los acuerdos que haga. Esto se entiende sin perjuicio de los derechos que la
          ley colombiana te reconoce como consumidor y que no pueden renunciarse.
        </p>
      </Seccion>

      <Seccion titulo="6. Moderación y reportes">
        <p>
          Podemos ocultar o eliminar anuncios y suspender cuentas que incumplan estos términos o que sean reportados
          por la comunidad. Si ves algo indebido, avísanos en <strong>[henrylopezpiano@gmail.com]</strong>.
        </p>
      </Seccion>

      <Seccion titulo="7. Contenido que publicas">
        <p>
          Sigues siendo dueño de tus textos y fotos. Al publicarlos, nos autorizas a mostrarlos dentro de Mercado
          Hiperlocal mientras tu anuncio esté activo.
        </p>
      </Seccion>

      <Seccion titulo="8. Datos personales">
        <p>
          El tratamiento de tus datos se rige por nuestra{' '}
          <a href="/privacidad" className="font-semibold text-brand hover:underline">
            Política de privacidad
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="9. Cambios y ley aplicable">
        <p>
          Podemos actualizar estos términos y publicaremos la versión vigente en esta página. Seguir usando la
          plataforma después de un cambio implica que lo aceptas. Estos términos se rigen por las leyes de la República
          de Colombia.
        </p>
        <p>
          Responsable: <strong>[Henry Javier Lopez Rodriguez]</strong> · Contacto: <strong>[henrylopezpiano@gmail.com]</strong>
        </p>
      </Seccion>
    </Pagina>
  )
}
