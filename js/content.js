/* Contenido del Sistema CEO: textos basados en "El Diario de un CEO" (Steven Bartlett)
   adaptados a la venta puerta a puerta del hablador QR + NFC de Clyclick. */
'use strict';

window.CONTENT = {
  STAGES: ['Por visitar', 'Visitado', 'Demo hecha', 'Seguimiento', 'Ganado', 'Perdido'],

  RUBROS: [
    'Restaurante / Cafetería',
    'Peluquería / Barbería / Spa',
    'Consultorio / Odontología',
    'Tienda / Retail',
    'Oficina / Servicios',
    'Otro'
  ],

  SOFTS: ['Restaurantes', 'Odontología', 'Peluquería', 'Ecommerce', 'Página web', 'Desarrollo a medida'],

  // Escalera de valor: el hablador abre la puerta, el software es la venta grande.
  RUBRO_SOFT: {
    'Restaurante / Cafetería': 'Restaurantes',
    'Peluquería / Barbería / Spa': 'Peluquería',
    'Consultorio / Odontología': 'Odontología',
    'Tienda / Retail': 'Ecommerce',
    'Oficina / Servicios': 'Página web'
  },

  REASONS: ['Precio', 'No le interesa', 'No estaba el dueño', 'Ya tiene algo parecido', 'Lo va a pensar', 'No tiene tiempo', 'Otro'],

  DOW: ['D', 'L', 'M', 'X', 'J', 'V', 'S'], // índice = Date.getDay()

  TIPS: [
    ['Ley 18 · Lucha por los primeros 5 segundos', 'No empieces con "vengo a ofrecerle". Pon el hablador en el mostrador y di: "Acerque su celular aquí".'],
    ['Ley 17 · Déjalos probar y comprarán', 'Lo que la persona toca y ve en su propio celular lo empieza a sentir suyo. Que lo pruebe siempre.'],
    ['Ley 3 · Nunca discutas', 'Ante una objeción empieza por lo que comparten: "Tiene razón en…". Si empiezas llevando la contraria, deja de escucharte.'],
    ['Ley 6 · Pregunta, no digas', '"¿Arrancamos con el de 3?" compromete más que "¿qué le parece?". Las preguntas de sí o no no dejan espacio a excusas.'],
    ['Ley 16 · Ricitos de Oro', 'Muestra siempre 3 opciones. La del medio parece la decisión segura.'],
    ['Ley 21 · Equivócate más que la competencia', 'Cada "no" es información. Anota la razón: con 20 razones ya sabes qué cambiar.'],
    ['Ley 7 · Tu historia personal', 'La visita número 15, cuando estás cansado, es la que le demuestra a tu cabeza quién eres.'],
    ['Ley 8 · No luches contra un mal hábito', 'Un solo hábito a la vez, y reemplázalo por otro. Y duerme: cansado vuelves a los viejos hábitos.'],
    ['Ley 9 · Tu primera base es la salud', 'Agua, comida y descanso antes de salir. Sin energía no hay visita 15.'],
    ['Ley 23 · No seas avestruz', 'Mira tus números aunque sean malos. Lo que no miras no lo puedes arreglar.'],
    ['Ley 19 · Preocúpate por lo pequeño', 'Cambia una sola frase del guion esta semana y mide si mejora. 1% cada semana se acumula.'],
    ['Ley 2 · Enseña para dominar', 'Publica hoy algo que aprendiste en la calle. Enseñar te obliga a entenderlo y te trae clientes.'],
    ['Ley 24 · La presión es un privilegio', 'Los nervios antes de entrar son energía para rendir. Solo le llegan a quien se atreve a entrar.'],
    ['Ley 28 · Pregunta quién, no cómo', '¿Qué tarea que no te genera ventas (imprimir, cortar, entregar) le puedes pasar a alguien?'],
    ['Ley 31 · El poder del progreso', 'Mira tu barra de hoy, no la meta de 90 días. Las pequeñas victorias alimentan la motivación.'],
    ['Ley 11 · Evita el papel tapiz', '"Soluciones digitales innovadoras" ya nadie lo escucha. Di algo concreto: "sus clientes le escriben por WhatsApp en un toque".'],
    ['Ley 25 · Manifestación negativa', 'Pregúntate: ¿por qué esta semana podría salir mal? Arréglalo antes de que pase.'],
    ['Ley 22 · Piensa en el Plan A', 'Un plan B le quita esfuerzo al plan A. Hoy tu plan A son tus visitas, sin "mejor mañana".']
  ],

  PREP: [
    'Habladores de demostración listos (ideal: uno de comida, uno de belleza y uno de consultorio/oficina) · Ley 17',
    'Celular cargado y el perfil demo abierto para mostrar',
    'Ruta definida: una zona con muchos negocios juntos (menos caminar, más visitas)',
    'Tus 3 paquetes claros (Calle › Paquetes) · Ley 16',
    'Agua y algo de comer · Ley 9',
    'Forma de cobro lista (efectivo con cambio / datos para transferencia)'
  ],

  STEPS: [
    {
      law: 'Ley 18 · Primeros 5 segundos', title: '1. Entrada',
      dont: '"Buenos días, disculpe, vengo de parte de una empresa a ofrecerle un producto…" (suena a vendedor y el cerebro se desconecta · Ley 11)',
      say: '"Buenos días. Le robo 20 segundos: acerque su celular aquí." (y pones el hablador sobre el mostrador)',
      note: 'Primero la acción, después tu nombre. Si te preguntan quién eres: "Soy [tu nombre], de Clyclick, aquí en [tu ciudad]."'
    },
    {
      law: 'Ley 17 · Déjalos probar', title: '2. Que lo pruebe con SU celular',
      say: '"Esto es lo que verían sus clientes: su menú, su WhatsApp, su ubicación, sus redes y dónde calificarle. En un toque, sin descargar nada."',
      note: 'Deja el hablador en sus manos mientras carga. Marca "Demo" en la app.'
    },
    {
      law: 'Ley 6 · Pregunta, no digas', title: '3. Dos preguntas de sí o no',
      say: '"¿Sus clientes le preguntan seguido por el WhatsApp, los precios o el menú?"<br>"¿Le gustaría que más clientes le sigan en redes y le dejen una calificación?"',
      note: 'No expliques funciones. Deja que diga "sí" dos veces.'
    },
    {
      law: 'Ley 15 · El marco importa', title: '4. Pinta SU versión',
      say: '"Imagínese este mismo con su logo y sus colores en cada mesa / en su mostrador. Si le trae un solo cliente nuevo, ya se pagó."',
      note: 'Habla de SU negocio, no de tu producto.'
    },
    {
      law: 'Ley 16 · Ricitos de Oro', title: '5. Tres opciones',
      say: '"Tengo tres opciones [muestras la pantalla de Paquetes]. Para un local como el suyo le recomiendo esta."',
      note: 'Nunca muestres un solo precio. Recomienda la del medio.'
    },
    {
      law: 'Ley 6 · Cierre de sí o no', title: '6. Cierre',
      say: '"¿Arrancamos con el [paquete del medio] y se lo entrego el [día] con su logo?"',
      note: 'Después de preguntar, espera la respuesta. Si dice sí: pide ahí mismo logo, colores, WhatsApp, redes y ubicación.'
    },
    {
      law: 'Ley 13 · Regla pico-final', title: '7. Salida (compre o no)',
      say: 'Si compró: "¿Usted maneja sus pedidos / citas / reservas en papel o con algún sistema?" (así abres la puerta a tu software).<br>Si no compró: "Gracias por su tiempo. Una pregunta: ¿qué tendría que tener para que le sirva?"',
      note: 'La gente recuerda sobre todo el final. Sal con una sonrisa y anota la razón del "no" en la app (Ley 21).'
    }
  ],

  OBJECTIONS: [
    {
      obj: 'Está caro / no tengo plata ahora',
      agree: 'Tiene toda la razón en cuidar cada dólar, y más como están las cosas.',
      reframe: '¿Cuánto le deja un cliente nuevo? Si este hablador le trae uno solo, ya se pagó. Y trabaja todos los días en su mostrador.',
      close: '¿Arrancamos con uno solo para que lo pruebe en su local?'
    },
    {
      obj: 'Ya tengo Instagram / Facebook',
      agree: 'Qué bueno, eso es justamente lo que queremos aprovechar.',
      reframe: 'Esto no reemplaza su Instagram: hace que la persona que ya está en su local le siga en un toque, junto con su WhatsApp y su ubicación.',
      close: '¿Le gustaría que más de los clientes que ya vienen le sigan?'
    },
    {
      obj: 'Ya tengo un QR / menú QR',
      agree: 'Perfecto, entonces ya sabe que sus clientes usan el QR.',
      reframe: 'La diferencia es que aquí está todo en un solo lugar (menú, WhatsApp, ubicación, calificación y redes) y con NFC ni siquiera tienen que abrir la cámara.',
      close: '¿Lo probamos con su celular para que vea la diferencia?'
    },
    {
      obj: 'Déjeme pensarlo',
      agree: 'Claro, es su dinero y está bien pensarlo.',
      reframe: 'Para ayudarle a pensarlo: ¿qué es lo que le hace dudar, el precio o si sus clientes lo van a usar?',
      close: 'Responde a esa duda y vuelve a preguntar: "¿Arrancamos con [paquete]?". Si aún quiere pensarlo: "¿Le parece si paso el [día] a las [hora]?" y regístralo como Volver.'
    },
    {
      obj: 'Mis clientes no usan eso',
      agree: 'Puede ser, usted conoce a sus clientes mejor que nadie.',
      reframe: 'Por eso lo más fácil es verlo: le armo su perfil con su nombre y se lo muestro antes de imprimir nada.',
      close: '¿Le parece si le preparo su perfil y se lo enseño el [día]?'
    },
    {
      obj: 'Tengo que consultarlo con el dueño / socio / esposa',
      agree: 'Tiene sentido, es una decisión de los dos.',
      reframe: 'Así no le toca explicarlo a usted: se lo muestro yo directamente, me toma 2 minutos.',
      close: '¿A qué hora está el dueño? ¿Paso mañana a las [hora]?'
    },
    {
      obj: 'No tengo tiempo ahora',
      agree: 'Le entiendo, está trabajando y eso es primero.',
      reframe: 'Son 5 segundos: acerque su celular aquí.',
      close: 'Si sigue ocupado: "¿Paso a las [hora], cuando esté más tranquilo?"'
    },
    {
      obj: '¿Y si cambio el menú o los precios?',
      agree: 'Muy buena pregunta, eso pasa todo el tiempo.',
      reframe: 'El hablador no cambia: el enlace sigue siendo el mismo. Lo que se actualiza es el contenido de su perfil.',
      close: '¿Qué es lo que más cambia en su negocio, el menú o los precios? (Antes de salir, define cuántos cambios incluyes y si cobras por actualizar).'
    }
  ],

  EXP_IDEAS: [
    { title: 'Entrada con acción vs. presentación', hypothesis: 'Si abro con "acerque su celular aquí" en vez de presentarme, más personas lo prueban.', metric: 'Demos / visitas' },
    { title: 'Perfil hecho antes de entrar', hypothesis: 'Si llevo el perfil del negocio ya diseñado con su nombre, cierro más ventas (Ley 13 + 17).', metric: 'Ventas / visitas' },
    { title: '3 paquetes vs. solo precio unitario', hypothesis: 'Si muestro 3 paquetes, sube el número de habladores por venta (Ley 16).', metric: 'Unidades por venta' },
    { title: 'Rubro: restaurantes vs. peluquerías', hypothesis: 'Un rubro compra más que el otro. Visito 20 de cada uno y comparo.', metric: 'Ventas / visitas por rubro' },
    { title: 'Horario: 10–12 h vs. 15–17 h', hypothesis: 'En horas tranquilas el dueño escucha más.', metric: 'Demos / visitas' },
    { title: '"Alianzas" en vez de "ventas"', hypothesis: 'Si me presento como "alianzas con negocios de la zona", me atienden más (Ley 15).', metric: 'Demos / visitas' },
    { title: 'Algo memorable (Ley 10)', hypothesis: 'Un detalle "absurdo" que haga hablar (ej. un hablador gigante de demostración) hace que me recomienden.', metric: 'Referidos / semana' },
    { title: 'Publicar a diario (Ley 2)', hypothesis: 'Si publico un aprendizaje diario de la calle, llegan contactos que no tuve que visitar.', metric: 'Mensajes entrantes / semana' }
  ],

  QUESTIONS: [
    '¿Dormí 7 horas o más?',
    '¿Me moví o hice ejercicio 30 minutos?',
    '¿Cumplí mis visitas de hoy?',
    '¿Anoté la razón de cada "no"?',
    '¿Hice los seguimientos que tocaban hoy?',
    '¿Publiqué mi aprendizaje del día?',
    '¿Hice la tarea incómoda que venía evitando?'
  ],

  REVIEW_FIELDS: [
    ['worked', '¿Qué funcionó esta semana? (Ley 19: repítelo)'],
    ['didnt', '¿Qué no funcionó? (Ley 21: es información, no un fracaso)'],
    ['truth', 'La verdad incómoda que estoy evitando (Ley 23)'],
    ['improve', 'Mi mejora del 1% para la próxima semana (una sola cosa)'],
    ['delegate', '¿Qué tarea le puedo pasar a alguien? ¿A quién? (Ley 28)'],
    ['teach', 'Lo que voy a enseñar/publicar esta semana (Ley 2)']
  ],

  DEFAULT_PACKAGES: [
    { name: 'Básico', units: 1, price: 15, desc: '1 hablador personalizado con QR + NFC y su perfil' },
    { name: 'Negocio', units: 3, price: 39, desc: 'Mostrador + mesas. El más equilibrado' },
    { name: 'Completo', units: 6, price: 75, desc: 'Todo el local cubierto' }
  ]
};
