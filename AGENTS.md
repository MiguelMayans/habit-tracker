# AGENTS.md — Proyecto Habits

Contexto y reglas para cualquier agente de código (OpenCode + GLM 5.3 Flash) trabajando en este repo.

## Qué es esto

App personal de habit-tracking gamificada, inspirada estéticamente en Persona (P4/P5).
Filosofía: presencia e intencionalidad > productividad. Ver diseño de sistema completo
en `/docs/game-design.md` (categorías, Focos, curva de XP, intensidades) — no repetir
esas reglas de diseño aquí, este archivo es solo sobre CÓMO se construye el código.

## Stack (decidido, no cambiar sin discutirlo)

- **Client**: React + Vite + Tailwind → deploy en Netlify
- **Server**: Node + Express → deploy en Render (free tier)
- **BBDD**: Drizzle ORM + Turso (libSQL)
- **PWA**: vite-plugin-pwa (target: instalable en Android)

## Reglas duras

- **Usar siempre `pnpm`, nunca `npm`.** Cualquier comando de instalación o script debe
  ser con pnpm (`pnpm install`, `pnpm add`, `pnpm run ...`).
- **Librerías externas solo si están bien establecidas**: muchas estrellas en GitHub,
  mantenimiento activo reciente. Nada de paquetes oscuros o sin mantener. Si hay duda,
  preguntar antes de añadir una dependencia nueva.
- No generar código de fases futuras del roadmap. Cada paso se implementa cuando toca,
  no antes.

## Estructura del monorepo

```
/
├── client/     # React + Vite + Tailwind
├── server/     # Node + Express
├── docs/       # diseño de juego, decisiones, mockups
└── AGENTS.md
```

pnpm workspaces. `client/` y `server/` son paquetes independientes dentro del mismo repo;
el monorepo es solo dónde vive el código, no dónde se despliega — cada uno se despliega
por su lado (Netlify / Render / Turso, y más adelante self-hosted).

## Modelos de código

- **Primary**: GLM 5.3 Flash (vía OpenCode)
- **Alternativa para tareas simples**: DeepSeek V4-Flash

## Fase actual del roadmap

Estamos en el **paso 1: setup del monorepo** (pnpm workspaces, carpetas `client/`/`server/`,
este mismo archivo). Sin lógica de negocio todavía.

Próximos pasos inmediatos:
- Paso 2: cliente Vite arrancando en dev, sin Tailwind ni componentes propios todavía
- Paso 3: Tailwind + estilos base (paleta, tipografía, pixel art)

(El roadmap completo tiene 12 pasos, hasta self-hosting y integración con Arduino.
No hace falta detallarlos todos aquí — se actualiza esta sección a medida que avanzamos.)
