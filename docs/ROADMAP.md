# ROADMAP.md — Mike's Life

12 pasos acordados. Marcar `[x]` según se vayan completando y verificando de forma independiente.

- [x] **1. Monorepo setup** — pnpm workspaces, carpetas `client/`/`server/`, `AGENTS.md`, sin lógica todavía
- [x] **2. Vite client en dev** — sin Tailwind, sin componentes custom
- [x] **3. Tailwind + estilos base estilo Persona/manga** — paleta, tipografía display (Dela Gothic One), utilidades de inclinación y sombra dura (ver `docs/DESIGN.md`)
- [x] **4. Drizzle + esquema Turso** — modelo categorías/Focos/actividades → schema + migraciones
- [x] **5. Backend Express con ruta `/health`** — confirmar cadena Express → Drizzle → Turso
- [x] **6. Endpoints CRUD core** — seeds de categorías fijas, crear/listar Foco, spawn de Foco hijo, crear/listar actividad, lógica de cascada de XP
- [x] **7. Cliente consumiendo la API** — pantallas mínimas, sin pulir, funcional end-to-end
- [x] **8. Deploy a producción** — **todo en Netlify**: el cliente como sitio estático y el servidor como función (`netlify/functions/api.mjs`, Express envuelto con `serverless-http`). Se descartó Render porque en el plan gratuito el servicio se duerme a los 15 minutos y tarda ~50 s en despertar, que en una app que abres treinta segundos para registrar algo es inservible. Al compartir dominio desaparece el CORS en producción, y `VITE_API_URL` es `/api`, ya declarado en `netlify.toml`. En el panel de Netlify van las credenciales de Turso y `API_KEY`: la API exige esa clave en la cabecera `X-Api-Key` en todas las rutas salvo `/health`, y sin la variable se cierra entera (falla cerrada)
- [x] **9. PWA** — `vite-plugin-pwa`, instalable en Android. Manifiesto e iconos sacados del emblema de las cinco categorías (incluido uno enmascarable); service worker que guarda el esqueleto de la app para abrir al instante y sin conexión, y que **nunca cachea la API**; versiones nuevas con aviso ("NUEVA VERSIÓN · ACTUALIZAR"), comprobando al volver a primer plano. Detalle en `client/vite.config.ts` y `client/src/lib/pwa.ts`
- [x] **10. Ajuste fino de UX/UI** — lenguaje Persona en todas las pantallas, fondo de rayos a tres tintas, sistema de movimiento (transición de pantalla, impacto de XP, rótulo de subida de nivel) y registro rápido desde la home y el detalle. Detalle en `docs/DESIGN.md`
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

## 1.0 cerrada (1 oct 2026)

Pasos 1–10 hechos. La base se reseteó a cero para estrenarla.

## Para la 1.1

- [x] Misiones: lista de llamadas y gestiones, con Chispa opcional al cumplirlas (ver docs/DESIGN.md)
- Indicador de inactividad en los Focos (en categorías ya existe)
- Los 3 hitos narrativos camino del nivel 20, y los hitos de categoría
- Sesión de balanceo de las curvas de XP (ver arriba)
- Registrar sin conexión: guardar en el dispositivo y sincronizar al volver
