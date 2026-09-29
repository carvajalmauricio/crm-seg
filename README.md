# Sistema CEO · Clyclick

App web móvil (sin servidor ni dependencias) para aplicar *El Diario de un CEO* a la venta del hablador QR + NFC y abrir la puerta a los softwares de Clyclick. Diseñada para iPhone siguiendo las guías de Apple: títulos grandes, listas agrupadas, hojas inferiores, modo oscuro. Los datos se guardan en el propio dispositivo.

## Pantallas

| Pestaña | Para qué | Leyes |
|---|---|---|
| **Hoy** | Compromiso de la mañana, anillo de visitas, barra de acciones de calle (Visita, Demo, Venta, No, Volver) con Deshacer, seguimientos del día, cierre de sí/no, racha. "Corregir" edita los registros de cualquier día | 6, 7, 20, 31 |
| **Calle** | Guion en tarjetas deslizables, objeciones, paquetes para mostrar al cliente y checklist | 3, 6, 13, 15, 16, 17, 18 |
| **Clientes** | Búsqueda, filtros por etapa, orden por cercanía y ficha con WhatsApp, llamada, Apple Maps, Calendario, Contactos, cotización y fotos | 20, 25, 26 |
| **Progreso** | Semana contra la anterior, embudo, razones de los "no", revisión guiada y experimentos | 19, 21, 23 |
| **Meta** | Meta a 90 días, ecuación de la disciplina, hábito, calculadora de margen, pre-mortem y ajustes/respaldo | 8, 22, 23, 25, 27 |

## Funciones nativas del iPhone (sin nube)

- **Calendario**: los seguimientos generan un evento `.ics` con alerta 15 min antes.
- **Contactos**: cada cliente se guarda como `.vcf`.
- **Ubicación**: GPS al registrar un negocio, dirección aproximada (OpenStreetMap) y ruta en Apple Maps.
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
js/content.js      # textos: guion, objeciones, leyes, preguntas
js/store.js        # estado, migraciones, localStorage, cálculos
js/native.js       # calendario, contactos, GPS, fotos, compartir, cotización
js/ui.js           # iconos y componentes
js/views.js        # pantallas
js/sheets.js       # hojas inferiores
js/app.js          # eventos, navegación, deshacer
```

## Datos

Todo vive en el dispositivo. Descarga un respaldo cada semana (Meta › Ajustes › Guardar respaldo). Las fotos no van en el respaldo.
