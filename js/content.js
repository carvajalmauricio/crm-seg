/* Contenido del Sistema CEO: textos basados en "El Diario de un CEO" (Steven Bartlett),
   "Objeciones" (Jeb Blount), "Influencia" (Robert Cialdini) y "Rompe la barrera del no" (Chris Voss),
   adaptados a la venta puerta a puerta del hablador QR + NFC de Clyclick.
   Marcadores que se reemplazan al mostrar: {yo} {ciudad} {basico} {precioBasico} {medio} {precioMedio} {grande} {precioGrande} {porqueMedio} */
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

  // ¿De dónde vino el cliente?
  SOURCES: ['Calle', 'Referido', 'Instagram', 'TikTok', 'Facebook', 'WhatsApp', 'Otro'],

  // Blount · los 3 tipos de "no". Cada uno se trabaja distinto.
  NO_TYPES: [
    {
      k: 'reflejo', t: 'Reflejo', d: '"No me interesa", "no, gracias" antes de ver nada',
      tip: 'Es una respuesta automática, no una decisión. Voltéalo una vez: "Casi todos me dicen eso antes de verlo. Son 10 segundos."',
      reasons: ['No me interesa', 'No, gracias / no necesito']
    },
    {
      k: 'evasiva', t: 'Evasiva', d: '"No tengo tiempo", "pase otro día", "lo voy a pensar"',
      tip: 'Te está esquivando sin decir que no. Amarra día y hora concretos o pregunta qué le falta para decidir.',
      reasons: ['No tiene tiempo', 'Pase otro día', 'Lo va a pensar', 'No estaba el dueño']
    },
    {
      k: 'objecion', t: 'Objeción real', d: 'Una razón concreta después de ver la demo',
      tip: 'Es información valiosa: repite sus palabras, nombra lo que siente y responde (Calle › Objeción). Máximo 2 intentos.',
      reasons: ['Precio', 'Ya tiene algo parecido', 'Sus clientes no lo usarían', 'Tiene que consultarlo', 'Otro']
    }
  ],

  // Voss · detector de "sí" falso: lo que dijo al quedar en "Volver".
  VOLVER_WHY: [
    { k: 'dueno', t: 'Dueño no estaba', temp: 'tibio', hint: 'Anota el nombre del dueño y a qué hora está. Esta noche mándale su perfil de muestra (Hoy › Mensajes).' },
    { k: 'cita', t: 'Me dio día y hora', temp: 'caliente', hint: 'Buena señal: es una cita real. Confírmala por WhatsApp el día anterior.' },
    { k: 'consultar', t: 'Tiene que consultarlo', temp: 'tibio', hint: 'Pregunta: "¿Quién más opina en esto?" y "¿Qué cree que le va a preguntar?". Pide mostrárselo a los dos.' },
    { k: 'ocupado', t: 'Estaba ocupado', temp: 'tibio', hint: 'Neutral. Vuelve a la hora que te dijo, no a otra.' },
    { k: 'pensar', t: '"Lo voy a pensar"', temp: 'frio', hint: 'Sí falso. Nombra lo que siente: "Parece que hay algo que todavía no le convence." (silencio) y pregunta: "¿Qué tendría que ver para decidirse?"' },
    { k: 'razon', t: '"Tiene razón"', temp: 'frio', hint: 'Según Voss suele significar "déjeme en paz". Vuelve con un resumen en sus palabras hasta oír "así es".' },
    { k: 'intento', t: '"Lo voy a intentar"', temp: 'frio', hint: 'Suele ser un no. Pregunta con "cómo": "¿Cómo sabremos que es buen momento?"' },
    { k: 'pase', t: '"Pase cuando quiera"', temp: 'frio', hint: 'No es una cita. La próxima vez pide día y hora: "¿Sería mala idea si paso el jueves a las 10?"' }
  ],

  TEMPS: { caliente: 'Caliente', tibio: 'Tibio', frio: 'Frío' },

  // Voss · tipos de dueño
  OWNER_TYPES: [
    { k: 'Analista', d: 'Habla poco, pide datos y compara', tip: 'Dale datos y tiempo, sin presión. Mándale la cotización por escrito y deja que la revise.' },
    { k: 'Acomodador', d: 'Amable y conversador, dice "sí" fácil', tip: 'Cuidado con su "sí" falso: amarra dónde lo va a poner, quién lo va a usar y cuándo.' },
    { k: 'Asertivo', d: 'Directo, apurado, quiere mandar', tip: 'Déjalo hablar y repite sus palabras. Ve al grano y dale el control con opciones.' }
  ],

  // Voss · señales de "sí" falso
  FALSE_YES: [
    ['"Tiene razón"', 'Suele significar "déjeme en paz". Busca un "así es".'],
    ['"Lo voy a intentar"', 'Suele significar "no". Pregunta cómo lo va a hacer.'],
    ['"Lo voy a pensar"', 'Sí falso. Nombra lo que siente y pregunta qué le falta para decidir.'],
    ['"Pase cuando quiera"', 'No es una cita. Pide día y hora.'],
    ['Su cara no dice lo mismo que su boca', 'Si dice "sí" con cara de duda, nombra la duda: "Parece que algo no le termina de cuadrar."']
  ],

  // Voss · después de la venta: un "sí" no vale nada sin el "cómo".
  POST_Q: [
    ['where', '¿Dónde lo va a poner?', 'Ej. En la caja y en la entrada'],
    ['who', '¿Quién les va a decir a los clientes que lo usen?', 'Ej. La cajera, al cobrar'],
    ['how', '¿Cómo sabremos en una semana si está funcionando?', 'Ej. 5 reseñas nuevas en Google']
  ],

  FOUNDERS_MAX: 5,

  // Plantillas de WhatsApp. {dueno} ya incluye el espacio inicial ("Hola{dueno}," → "Hola Rosa,").
  TEMPLATES: [
    { k: 'seg24', t: 'Seguimiento a las 24 h', d: 'Al día siguiente de la visita', text: 'Hola{dueno}, soy {yo} de Clyclick, el del hablador con QR y NFC que le mostré en {negocio}. ¿Sería mala idea si paso {cuando} a dejárselo con su logo?' },
    { k: 'dueno', t: 'El dueño no estaba', d: 'Esa misma noche, con su perfil de muestra', text: 'Hola{dueno}, soy {yo} de Clyclick. Hoy pasé por {negocio} y no le encontré. Le preparé una muestra de cómo verían sus clientes su perfil: menú, WhatsApp, ubicación y reseñas en un toque. ¿Sería mala idea si paso {cuando} a mostrárselo?' },
    { k: 'cita', t: 'Confirmar la cita', d: 'El día anterior', text: 'Hola{dueno}, soy {yo} de Clyclick. Quedamos para {cuando} en {negocio}. ¿Sigue en pie?' },
    { k: 'referido', t: 'Contacto referido', d: 'Primer mensaje a quien te recomendaron', text: 'Hola{dueno}, soy {yo} de Clyclick, aquí de {ciudad}. {referido} me pasó su contacto porque le hicimos algo que le está funcionando: sus clientes le escriben y le dejan reseñas en un toque. ¿Sería mala idea si le muestro en 10 segundos cuando pase por {negocio}?' },
    { k: 'descarto', t: '"¿Ya descartó…?"', d: 'Solo tras 2 mensajes sin respuesta', text: 'Hola{dueno}, soy {yo} de Clyclick. ¿Ya descartó la idea del letrero para {negocio}?' },
    { k: 'gracias', t: 'Gracias por la compra', d: 'El mismo día de la venta', text: 'Hola{dueno}, gracias por confiar en Clyclick. Quedó listo lo de {negocio}. Recuerde ponerlo {donde} y pedirles a sus clientes que lo toquen al pagar.' },
    { k: 'resultados', t: 'Resultados a los 7 días', d: 'Una semana después de la venta', text: 'Hola{dueno}, soy {yo} de Clyclick. Ya pasó una semana con su hablador en {negocio}. ¿Cuántas reseñas o mensajes nuevos le llegaron?' },
    { k: 'pedirRef', t: 'Pedir un referido', d: 'Cuando ya le está funcionando', text: 'Hola{dueno}, qué bueno que le está funcionando. ¿A qué otro negocio de la zona cree que le serviría? Si me pasa su contacto, le digo que vengo de su parte.' }
  ],

  // Voss · pliego de negociación para software
  PLIEGO_ACC: [
    'Seguro piensa que esto es caro para un negocio de su tamaño.',
    'Quizás ya le vendieron un sistema que al final nadie usó.',
    'Puede que piense que le va a tocar aprender algo complicado.'
  ],
  PLIEGO_Q: [
    '¿Qué es lo que más tiempo le quita cada día?',
    '¿Cómo maneja hoy sus pedidos, citas o ventas?',
    '¿Qué pasa si en 6 meses todo sigue igual?',
    '¿Cómo sabremos que el sistema está funcionando?',
    '¿Quién más tiene que estar de acuerdo?'
  ],
  PLIEGO_EXTRAS: [
    'Capacitación a su equipo',
    '1 mes de ajustes incluido',
    'Pago en 2 o 3 partes',
    'Paso de sus datos actuales al sistema'
  ],
  PLIEGO_FAIR: 'Quiero que sienta que le trato de forma justa. Si en algún momento siente que no, dígamelo.',

  DOW: ['D', 'L', 'M', 'X', 'J', 'V', 'S'], // índice = Date.getDay()

  TIPS: [
    ['Ley 18 · Lucha por los primeros 5 segundos', 'Saluda, di quién eres y pregunta si es el dueño. Luego di tú primero lo que está pensando ("otro vendedor más") y pide permiso: "¿Sería mala idea si le muestro en 10 segundos?".'],
    ['Ley 17 · Déjalos probar y comprarán', 'Lo que la persona toca y ve en su propio celular lo empieza a sentir suyo. Que lo pruebe siempre, sin que tú toques su celular.'],
    ['Ley 3 · Nunca discutas', 'Ante una objeción no digas "le entiendo" ni "no, pero…". Repite sus últimas palabras, calla y nombra lo que siente.'],
    ['Ley 6 · Pregunta, no digas', 'Pregunta con "qué" y "cómo": "¿Cómo le llegan hoy los clientes nuevos?". Te cuenta su problema y se convence solo.'],
    ['Ley 16 · Ricitos de Oro', 'Muestra siempre 3 opciones, de la más grande a la más pequeña. La del medio parece la decisión segura.'],
    ['Ley 21 · Equivócate más que la competencia', 'Cada "no" es información. Anota el tipo y la razón: con 20 razones ya sabes qué cambiar.'],
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
    ['Ley 22 · Piensa en el Plan A', 'Un plan B le quita esfuerzo al plan A. Hoy tu plan A son tus visitas, sin "mejor mañana".'],
    ['Blount · Habla con quien decide', 'Pregunta "¿usted es el dueño?" al entrar. Venderle a quien no decide es perder la visita.'],
    ['Blount · "Cuando quiera" no es una cita', 'Cada "Volver" necesita día y hora. Sin eso, no hay seguimiento: hay esperanza.'],
    ['Blount · Máximo 2 intentos', 'Si después de 2 intentos sigue en "no", gracias, sonrisa y al siguiente negocio. Tu energía vale más.'],
    ['Blount · Una visita más', 'Cuando cumples tu meta, haz una más. Puede ser la venta del día.'],
    ['Cialdini · Contraste', 'Muestra primero lo grande. Si dice que no, baja en cantidad, nunca en precio.'],
    ['Cialdini · "Porque"', 'Da siempre una razón: "Le recomiendo el de 3 porque sus clientes lo ven en la entrada, la caja y las mesas".'],
    ['Cialdini · Prueba social', 'Menciona clientes reales de la zona, solo si te dieron permiso. Calle › Cerca te dice cuáles.'],
    ['Cialdini · Compromiso', 'Que el cliente escriba sus propios datos. Lo que uno escribe con su mano lo cumple.'],
    ['Cialdini · Reciprocidad', 'Da algo antes de pedir: su perfil de muestra ya diseñado vale más que cualquier descuento.'],
    ['Voss · Autoacusación', 'Di tú primero lo peor que está pensando de ti: "Seguro piensa que soy otro vendedor más". En voz alta pierde fuerza.'],
    ['Voss · Espejo', 'Repite sus últimas 1 a 3 palabras como pregunta y calla 4 segundos. Te explica solo su objeción real.'],
    ['Voss · Busca el "así es"', 'Resume su problema con sus palabras. Cuando diga "así es", pide la venta. "Tiene razón" no sirve.'],
    ['Voss · El "no" da seguridad', '"¿Sería mala idea si…?" deja que diga "no" sin sentirse presionado. Ese "no" es tu permiso.'],
    ['Voss · El sí sin cómo no vale', 'Después de vender pregunta: dónde lo pone, quién lo promueve y cómo sabremos que funciona.'],
    ['Voss · Voz firme para el precio', 'Di el precio en tono bajo y tranquilo, sin sonar a pregunta. Luego ofrece un extra, nunca un descuento.']
  ],

  PREP: [
    'Habladores de demostración listos (ideal: uno de comida, uno de belleza y uno de consultorio/oficina) · Ley 17',
    'Celular cargado y el perfil demo abierto para mostrar',
    'Mensajes de seguimiento enviados antes del primer bloque (Hoy › Mensajes) · Blount',
    'Ruta definida: citas con hora y negocios cerca de cada una (Hoy › Ruta) · Blount',
    'Credencial o camiseta de Clyclick visible · Cialdini (autoridad)',
    'Revisa qué clientes cerca puedes mencionar (Calle › Cerca) · Cialdini',
    'Tus 3 paquetes claros, de mayor a menor (Calle › Precios) · Ley 16',
    'Agua y algo de comer · Ley 9',
    'Forma de cobro lista (efectivo con cambio / datos para transferencia)'
  ],

  STEPS: [
    {
      law: 'Blount · Habla con quien decide', title: '1. Saludo y ¿es el dueño?',
      dont: '"¿Tiene un minutito?" o "Disculpe la molestia…" (invitan a un "no" automático y suenan a vendedor · Ley 11)',
      say: '"Buenos días, soy {yo}, de Clyclick, aquí de {ciudad}. ¿Usted es el dueño?"',
      note: 'Si es el dueño, marca "Dueño" y sigue. Si no, ve al paso 9.'
    },
    {
      law: 'Voss · Autoacusación + permiso · Cialdini · porque', title: '2. Entrada',
      say: '"Seguro está pensando: otro vendedor que me viene a quitar tiempo." (pausa, sonrisa)<br>"Por eso voy rápido: ayudo a negocios de la zona a que sus clientes les escriban y les dejen reseñas en un toque. ¿Sería mala idea si le muestro en 10 segundos? No tiene que descargar nada ni darme datos."',
      note: 'Si contesta "No, dele", ese "no" es tu permiso. Si vienes referido: "Don X me dijo que le preguntara a usted." Si tienes un cliente cerca con permiso, menciónalo (Calle › Cerca).'
    },
    {
      law: 'Ley 17 · Déjalos probar · Cialdini · prueba social', title: '3. Que lo pruebe con SU celular',
      say: '"Acerque su celular aquí. Esto es lo que verían sus clientes: su menú, su WhatsApp, su ubicación, sus redes y dónde dejarle una reseña. En un toque, sin descargar nada."',
      note: 'Nunca toques su celular. Deja el hablador en sus manos mientras carga y marca "Demo".'
    },
    {
      law: 'Voss · Preguntas con qué y cómo', title: '4. Que te cuente su problema',
      say: '"¿Cómo le llegan hoy los clientes nuevos?"<br>"¿Qué pasa cuando un cliente sale contento? ¿Le deja reseña?"',
      note: 'Repite sus últimas 1 a 3 palabras como pregunta y calla 4 segundos. Nombra lo que siente: "Parece que…". Pregunta también: "¿Quién más opina en esto, su socio o su esposa?"'
    },
    {
      law: 'Voss · Busca el "así es"', title: '5. Resumen con sus palabras',
      say: '"O sea: sus clientes salen contentos, pero casi nadie deja reseña, y en Google aparece primero la competencia."',
      note: 'Si responde "así es", pide la venta y marca "Hice el resumen" al registrar. "Tiene razón" es mala señal: suele ser "déjeme en paz".'
    },
    {
      law: 'Cialdini · Contraste + porque · Ley 16', title: '6. Pide la venta de mayor a menor',
      say: '"Tengo tres opciones [muestras Calle › Precios]. Le recomiendo el {medio}, porque {porqueMedio}. Son {precioMedio}." (pausa, voz firme)',
      note: 'Si duda, baja en cantidad, nunca en precio: "Arranquemos con el {basico} en la caja, {precioBasico}." Si le parece caro, ofrece un extra, no un descuento: "Lo que sí puedo hacer es dejarle el perfil diseñado hoy mismo."'
    },
    {
      law: 'Voss · El cómo · Cialdini · compromiso', title: '7. Amarra el cómo',
      say: '"¿Dónde lo va a poner?"<br>"¿Quién les va a decir a los clientes que lo usen?"<br>"¿Cómo sabremos en una semana si está funcionando?"',
      note: 'Pásale tu celular para que él mismo escriba sus datos (Venta › Que el cliente llene sus datos). Al salir, pregunta cómo maneja pedidos o citas: ahí está tu software (Ley 13 · pico-final).'
    },
    {
      law: 'Blount · Máximo 2 intentos · Voss · espejo', title: '8. Si dice que no',
      say: '1. Repite sus palabras y calla: "¿Ya tiene Instagram?"<br>2. Nombra lo que siente: "Parece que ya le funciona para mostrar su trabajo."<br>3. Responde y pregunta: "Justo por eso: esto le manda a la gente a su Instagram desde la mesa. ¿Se lo dejo en la caja?"',
      note: 'Si queda para después: "¿Sería mala idea si paso el jueves a las 10? ¿Va a estar usted?". Tras 2 intentos: gracias, sonrisa (Ley 13) y anota el tipo de "no".'
    },
    {
      law: 'Blount · El dueño no está', title: '9. Si el dueño no está',
      dont: 'Venderle al empleado o dejarle "un volante para el dueño".',
      say: '"No le quiero vender a usted, no es su decisión. ¿Cómo se llama el dueño y a qué hora lo encuentro?"',
      note: 'Muéstrale la demo corta para que le cuente. Registra "Volver" con motivo "Dueño no estaba" y esta noche mándale su perfil de muestra por WhatsApp.'
    }
  ],

  // Objeciones en 3 pasos (Voss + Blount): repetir y callar → nombrar → responder y preguntar.
  OBJECTIONS: [
    {
      obj: 'No me interesa', kind: 'reflejo',
      mirror: '¿No le interesa?',
      label: 'Parece que le llegan vendedores todo el día.',
      turn: 'Casi todos me dicen eso antes de verlo. Son 10 segundos y no tiene que darme datos.',
      ask: '¿Sería mala idea si se lo muestro?',
      note: 'Es un reflejo, no una decisión. Si repite "no", gracias y al siguiente.'
    },
    {
      obj: 'Está caro / no tengo plata ahora', kind: 'objecion',
      mirror: '¿Caro?',
      label: 'Parece que ya ha pagado por cosas que no le trajeron clientes.',
      turn: 'Por eso empezamos pequeño: el {basico} en la caja, {precioBasico}. Si le trae un solo cliente, ya se pagó.',
      ask: '¿Se lo dejo en la caja?',
      note: 'Di el precio con voz firme. Baja en cantidad o agrega un extra, nunca descuento.'
    },
    {
      obj: 'Ya tengo Instagram / Facebook', kind: 'objecion',
      mirror: '¿Ya tiene Instagram?',
      label: 'Parece que ya le funciona para mostrar su trabajo.',
      turn: 'Justo por eso: esto le manda a la gente a su Instagram desde la mesa, junto con su WhatsApp y su ubicación, en un toque.',
      ask: '¿Se lo dejo en la caja?'
    },
    {
      obj: 'Ya tengo un QR / menú QR', kind: 'objecion',
      mirror: '¿Ya tiene QR?',
      label: 'Parece que sus clientes ya están acostumbrados a escanear.',
      turn: 'Aquí está todo junto: menú, WhatsApp, ubicación, reseñas y redes. Y con NFC ni siquiera abren la cámara.',
      ask: '¿Sería mala idea compararlo ahora con su celular?'
    },
    {
      obj: 'Déjeme pensarlo', kind: 'evasiva',
      mirror: '¿Pensarlo?',
      label: 'Parece que hay algo que todavía no le convence.',
      turn: '(silencio) ¿Qué tendría que ver para decidirse?',
      ask: 'Si igual queda para después: ¿Sería mala idea si paso el [día] a las [hora]? ¿Va a estar usted?',
      note: 'Regístralo como Volver con motivo "Lo voy a pensar": queda marcado como frío.'
    },
    {
      obj: 'Mis clientes no usan eso', kind: 'objecion',
      mirror: '¿No lo usan?',
      label: 'Parece que ya probó cosas que sus clientes ignoraron.',
      turn: 'Por eso lo más fácil es verlo: le armo su perfil con su nombre y se lo muestro antes de imprimir nada.',
      ask: '¿Sería mala idea si se lo traigo el [día]?'
    },
    {
      obj: 'Tengo que consultarlo (socio / esposa)', kind: 'evasiva',
      mirror: '¿Consultarlo?',
      label: 'Parece que es una decisión que toman juntos.',
      turn: 'Así no le toca explicarlo a usted: se lo muestro a los dos, me toma 2 minutos.',
      ask: '¿Qué cree que le va a preguntar? ¿A qué hora están los dos?'
    },
    {
      obj: 'No tengo tiempo ahorita', kind: 'evasiva',
      mirror: '¿Ahorita no?',
      label: 'Parece que le caí en mal momento.',
      turn: 'Está trabajando y eso es primero. Son 10 segundos o paso en otro momento, usted elige.',
      ask: '¿Sería mala idea si vuelvo a las [hora]?'
    },
    {
      obj: 'No está el dueño', kind: 'evasiva',
      mirror: '¿No está?',
      label: 'Parece que no le toca decidir esto a usted.',
      turn: 'No le quiero vender a usted. Solo quiero saber cuándo lo encuentro.',
      ask: '¿Cómo se llama y a qué hora está?',
      note: 'Registra "Volver" con motivo "Dueño no estaba".'
    },
    {
      obj: '¿Y si cambio el menú o los precios?', kind: 'pregunta',
      mirror: '¿Si cambia el menú?',
      label: 'Parece que su menú cambia seguido.',
      turn: 'El hablador no cambia: el enlace es el mismo. Lo que se actualiza es su perfil.',
      ask: '¿Qué cambia más en su negocio, el menú o los precios?',
      note: 'Antes de salir, define cuántos cambios incluyes y si cobras por actualizar.'
    }
  ],

  OBJ_KINDS: { reflejo: 'Reflejo', evasiva: 'Evasiva', objecion: 'Objeción', pregunta: 'Pregunta' },

  // Ideas de experimentos. Con a/b se comparan dos variantes día por día.
  EXP_IDEAS: [
    { title: 'Abrir con 3 opciones vs. con 1', hypothesis: 'Si ofrezco primero el paquete grande (contraste), sube el número de habladores por venta.', metric: 'Unidades por venta', a: 'Empiezo por el grande', b: 'Solo ofrezco 1' },
    { title: '"¿Sería mala idea…?" vs. pedir directo', hypothesis: 'Si pido permiso con una pregunta de "no", más dueños aceptan ver la demo (Voss).', metric: 'Demos / visitas', a: '¿Sería mala idea…?', b: '¿Le muestro?' },
    { title: 'Resumen antes de cerrar vs. sin resumen', hypothesis: 'Si resumo su problema hasta oír "así es", cierro más (Voss).', metric: 'Ventas / visitas', a: 'Con resumen', b: 'Sin resumen' },
    { title: 'Perfil de muestra vs. sin muestra', hypothesis: 'Si llevo su perfil ya diseñado, cierro más (Cialdini · reciprocidad + Ley 17).', metric: 'Ventas / visitas', a: 'Con perfil de muestra', b: 'Sin muestra' },
    { title: 'Mencionar clientes cerca vs. no', hypothesis: 'Si nombro a un cliente de la cuadra (con permiso), me dejan mostrar más (Cialdini · prueba social).', metric: 'Demos / visitas', a: 'Menciono clientes', b: 'No menciono' },
    { title: 'Rubro: restaurantes vs. peluquerías', hypothesis: 'Un rubro compra más que el otro. Visito 20 de cada uno y comparo.', metric: 'Ventas / visitas por rubro', a: 'Restaurantes', b: 'Peluquerías' },
    { title: 'Horario: 10–12 h vs. 15–17 h', hypothesis: 'En horas tranquilas el dueño escucha más.', metric: 'Demos / visitas', a: '10–12 h', b: '15–17 h' },
    { title: 'Algo memorable (Ley 10)', hypothesis: 'Un detalle "absurdo" que haga hablar (ej. un hablador gigante de demostración) hace que me recomienden.', metric: 'Referidos / semana' },
    { title: 'Publicar a diario (Ley 2)', hypothesis: 'Si publico un aprendizaje diario de la calle, llegan contactos que no tuve que visitar.', metric: 'Mensajes entrantes / semana' }
  ],

  QUESTIONS: [
    '¿Dormí 7 horas o más?',
    '¿Me moví o hice ejercicio 30 minutos?',
    '¿Mandé mis mensajes de seguimiento antes de salir?',
    '¿Cumplí mis visitas de hoy?',
    '¿Anoté el tipo y la razón de cada "no"?',
    '¿Hice los seguimientos que tocaban hoy?',
    '¿Pedí un referido en cada venta?',
    '¿Publiqué mi aprendizaje del día?',
    '¿Hice la tarea incómoda que venía evitando?'
  ],
  // Migración v3: preguntas que se agregan a quien ya usaba la app, y textos que se actualizan.
  QUESTIONS_NEW: ['¿Mandé mis mensajes de seguimiento antes de salir?', '¿Pedí un referido en cada venta?'],
  QUESTIONS_RENAME: { '¿Anoté la razón de cada "no"?': '¿Anoté el tipo y la razón de cada "no"?' },

  REVIEW_FIELDS: [
    ['worked', '¿Qué funcionó esta semana? (Ley 19: repítelo)'],
    ['didnt', '¿Qué no funcionó? (Ley 21: es información, no un fracaso)'],
    ['truth', 'La verdad incómoda que estoy evitando (Ley 23)'],
    ['improve', 'Mi mejora del 1% para la próxima semana (una sola cosa)'],
    ['delegate', '¿Qué tarea le puedo pasar a alguien? ¿A quién? (Ley 28)'],
    ['teach', 'Lo que voy a enseñar/publicar esta semana (Ley 2)']
  ],

  // El "porque" de cada paquete (Cialdini): se edita en Meta › Ajustes › Paquetes.
  PKG_WHY: [
    'empieza por donde más clientes pasan: la caja',
    'sus clientes lo ven en la entrada, en la caja y en las mesas',
    'cada mesa y cada rincón del local invita a escribirle y dejarle reseña'
  ],

  DEFAULT_PACKAGES: [
    { name: 'Básico', units: 1, price: 15, desc: '1 hablador personalizado con QR + NFC y su perfil', why: 'empieza por donde más clientes pasan: la caja' },
    { name: 'Negocio', units: 3, price: 39, desc: 'Mostrador + mesas. El más equilibrado', why: 'sus clientes lo ven en la entrada, en la caja y en las mesas' },
    { name: 'Completo', units: 6, price: 75, desc: 'Todo el local cubierto', why: 'cada mesa y cada rincón del local invita a escribirle y dejarle reseña' }
  ]
};

// Lista plana de razones (compatibilidad con registros anteriores).
window.CONTENT.REASONS = window.CONTENT.NO_TYPES.reduce((a, t) => a.concat(t.reasons), []);
