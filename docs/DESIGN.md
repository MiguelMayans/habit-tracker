# DESIGN.md — Sistema de juego de Mike's Life

Documento de referencia para toda la lógica de juego (XP, categorías, Focos, actividades).
Diseño v1 cerrado. Cualquier cambio aquí debe discutirse explícitamente, no improvisarse durante la implementación.

## Filosofía core

- **Presencia sobre productividad**: ver una película con atención plena cuenta; hacerlo en "modo zombie" no. El objetivo es el enganche intencional, no maximizar horas productivas.
- **Consumo pasivo / scroll** es la "Sombra" implícita del sistema — se combate con refuerzo positivo, nunca con castigo.
- **Refuerzo positivo únicamente**: un sistema punitivo (pérdida de XP, bajada de nivel) genera evitación y ansiedad en vez de motivación. Rechazado explícitamente.
- **Los niveles NUNCA bajan.** Ni por inactividad ni por "recaídas". Esta es una decisión de diseño explícita y central.
- En vez de castigo: indicador visual de "X días desde la última XP en esta categoría/Foco" — señal honesta, no punitiva. Se deriva de la fecha de la última actividad (no necesita campo nuevo en el modelo de datos). **Implementado** para categorías en la home: `lastActivityAt` en `GET /categories` y `client/src/lib/fecha.ts` lo traduce a HOY / AYER / HACE N DÍAS, en rojo a partir de una semana. Falta llevarlo a los Focos.

## Las 5 categorías (fijas, nombres y orden finales)

1. **Cuerpo** — actividad física, ejercicio, salud, evitar el alcohol
2. **Mente** — ocio consciente; presencia genuina vs. evasión/modo vacío
3. **Corazón** — relaciones: pareja, hijos, amigos. Pareja/familia viven como Focos destacados dentro de esta categoría, no como categorías aparte
4. **Disciplina** — constancia y compromiso
5. **Ingenio** — aprendizaje de nuevas skills (Arduino, idiomas, arte, código). Se distingue de Mente por la adquisición activa de competencia, no solo el disfrute consciente

## Focos (dentro de cada categoría)

- Tags creados por el usuario (ej: Arduino, Inglés, Pareja) — sin fecha de fin
- Nivel máximo: **20**, planteado como arcos estilo Confidant de Persona 5
- Curva de XP: coste de **alcanzar** el nivel n = `floor(base * n^exponente)`, acumulando desde n=2 (el nivel 1 es el punto de partida y no cuesta nada). Implementada en `server/src/lib/xpCurve.ts`
  - Focos: `base = 8`, `exponente = 1.35` → nivel 2 a 20 XP, nivel 20 a 4.099 XP acumulada
  - `currentXp` se guarda siempre como XP acumulada total histórica; el nivel se deriva de ella, nunca se resetea
  - Valores sujetos a revisión en la sesión de balanceo pendiente
- 3 hitos narrativos en el camino a nivel 20
- Al llegar a nivel 20: el Foco se congela como trofeo de maestría permanente; opción manual (no automática) de generar un Foco hijo más especializado empezando en nivel 1
- **Borrado de Focos** (`DELETE /focuses/:id`, en la interfaz con pulsación mantenida sobre la ficha):
  - Las actividades **no se borran**: ocurrieron y su XP ya está sumada en la categoría. Se desvinculan (`focusId = null`) y siguen en el historial. Borrarlas equivaldría a restar XP, que contradice la regla central
  - Un Foco con hijos se rechaza con 400: el hijo es una especialización del padre y quedaría colgando de nada
  - Un Foco congelado sí se puede borrar: "permanente" describe que no se descongela, no que sea indestructible

## Categorías

- Nivel máximo: **99** (arco largo, multi-año, sin techo de contenido)
- Misma familia de curva de XP que los Focos pero con base/exponente distintos — más lenta, sostenible para 99 niveles sin tiempo desproporcionado en niveles altos (60+)
  - Categorías: `base = 35`, `exponente = 0.7` → nivel 2 a 56 XP, nivel 99 a 51.185 XP acumulada
- También tienen hitos narrativos cada N niveles — intervalo TBD

## Registro de actividades

- **Siempre retroactivo** (después del hecho, nunca timer/sesión en vivo)
- Sin catálogo predefinido de actividades
- Botón único "Registrar actividad" → formulario mínimo:
  - Categoría (obligatorio)
  - Foco (opcional, debe pertenecer a la categoría seleccionada)
  - Descripción libre (**opcional**: lo que cuenta es que ocurrió y con qué intensidad; se guarda como cadena vacía y la interfaz la muestra como "Sin descripción")
  - Intensidad

### Intensidad (tiers fijos, sin escalado por categoría)

| Tier | XP |
|------|-----|
| Chispa | 10 |
| Impulso | 20 |
| All-Out | 35 |

### Cascada de XP (1:1)

- Si hay Foco seleccionado → la misma XP va al Foco **y** a la categoría padre simultáneamente
- Si no hay Foco → la XP va solo a la categoría

## Diferido a v1.1 / v2.0

- Sistema de To-Do vinculado a categoría/Foco que se auto-convierte en Actividad al completarse (mismo modelo de XP)

## Dirección visual (referencia definitiva: mockup HTML v3 de sesión previa)

- Estética: lenguaje gráfico de diseño de la serie Persona — **sin** personajes anime ilustrados
- Color primario del sistema: Amarillo (`#FFE500`) + negro puro (`#000000`) + blanco roto (`#F5F5F0`). El amarillo se reserva para elementos de sistema UI (botones principales, barra de XP, level-up), no para categorías
- Paleta de acento por categoría (aplicada, croma alto):
  - Cuerpo → `#FF2036`
  - Disciplina → `#FF8A00`
  - Mente → `#9945FF`
  - Ingenio → `#00F0C8`
  - Corazón → `#FF2E88`
  - Sustituye a la paleta provisional inicial (`#E63946` / `#F77F00` / `#5B4E8C` / `#00C2A8` / `#E84393`), demasiado apagada contra negro. Mente era el caso extremo: `#5B4E8C` estaba tan desaturado que no leía como color de categoría
  - El fondo bajó de `#141414` a negro puro `#000000`: buena parte de la intensidad viene del negro, no de los acentos
  - Cada acento se usa también como texto sobre negro; el más justo es Mente (~3.9:1), suficiente para display grande pero no para texto pequeño
- Rasgos CSS clave: contraste máximo, tipografía en mayúsculas oversized diagonal/skewed, composición de paneles ligeramente rotada, sombras duras (sin blur), texturas halftone/screentone, líneas de velocidad radiales, bordes de tarjeta recortados, bordes de acento gruesos, micro-animaciones tipo "flash/slam" (no fades suaves)
- Tipografía display (decidida): **Dela Gothic One** (Google Fonts), gótica japonesa en bloque — registro de rotulación manga, no de cómic americano. Expuesta como `--font-display` / `font-display`. Se aplica en mayúsculas
- Tipografía de datos: **Chakra Petch** (Google Fonts), palo seco angular para cifras y etiquetas. Expuesta como `--font-datos`; es la fuente por defecto del `body`. Dela Gothic One pesa demasiado por debajo de 14px
- Utilidades y piezas (definidas en `client/src/index.css`):
  - `text-slam` → inclinación `-10deg` + sombra dura doble (negro pegado + acento rojo desplazado, sin blur)
  - `text-slam-tilt` → igual pero además girado `-3deg`, para títulos sueltos
  - `panel-slam` → panel inclinado con sombra sólida negra; el giro individual se pasa con la custom property `--rotacion`
  - `tarjeta-categoria` + `tarjeta-recorte` + `contenido-slam` → la inclinación va en la tarjeta y el recorte de esquina en una **capa interior**, para que el nivel pueda sobresalir por encima del borde. El contenido va contra-inclinado, para que el texto se lea recto con el panel en diagonal
  - La sombra dura de color se pinta con `drop-shadow`, **nunca con `box-shadow`**: `clip-path` recorta también la `box-shadow`, así que sobre una silueta recortada no llega a verse. `drop-shadow` sigue el contorno y tampoco lleva blur
  - `marca-fondo` → marca de agua del fondo de la tarjeta. Es el icono de la categoría (`client/src/components/CategoryIcon.tsx`), SVG de trazo sobre rejilla de 24 dibujado en código: escala sin pixelarse, hereda el color con `currentColor` y no añade assets que mantener, igual que las texturas
  - `texto-contorno` / `texto-golpe` → contorno negro duro en las cuatro direcciones (y sombra desplazada en el segundo). Es lo que permite texto blanco sobre cualquier categoría sin una placa de fondo: blanco sobre Ingenio da 1.4:1 y sobre Disciplina 2.3:1, ilegible sin contorno. Se probó antes una placa negra interior; se descartó porque apagaba el color, que es lo que debe mandar
  - Sobre tarjeta a color, el amarillo solo aparece en la barra de XP (que va sobre negro): como texto desaparecería encima de Disciplina o Ingenio. El aviso de inactividad tampoco puede ir en rojo — se pierde sobre Cuerpo — y va como etiqueta negra sólida
  - `barra-xp` / `barra-xp-relleno`, `corte-pildora`, `bloque-roto`
  - `banda-sangre` → banda clara que cruza la pantalla de borde a borde por detrás del título, con `left/right: -50vw` y recorte por el `overflow-hidden` del layout. Color, reborde y giro se pasan con `--banda-fondo`, `--banda-reborde` y `--banda-giro`: la home la usa en hueso, el detalle de categoría en el color de la categoría, y el registro toma el color de la categoría elegida
  - Controles: `campo-marco` (el marco es lo que se inclina) + `campo` (el control va contra-inclinado). Inclinar el propio `input` torcería el texto que escribe el usuario — tolerable en una etiqueta, molesto en un `textarea`. El foco se pinta con `:focus-within` sobre el marco
  - `boton-slam` → botón inclinado con sombra dura que **cae sobre su propia sombra** al pulsarlo; `ficha-intensidad` → las tres intensidades como fichas pulsables en vez de un desplegable, con `aria-pressed` como estado
  - Movimiento: `anim-fila` (entrada escalonada con `--retardo`, para filas de formulario y listas), `anim-slam` (llegada del resultado) y `anim-flash-nivel` (destello de subida de nivel, con `steps(1)`: cortes secos, sin fundido)
  - Texturas en CSS puro, sin imágenes: `textura-diagonales` y `textura-trama` (halftone). Viven en el layout de `App.tsx` y siempre **detrás** del contenido: superpuestas actúan como veladura y apagan el color de las tarjetas. Por eso se retiraron el grano de líneas y el degradado inferior — nada de difuminados sobre el contenido
  - Ningún degradado suave: el destello que recorre la barra de XP es una banda sólida de bordes duros animada con `steps()`, no un brillo desenfocado
  - Animaciones de entrada: `anim-bloque`, `anim-titulo`, `anim-cinta`, `anim-tarjeta` (escalonada con `--retardo`), `anim-fab`. Todas usan `backwards` y no `both`, porque `both` congela el fotograma final y anula los `:hover` posteriores. Todo el movimiento se apaga con `prefers-reduced-motion`
- La barra de XP mide el progreso **dentro** del nivel, no la XP total. `GET /categories` lo devuelve ya calculado (`progress`, `xpToNextLevel`, `atMaxLevel`) vía `server/src/services/categoriesService.ts`, para que la curva siga teniendo una única fuente de verdad en `server/src/lib/xpCurve.ts` y el cliente no la duplique
- Layout:
  - Home = lista vertical de las 5 categorías (color de acento, nombre diagonal grande, nivel + barra de XP visible)
  - Tap en categoría → header full-width de alto impacto + lista de Focos
  - FAB persistente para "Registrar actividad" visible en todas las pantallas
