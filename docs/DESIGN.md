# DESIGN.md — Sistema de juego de Mike's Life

Documento de referencia para toda la lógica de juego (XP, categorías, Focos, actividades).
Diseño v1 cerrado. Cualquier cambio aquí debe discutirse explícitamente, no improvisarse durante la implementación.

## Filosofía core

- **Presencia sobre productividad**: ver una película con atención plena cuenta; hacerlo en "modo zombie" no. El objetivo es el enganche intencional, no maximizar horas productivas.
- **Consumo pasivo / scroll** es la "Sombra" implícita del sistema — se combate con refuerzo positivo, nunca con castigo.
- **Refuerzo positivo únicamente**: un sistema punitivo (pérdida de XP, bajada de nivel) genera evitación y ansiedad en vez de motivación. Rechazado explícitamente.
- **Los niveles NUNCA bajan como castigo.** Ni por inactividad ni por "recaídas". Esta es una decisión de diseño explícita y central.
- **Excepción: deshacer un registro de hoy.** La regla anterior protege contra el castigo — algo que el usuario hizo (o dejó de hacer) y que el sistema le reprocha. Corregir un registro equivocado del mismo día (foco o intensidad mal elegidos) es distinto: esa XP nunca se ganó de verdad, así que restarla no es un castigo, es arreglar un dato mal introducido. **Implementado**: `DELETE /activities/:id`, acotado a actividades de hoy — la ventana existe para que sea corrección de un despiste reciente y no un mecanismo para "arrepentirse" de un día entero con perspectiva. Revierte la XP en cascada (foco si lo tenía, y categoría) y recalcula el nivel de verdad, sin el tope de "nunca baja" que sí aplica a `applyXp`. Si el foco estaba congelado y cae por debajo de nivel 20, se descongela.
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
- **Cerrar un Foco a mano** (`PATCH /focuses/:id` con `{ frozen: true }`, en la interfaz el botón «cerrar» de la ficha): no todo lo que se sigue termina en el nivel 20. Acabaste el libro, perdiste los cuatro kilos, el objetivo dejó de tener sentido. Cerrarlo lo deja igual que un Foco congelado: deja de aceptar actividad y pasa a poder engendrar un hijo especializado. **Su XP no se toca** — sigue contada en la categoría, coherente con la regla central
  - No se guarda una segunda bandera para distinguir los dos casos: `frozen` con el nivel al máximo es maestría, `frozen` por debajo solo puede venir de un cierre a mano. Todo lo que hay que saber ya está en los datos
  - Un cierre se puede reabrir (`{ frozen: false }`); la maestría **no**, y el servidor la rechaza: lo primero es una decisión y las decisiones cambian, lo segundo se ganó
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

## Misiones (lista de pendientes)

Llamadas, gestiones, recados: cosas que hay que hacer, no actividades que ya pasaron. Viven aparte del registro, pero conectadas a él. Es el To-Do que estaba diferido a la 1.1, en versión sencilla.

- **Apuntar cuesta dos segundos**: solo el título es obligatorio. Cuándo (HOY / MAÑANA / una fecha) y categoría son opcionales y solo aparecen cuando ya has escrito algo
- **XP opcional**: sin categoría, una misión no da nada, es solo una lista. Con categoría, cumplirla registra una **Chispa** (10 XP) en esa categoría, en la misma transacción que la marca. Es la intensidad más baja a propósito: presencia sobre productividad, un recado no vale lo que un entrenamiento. Sin foco: se valoró y se dejó fuera por sencillez
- **Desmarcar**: una misión sin XP se desmarca siempre. Una que dio XP solo el mismo día, y al desmarcarla se deshace su actividad: es la misma excepción de "deshacer un registro de hoy", no otra
- **Borrar** una misión cumplida no toca su XP: la actividad ocurrió y se queda, como al borrar un foco
- La fecha límite se guarda como **día local** (`AAAA-MM-DD`), no como instante: "vence hoy" tiene que significar el hoy del usuario, y solo el navegador conoce su zona horaria
- `activityId` no es clave foránea a propósito: Turso las aplica, y la actividad se puede seguir deshaciendo desde el historial de su categoría. Si ya no existe, desmarcar simplemente reabre
- Las cumplidas se ven una semana (plegadas al fondo); después dejan de listarse
- **Interfaz** (`MissionsPage`, `/missions`): se entra desde la izquierda de la barra inferior, con un número terracota que cuenta lo que vence hoy o ya ha vencido. Grupos por urgencia: Vencidas (rótulo en terracota), Hoy, Próximas, Sin fecha y Hechas (plegadas). El círculo de la izquierda cumple; el resto de la fila abre la hoja de edición. Al cumplir, el círculo se rellena, el título se tacha y la fila se desvanece hacia la sección de hechas. Si el título empieza por «Llamar…», «Pagar…», «Comprar…», lleva un icono de teléfono, papeleo o bolsa: se lee del texto, no hay que clasificar nada

## Refugio (ocio en curso)

Los videojuegos, libros, series, películas, anime y manga/cómic que tienes entre manos. Se llamó «Guarida» en la etapa Persona; con el rediseño pasó a **Refugio** (en el código sigue siendo `Lair` / `works`, y la ruta `/lair`). Su acento es la lavanda de Mente, y cada tipo tiene su color (`KIND_COLOR` en `lib/works.ts`): las obras en curso son tarjetas de ese color con el icono del tipo de marca de agua.

- Cada obra tiene **tipo**, **título**, **estado** (en curso / para después / terminado) y una línea de **progreso en texto libre** ("T2 · E5", "pág. 140"): cada tipo mide el avance a su manera, y un campo estructurado por tipo sería un formulario que nadie rellena
- **XP: solo por sesiones.** El botón «He jugado / leído / visto hoy» de una obra en curso despliega las tres intensidades y registra una actividad en **Mente** (ocio consciente), con el título como descripción y en la misma transacción que apunta `lastSessionAt` en la obra. Tener cosas en la lista o terminarlas no da XP: cuenta el rato vivido con presencia, no el consumo. Deshacer la sesión es deshacer esa actividad, con la misma excepción de siempre
- Las fechas siguen al estado en el servidor: empezar pone `startedAt` (la primera vez), terminar pone `finishedAt`, y sacar algo de terminados lo borra
- Terminar pide una nota opcional de 1 a 5 puntos y la obra pasa a **Terminados** (cuadrícula de dos columnas)
- Borrar una obra no toca las sesiones registradas: ocurrieron y su XP se queda en Mente
- Los filtros por tipo solo aparecen cuando hay más de un tipo que distinguir
- En curso y Para después se agrupan **por tipo** (juegos con juegos, libros con libros), en el orden de los filtros, con un rótulo por grupo (icono en círculo y nombre), por debajo del título de la sección; con un filtro puesto los rótulos sobran y no salen. Terminados no se agrupa: con una obra por tipo, la cuadrícula quedaba a medias, y cada una ya dice su tipo

## Dirección visual: calma

Desde el 7 de noviembre de 2026. La estética anterior, el lenguaje gráfico de Persona (negro puro, sombras duras, paneles inclinados, rayos, golpes y sacudidas), queda archivada intacta en la etiqueta `v1.1-persona` y la rama `persona`. Era divertida de construir y demasiado agresiva para vivir con ella: Miguel no la usaba. Esta app es un rincón tranquilo de unos segundos al día, en un día ya lleno de estímulos y redes, y tiene que dar calma, no competir por la atención.

- **Superficies:** fondo arena plano y muy claro (`--color-sand` `#F3EEE5`); tarjetas de papel crema (`--color-paper` `#FBF8F2`) con un filete de 1px (`--color-line`) y una sombra apenas perceptible. Esquinas redondeadas (20px en tarjetas, píldora en botones y fichas). Nada inclinado ni recortado
- **Tinta:** carbón cálido (`--color-ink` `#2E2A25`), nunca negro puro; `--color-ink-soft` para lo secundario y `--color-ink-faint` solo para lo terciario. Todo el texto va en tinta, nunca en color de categoría
- **Categorías en tonos terrosos apagados**, solo como acento (círculo del icono teñido, barras finas, puntos): Cuerpo terracota `#B86B4F`, Mente lavanda `#7D74AE`, Corazón rosa empolvado `#B9737E`, Disciplina ocre `#B08637`, Ingenio salvia `#5E8F76`. Cada pantalla pasa el suyo por `--accent`
- **Avisos sin alarma:** lo vencido, lo frío (más de una semana sin actividad) y los errores van en `--color-warn`, la terracota, en texto; nunca en bloques rojos
- **Tipografía:** **Figtree** para todo el texto, en mayúsculas y minúsculas normales y con cifras tabulares, y **Fraunces** (serif con el eje de suavidad al máximo, clase `display`) solo para lo que pone el tono: el saludo, los títulos de pantalla, la cifra del día y el nivel grande. La primera versión, solo sans y plana, se leía como un formulario; la serif le da voz. Nada en mayúsculas sostenidas
- **Saludo** (`lib/daypart.ts`): una frase dicha a Miguel por su nombre, al estilo de la home de Claude («¿Cómo va la tarde, Miguel?»). Hay varias por franja del día y se elige por fecha, no al azar: se mantiene toda la tarde y cambia al día siguiente. Ninguna pide nada. A su lado, un sol (o una luna de noche) en terracota que gira una sola vez al llegar
- **La luz de la hora:** dos manchas de luz muy suaves y fijas detrás de todo (`body::before`), con el tono según la franja (`data-daypart` en `<html>`, que pone `App.tsx` y se actualiza al volver a la app): melocotón por la mañana, miel por la tarde, lavanda al anochecer y gris frío de madrugada. Las tarjetas de categoría y de obra recogen un reflejo de su color en la esquina (`card-tinted`) y ceden un poco bajo el dedo (`press-card`)
- **Piezas** (`client/src/index.css`, en `@layer components` para que las utilidades de Tailwind puedan ajustarlas): `card`, `btn` (tinta), `btn-soft` (papel), `btn-danger` (texto terracota), `link-quiet`, `chip` (se rellena de tinta al pulsarla), `icon-pick` y `icon-disc` (icono en círculo teñido), `field`, `field-label`, `progress` (pista fina con relleno de acento), `skeleton`. Componentes de maquetación compartidos en `components/Layout.tsx` (`BackLink`, `SectionTitle`)
- **Diálogos:** hojas que suben desde abajo sobre un velo suave (`DialogFrame`); en pantalla ancha, centradas
- **Personalidad, sin ruido** (segunda vuelta, 7 nov 2026: la primera versión calmada le resultó «muy aburrida de ver» y echaba de menos la personalidad de Persona). Se recuperó el ADN de Persona en voz baja:
  - **Tarjetas de color** (`card-color`): cada categoría es una tarjeta de su color en pastel (17% sobre papel), no papel con un punto de color. Lo que Persona hacía a todo volumen
  - **Marca de agua** (`watermark`): el icono de la categoría, enorme, girado y al 13%, saliendo por la esquina, como la marca de fondo de las cartas de Persona
  - **Nivel protagonista** (`level-big`): la cifra en serif grande, en el color de la categoría oscurecido hacia la tinta
  - **Contraste:** la tarjeta «Hoy» es la única superficie oscura (`card-ink`), con los días en puntos color miel y la racha con una llamita; hace de ancla de la home
  - **Textura de papel:** grano fijo y muy leve sobre todo (`body::after`), para que los colores planos se lean como tinta impresa
  - **Movimiento con muelle:** las cosas aterrizan con un pequeño rebote, las barras se llenan desde cero al llegar, la XP ganada sube y se desvanece, el círculo de una misión hace «pop» al marcarse
  - **Subir de nivel suelta un confeti suave**: un anillo de puntos en los cinco colores, compuesto y no aleatorio, justo cuando la barra se llena
  - Los acentos de categoría subieron un punto de saturación para que el pastel no se apagara
- **El juego, presente pero callado:** nivel como «Nivel 3» en texto, barras finas, la racha y el «+XP de hoy» en una tarjeta discreta de la home. La XP ganada aparece unos segundos junto al foco y se va. Subir de nivel lo dice la hoja de resultado con palabras («Cuerpo sube a nivel 4») y la barra se llena y vuelve a empezar: sin banda, sin destello, sin sacudida
- **Movimiento:** solo a la llegada, corto y suave. Las cosas se asientan (`settle`: fundido y 6px de recorrido, escalonado con `--delay`), las pantallas aparecen con un fundido (`ScreenTransition`), las hojas suben, lo cumplido se desvanece (`leaving`). Nada en bucle salvo el esqueleto de carga. Todo se apaga con `prefers-reduced-motion`
- **Sonido** (`client/src/lib/sound.ts`): **apagado por defecto**, se activa con el altavoz de la home y se recuerda en el dispositivo. Solo tres, todo ondas senoidales suaves y sin golpes: `earn` al ganar XP (dos notas cercanas, como una campanilla), `done` al cumplir una misión o terminar una obra (una nota grave y redonda) y `levelUp` (un acorde que se construye nota a nota). Nada en toques normales ni al navegar
- **Iconos:** trazo fino (1.8) en rejilla de 24, dibujados en código (`CategoryIcon`, `MissionIcons`, `WorkIcons`). El Refugio es una casita con puerta en arco
- La barra de XP mide el progreso **dentro** del nivel, no la XP total. `GET /categories` lo devuelve ya calculado (`progress`, `xpToNextLevel`, `atMaxLevel`) vía `server/src/services/categoriesService.ts`, para que la curva siga teniendo una única fuente de verdad en `server/src/lib/xpCurve.ts` y el cliente no la duplique
- Layout:
  - Home: fecha y saludo, la tarjeta «Hoy» (XP de hoy, racha y los últimos 30 días como puntos que se tocan) y la lista de las 5 categorías como tarjetas (icono, nombre, cuándo fue la última vez, nivel, barra fina y sus focos plegados)
  - Tap en categoría → cabecera con icono, nombre y nivel grande, sus focos y su historial
  - **Gesto de los Focos, igual en la home y en el detalle** (`useQuickLog` + `QuickIntensities`): tocar un foco activo despliega las tres intensidades y registra en el sitio; tocar uno congelado crea su hijo. Mantener pulsado, o el botón «···», abre la hoja de gestión (`FocusMenu`: renombrar, cerrar/reabrir, borrar). El botón existe porque la pulsación larga no se descubre mirando ni se alcanza con teclado
  - **Barra flotante inferior** (`BottomNav`) en todas las pantallas: Misiones a la izquierda, **Registrar** en el centro (el único círculo relleno de tinta: sigue siendo la acción principal) y Refugio a la derecha. La pantalla actual se marca con la tinta plena sobre una píldora suave. Mientras hay un diálogo abierto se aparta. Es translúcida con desenfoque, para que se intuya lo que pasa por debajo. `html` reserva el hueco de la barra de scroll (`scrollbar-gutter: stable`): sin eso, en escritorio, la página se estrechaba al aparecer la barra y todo lo centrado, la barra inferior incluida, saltaba de lado al cambiar de pantalla
