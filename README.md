# Sistema CEO · Clyclick

App web (sin servidor ni dependencias) para aplicar *El Diario de un CEO* a la venta del hablador QR + NFC y abrir la puerta a los softwares de Clyclick. Funciona en el celular y guarda los datos en el propio navegador (`localStorage`).

## Secciones

| Pestaña | Para qué | Leyes |
|---|---|---|
| **Hoy** | Compromiso de la mañana, contadores de calle (visita, demo, venta, no, volver), seguimientos del día, cierre de sí/no, racha y mapa de 28 días | 6, 7, 20, 31 |
| **Calle** | Checklist antes de salir, guion de 7 pasos, 8 objeciones y paquetes para mostrar al cliente | 3, 6, 13, 15, 16, 17, 18 |
| **Clientes** | Prospectos por etapa, WhatsApp directo (+593), interés en software por rubro | 20, 25, 26 |
| **Pruebas** | Experimentos semanales con hipótesis, métrica y aprendizaje | 21 |
| **Semana** | Números de esta semana contra la anterior, razones de los "no", revisión guiada | 19, 20, 23, 28 |
| **Meta** | Meta a 90 días, ecuación de la disciplina, hábito foco, calculadora de margen, pre-mortem, configuración y respaldo | 8, 22, 23, 25, 27 |

## Uso local

Abre `index.html` desde cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8000
```

## Estructura

```
index.html
css/styles.css
js/content.js   # textos: guion, objeciones, leyes, preguntas
js/store.js     # estado, localStorage, cálculos
js/views.js     # vistas (HTML escapado)
js/app.js       # eventos, modales, respaldo
```

## Datos

Todo se guarda solo en el dispositivo. Descarga un respaldo cada semana (Meta › Respaldo). En iPhone, agrega la app a la pantalla de inicio para que Safari no borre los datos.
