import { Pagina, Seccion, Lista } from '../components/Legal'

export const metadata = {
  title: 'Política de privacidad | Mercado Hiperlocal',
  description: 'Política de tratamiento de datos personales de Mercado Hiperlocal.',
}

export default function Privacidad() {
  return (
    <Pagina
      titulo="Política de privacidad y tratamiento de datos personales"
      version="Versión 1.0 · 1 de octubre de 2026"
    >
      <p>
        En Mercado Hiperlocal protegemos tus datos personales. Esta política explica qué datos recogemos, para qué los
        usamos y cuáles son tus derechos, de acuerdo con la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el
        Decreto 1074 de 2015) y demás normas de protección de datos de Colombia.
      </p>

      <Seccion titulo="1. Responsable del tratamiento">
        <p>
          <strong>[HENRY JAVIER LOPEZ RODRIGUEZ]</strong>, identificado con <strong>[1090401796]</strong>, con
          domicilio en <strong>[Cucuta, Norte de Santander]</strong>.
        </p>
        <p>
          Correo para consultas, reclamos y solicitudes sobre datos personales: <strong>[Henrylopezpiano@gmail.com]</strong>.
        </p>
      </Seccion>

      <Seccion titulo="2. Datos que recogemos">
        <Lista
          items={[
            'Nombre completo.',
            'Número de celular o WhatsApp.',
            'Correo electrónico.',
            'Municipio y barrio donde vives.',
            'Contraseña (se guarda cifrada; nadie, incluidos nosotros, puede leerla).',
            'Contenido de tus anuncios: título, descripción, precio y fotos.',
          ]}
        />
        <p>
          No solicitamos datos sensibles (salud, origen étnico, orientación política o religiosa, entre otros). La
          plataforma está dirigida a personas mayores de 18 años y no recoge datos de menores de edad.
        </p>
      </Seccion>

      <Seccion titulo="3. Para qué usamos tus datos">
        <Lista
          items={[
            'Crear y administrar tu cuenta.',
            'Verificar que perteneces a la comunidad del barrio.',
            'Mostrar tus anuncios a otros vecinos.',
            'Permitir que otros usuarios registrados te contacten por WhatsApp.',
            'Moderar contenido, atender reportes y mantener la seguridad de la plataforma.',
            'Enviarte comunicaciones relacionadas con el servicio (por ejemplo, la confirmación de tu cuenta).',
            'Cumplir obligaciones legales y atender requerimientos de autoridades competentes.',
          ]}
        />
      </Seccion>

      <Seccion titulo="4. Qué ven los demás usuarios">
        <Lista
          items={[
            'Públicamente (sin iniciar sesión): tu nombre, tu barrio y municipio, la insignia de vecino verificado y tus anuncios.',
            'Solo usuarios con sesión iniciada: tu número de celular, a través del botón de contacto por WhatsApp.',
            'Nunca se muestran: tu correo electrónico ni tu contraseña.',
          ]}
        />
        <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
      </Seccion>

      <Seccion titulo="5. Autorización">
        <p>
          Al registrarte y marcar la casilla de aceptación, nos autorizas de manera previa, expresa e informada para
          tratar tus datos conforme a esta política. Guardamos la fecha de la aceptación y la versión de la política
          aceptada como constancia. Puedes revocar tu autorización o pedir la supresión de tus datos en cualquier
          momento, salvo cuando exista un deber legal o contractual que exija conservarlos.
        </p>
      </Seccion>

      <Seccion titulo="6. Tus derechos como titular">
        <Lista
          items={[
            'Conocer, actualizar y rectificar tus datos personales.',
            'Solicitar prueba de la autorización que nos diste.',
            'Ser informado sobre el uso que se ha dado a tus datos.',
            'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.',
            'Revocar la autorización y solicitar la supresión de tus datos.',
            'Acceder de forma gratuita a tus datos personales.',
          ]}
        />
      </Seccion>

      <Seccion titulo="7. Cómo ejercer tus derechos">
        <p>
          Escríbenos a <strong>[CORREO DE CONTACTO]</strong> indicando tu nombre, el correo con el que te registraste y
          tu solicitud. Responderemos las consultas en un máximo de 10 días hábiles (prorrogables por 5 días hábiles
          más, informándote el motivo) y los reclamos en un máximo de 15 días hábiles (prorrogables hasta por 8 días
          hábiles más). Si no estás conforme con la respuesta, puedes acudir a la Superintendencia de Industria y
          Comercio.
        </p>
        <p>
          También puedes pedirnos la eliminación de tu cuenta y de tus anuncios escribiendo al mismo correo.
        </p>
      </Seccion>

      <Seccion titulo="8. Proveedores y transmisión de datos">
        <p>
          Para operar el servicio usamos proveedores tecnológicos que actúan como encargados del tratamiento:
          Supabase (base de datos, autenticación y almacenamiento de fotos) y Vercel (alojamiento de la página). Sus
          servidores pueden estar ubicados fuera de Colombia, por lo que tus datos pueden ser transmitidos
          internacionalmente con medidas de seguridad adecuadas.
        </p>
      </Seccion>

      <Seccion titulo="9. Seguridad y conservación">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra acceso no autorizado,
          pérdida o alteración. Conservamos tus datos mientras tu cuenta esté activa y, después, durante el tiempo que
          exijan las obligaciones legales o la atención de reclamos. Pasado ese tiempo, se eliminan.
        </p>
      </Seccion>

      <Seccion titulo="10. Cambios en esta política">
        <p>
          Podemos actualizar esta política. Publicaremos la nueva versión en esta página con su fecha y, si el cambio
          es sustancial, te lo informaremos por los medios disponibles.
        </p>
      </Seccion>
    </Pagina>
  )
}
