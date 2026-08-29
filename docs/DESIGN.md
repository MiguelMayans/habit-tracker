# DESIGN.md — Sistema de juego de Proyecto Habits

Documento de referencia para toda la lógica de juego (XP, categorías, Focos, actividades).
Diseño v1 cerrado. Cualquier cambio aquí debe discutirse explícitamente, no improvisarse durante la implementación.

## Filosofía core

- **Presencia sobre productividad**: ver una película con atención plena cuenta; hacerlo en "modo zombie" no. El objetivo es el enganche intencional, no maximizar horas productivas.
- **Consumo pasivo / scroll** es la "Sombra" implícita del sistema — se combate con refuerzo positivo, nunca con castigo.
- **Refuerzo positivo únicamente**: un sistema punitivo (pérdida de XP, bajada de nivel) genera evitación y ansiedad en vez de motivación. Rechazado explícitamente.
- **Los niveles NUNCA bajan.** Ni por inactividad ni por "recaídas". Esta es una decisión de diseño explícita y central.
- En vez de castigo: indicador visual de "X días desde la última XP en esta categoría/Foco" — señal honesta, no punitiva. Se deriva de la fecha de la última actividad (no necesita campo nuevo en el modelo de datos). Implementación diferida al paso 10 (UX/UI).

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
  - Descripción libre
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
- Color primario del sistema: Amarillo (`#FFD400` aprox) + casi-negro (`#141414`) + blanco roto (`#F5F5F0`). El amarillo se reserva para elementos de sistema UI (botones principales, barra de XP, level-up), no para categorías
- Paleta de acento por categoría (provisional):
  - Cuerpo → `#E63946`
  - Disciplina → `#F77F00`
  - Mente → `#5B4E8C`
  - Ingenio → `#00C2A8`
  - Corazón → `#E84393`
- Rasgos CSS clave: contraste máximo, tipografía en mayúsculas oversized diagonal/skewed, composición de paneles ligeramente rotada, sombras duras (sin blur), texturas halftone/screentone, líneas de velocidad radiales, bordes de tarjeta recortados, bordes de acento gruesos, micro-animaciones tipo "flash/slam" (no fades suaves)
- Tipografía display (decidida): **Dela Gothic One** (Google Fonts), gótica japonesa en bloque — registro de rotulación manga, no de cómic americano. Expuesta como `--font-display` / `font-display`. Se aplica en mayúsculas
- Utilidades del tratamiento display (definidas en `client/src/index.css`):
  - `text-slam` → inclinación `-10deg` + sombra dura doble (negro pegado + acento rojo desplazado, sin blur)
  - `text-slam-tilt` → igual pero además girado `-3deg`, para títulos sueltos
  - `panel-slam` → panel inclinado con sombra sólida negra; el giro individual se pasa con la custom property `--rotacion`
- Layout:
  - Home = lista vertical de las 5 categorías (color de acento, nombre diagonal grande, nivel + barra de XP visible)
  - Tap en categoría → header full-width de alto impacto + lista de Focos
  - FAB persistente para "Registrar actividad" visible en todas las pantallas
