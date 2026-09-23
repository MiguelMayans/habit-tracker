#!/usr/bin/env python3
"""
Deshace exactamente lo que creó `poblar.py`, leyendo su manifiesto.

Borra SOLO por id, nunca por rango ni por fecha: las filas que ya estaban en
la base antes de poblar no se tocan. Al terminar compara el estado con
`snapshot-antes-de-poblar.json` y canta cualquier diferencia.

Ojo: `DELETE /activities/:id` solo admite actividades de hoy, así que para
esto se va directo a la base con Drizzle. Borrar la actividad por SQL no
revierte la XP, por eso después se restauran los niveles y la XP de focos y
categorías a los valores del snapshot.
"""
import json, subprocess, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

manifiesto = json.load(open("server/scripts/poblado.json"))
snapshot = json.load(open("server/scripts/snapshot-antes-de-poblar.json"))

acts = manifiesto["activityIds"]
focos = manifiesto["focusIds"]
print(f"A borrar: {len(acts)} actividades y {len(focos)} focos.")
print("Se restaurarán después los niveles y la XP del snapshot.\n")

if input("Escribe BORRAR para continuar: ").strip() != "BORRAR":
    print("Cancelado, no se ha tocado nada.")
    sys.exit(0)

# El SQL va en un fichero temporal que ejecuta un script de Node con Drizzle.
# Todo acotado por id: ni un DELETE sin WHERE.
plan = {
    "activityIds": acts,
    "focusIds": focos,
    "categories": [
        {"id": c["id"], "level": c["level"], "currentXp": c["currentXp"]}
        for c in snapshot["categories"]
    ],
    "focusesToRestore": [
        {"id": f["id"], "level": f["level"], "currentXp": f["currentXp"],
         "frozen": f["frozen"]}
        for fs in snapshot["focuses"].values() for f in fs
    ],
}
json.dump(plan, open("server/scripts/plan-borrado.json", "w"), indent=1)
print("Plan escrito en server/scripts/plan-borrado.json")
print("Ejecuta:  pnpm --filter server exec tsx scripts/despoblar.ts")
