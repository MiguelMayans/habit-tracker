# AGENTS.md — Proyecto Habits

Reglas obligatorias para cualquier agente (OpenCode, Claude Code, etc.) que trabaje en este repo.

## Package manager

- Usar **SIEMPRE `pnpm`**. Nunca `npm` ni `yarn`.
- Comandos típicos: `pnpm install`, `pnpm add <pkg>`, `pnpm dev`, `pnpm build`.

## Dependencias externas

- Solo añadir librerías **muy establecidas**: muchas estrellas en GitHub, mantenimiento activo reciente.
- Nada de paquetes oscuros, sin mantener, o con pocos usuarios. Si hay duda, preguntar antes de instalar.
- Antes de añadir una dependencia nueva, comprobar si el problema se puede resolver con lo que ya está instalado.

## Stack técnico (decidido y cerrado)

- **Frontend:** React + Vite + Tailwind → deploy en Netlify
- **Backend:** Node + Express → deploy en Render (free tier, cold starts aceptados)
- **Base de datos:** Drizzle ORM + Turso/libSQL
- **Mobile:** PWA vía `vite-plugin-pwa` (target: Android)
- **Agente de código:** en pruebas entre dos opciones
  - OpenCode CLI — modelo primary **GLM-5.3-Flash**, alternativa **Kimi K3**
  - Claude Code — probándolo en paralelo para comparar
  - (Antes se usaba Kimi K2.7-Code como primary y DeepSeek V4-Flash como alternativa en OpenCode — cambiado tras comparar lanzamientos recientes)

## Estructura del repo

Monorepo con pnpm workspaces:

```
proyecto-habits/
├── client/     # React + Vite + Tailwind
├── server/     # Node + Express + Drizzle
├── AGENTS.md
└── docs/
    ├── DESIGN.md
    └── ROADMAP.md
```

El monorepo es solo dónde vive el código. Cada proveedor (Netlify, Render, Turso) apunta a su subdirectorio de forma independiente — monorepo ≠ monodeploy.

## Costes

Todo el hosting actual (Netlify, Render, Turso) debe mantenerse en **tier gratuito**. Es un requisito duro mientras estemos en la fase cloud (pasos 1–10 del roadmap).

## Filosofía de diseño (resumen — ver docs/DESIGN.md para detalle)

- Refuerzo positivo únicamente. **Nunca** restar XP ni bajar niveles.
- Presencia e intencionalidad por encima de maximizar productividad.
- Antes de tocar cualquier lógica de XP, categorías o Focos, consultar `docs/DESIGN.md`.

## Metodología de trabajo

- Cada paso del roadmap (`docs/ROADMAP.md`) debe quedar verificable de forma independiente antes de pasar al siguiente.
- No generar código a bulto ni saltar pasos. Explicar antes de implementar.
