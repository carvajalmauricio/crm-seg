# Sistema CEO · Clyclick

App web móvil (sin servidor ni dependencias) para vender el hablador QR + NFC y abrir la puerta a los softwares de Clyclick. Combina *El Diario de un CEO* (Bartlett), *Objeciones* (Blount), *Influencia* (Cialdini) y *Rompe la barrera del no* (Voss). Diseñada para iPhone siguiendo las guías de Apple: títulos grandes, listas agrupadas, hojas inferiores, modo oscuro. Los datos se guardan en el propio dispositivo.

## Pantallas

| Pestaña | Para qué | Fuentes |
|---|---|---|
| **Hoy** | Compromiso, anillo de visitas, barra de calle (Visita, **Dueño**, Demo, Venta, No, Volver) con Deshacer, **mensajes de hoy**, **plan del día** (citas con hora y negocios cerca), **ruta**, experimento A/B del día, cierre de sí/no y racha | Leyes 6, 7, 20, 31 · Blount |
| **Calle** | Guion de 9 pasos con tus datos, **objeciones en 3 pasos**, tipos de "no", señales de "sí" falso, tipos de dueño, **precios de mayor a menor con "porque"**, **pliego de software**, **clientes cerca** y checklist | Blount · Cialdini · Voss |
| **Clientes** | Búsqueda, filtros, cercanía y ficha con plantillas de WhatsApp, "que el cliente llene sus datos", post-venta, referidos, tipo de dueño, dato clave y pliego | Leyes 20, 25, 26 · Voss |
| **Progreso** | Semana contra la anterior, embudo con "hablé con el dueño", tipos y razones de los "no", cierre con y sin "así es", origen de los clientes, fundadores, revisión y experimentos A/B | Leyes 19, 21, 23 |
| **Meta** | Meta a 90 días, disciplina, hábito, margen, **lo que vale tu tiempo**, pre-mortem y ajustes (nombre, ciudad, paquetes con "porque") | Leyes 8, 22, 23, 25, 27 |

## Lo nuevo en v3

- **Blount**: botón «Dueño», "Dueño no estaba" con mensaje esa noche, 3 tipos de "no", "Volver" exige día y hora, plan del día y ruta (centro y radios), una visita más al cumplir la meta.
- **Cialdini**: precios de mayor a menor con "porque", clientes cerca con permiso para mencionarlos, 5 clientes fundadores, referidos, pantalla para que el cliente escriba sus datos, experimentos A/B.
- **Voss**: entrada con autoacusación y "¿Sería mala idea…?", objeciones en 3 pasos (repetir, nombrar, responder), detector de "sí" falso, "¿Ya descartó…?" tras 2 mensajes sin respuesta, 3 preguntas después de la venta y resultados a los 7 días, tipo de dueño, quién más decide, dato clave, pliego con rango no redondo y la casilla «Hice el resumen y dijo "así es"».
- Los datos de v2 se migran solos: paquetes reciben su "porque", las preguntas nuevas se agregan sin borrar las tuyas y los "no" antiguos quedan como "sin clasificar".

## Funciones nativas del iPhone (sin nube)

- **Calendario**: los seguimientos generan un evento `.ics` con alerta 15 min antes.
- **Contactos**: cada cliente se guarda como `.vcf`.
- **Ubicación**: GPS al registrar un negocio, dirección aproximada (OpenStreetMap), ruta en Apple Maps y clientes cerca.
- **WhatsApp**: plantillas con el nombre del dueño, del negocio y la cita.
- **Cámara**: fotos del local o logo, guardadas en IndexedDB.
- **Compartir**: respaldo a Archivos/WhatsApp e imagen de cotización.

Con la app agregada a la pantalla de inicio, los archivos se entregan por la hoja de Compartir; en Safari se descargan.

## Uso local

```bash
python3 -m http.server 8000
```

## Estructura

```
index.html
css/styles.css     # sistema de diseño (claro/oscuro)
icons/             # ícono de pantalla de inicio
js/content.js      # textos: guion, objeciones, plantillas, pliego, leyes, preguntas
js/store.js        # estado, migraciones (v3), localStorage, cálculos, cola de mensajes, A/B
js/native.js       # calendario, contactos, GPS, fotos, compartir, cotización
js/ui.js           # iconos, componentes y relleno de plantillas
js/views.js        # pantallas
js/sheets.js       # hojas inferiores
js/app.js          # eventos, navegación, deshacer
```

## Datos

Todo vive en el dispositivo. Descarga un respaldo cada semana (Meta › Ajustes › Guardar respaldo). Las fotos no van en el respaldo.
