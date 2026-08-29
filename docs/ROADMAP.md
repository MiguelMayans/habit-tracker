# ROADMAP.md — Proyecto Habits

12 pasos acordados. Marcar `[x]` según se vayan completando y verificando de forma independiente.

- [x] **1. Monorepo setup** — pnpm workspaces, carpetas `client/`/`server/`, `AGENTS.md`, sin lógica todavía
- [x] **2. Vite client en dev** — sin Tailwind, sin componentes custom
- [x] **3. Tailwind + estilos base estilo Persona/manga** — paleta, tipografía display (Dela Gothic One), utilidades de inclinación y sombra dura (ver `docs/DESIGN.md`)
- [x] **4. Drizzle + esquema Turso** — modelo categorías/Focos/actividades → schema + migraciones
- [x] **5. Backend Express con ruta `/health`** — confirmar cadena Express → Drizzle → Turso
- [x] **6. Endpoints CRUD core** — seeds de categorías fijas, crear/listar Foco, spawn de Foco hijo, crear/listar actividad, lógica de cascada de XP
- [ ] **7. Cliente consumiendo la API** — pantallas mínimas, sin pulir, funcional end-to-end
- [ ] **8. Deploy a producción** — cliente en Netlify, servidor en Render, variables de entorno de Turso
- [ ] **9. PWA** — `vite-plugin-pwa`, manifest, iconos, instalable en Android
- [ ] **10. Pulido UX/UI completo** — feedback visual, "chute" de level-up, indicadores de inactividad
- [ ] **11. Migración a self-hosted** — una vez estable en Turso/Render
- [ ] **12. Integración física con Arduino Nano 4 WiFi** — una vez estable el paso 11

---

## Detalle paso 11 — Self-hosted migration

- Mini PC de segunda mano (ThinkCentre / OptiPlex / EliteDesk Mini, i5 6ª/7ª gen, 8GB RAM, ~60–100€) elegido sobre Raspberry Pi para evitar problemas de compatibilidad de imágenes Docker en ARM
- Docker Compose con Postgres o libSQL local + contenedor Express, volúmenes persistentes en SSD
- Tailscale para acceso remoto privado (sin port forwarding, sin exposición de IP pública)
- Restart policies para auto-recuperación tras cortes de luz
- Opcional más adelante: backups automáticos de BBDD y actualizaciones de contenedores vía Watchtower o cron

## Detalle paso 12 — Integración física Arduino

- Arduino Nano 4 WiFi actúa como cliente HTTP, posteando directamente al endpoint de crear-actividad del paso 6
- Ideas abiertas:
  - Sensor de movimiento/acelerómetro para detección de ejercicio
  - Botón físico en el escritorio para loguear una actividad de Ingenio o Mente
  - Luz RGB reaccionando a la XP diaria o a los level-ups

---

## Pendiente de decidir

- Si el roadmap debe incluirse (resumido) dentro del `AGENTS.md` del repo, o queda separado como está ahora en `docs/ROADMAP.md`

## Trabajo de diseño pendiente (diferido, necesita ordenador + hoja de cálculo)

- Balanceo numérico de curvas de XP: valores concretos de base/exponente para Focos y categorías, simulando XP diaria realista con Chispa/Impulso/All-Out para estimar tiempo real hasta nivel 30/60/99
- Definición de intervalos de hitos de categoría

## Decisiones UX/UI pendientes (paso 10)

- Implementación del indicador visual de inactividad
- Pase de pulido visual completo
