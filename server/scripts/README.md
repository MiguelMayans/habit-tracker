# Scripts temporales de datos de prueba

**Esto se borra antes de la 1.0.** Existe solo para ver cómo se comporta la
interfaz con un historial largo, en vez de con las pocas filas reales.

- `poblar.py` — crea focos y actividades **por la API**, no por SQL, para que
  la XP y los niveles los calcule el backend con su curva real. Deja
  constancia de cada id creado en `poblado.json`.
- `snapshot-antes-de-poblar.json` — el estado exacto de la base antes de
  tocarla.
- `despoblar.py` + `despoblar.ts` — deshacen exactamente lo creado, borrando
  **solo por id** y restaurando niveles y XP al snapshot. Borrar actividades
  por SQL no revierte la cascada de XP, de ahí la restauración.

```
python3 server/scripts/poblar.py
python3 server/scripts/despoblar.py && pnpm --filter server exec tsx scripts/despoblar.ts
```
