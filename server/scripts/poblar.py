#!/usr/bin/env python3
"""
Puebla la base con datos de prueba para ver cómo se comporta la app con un
historial largo. TEMPORAL: se borra con `despoblar.py` antes de la 1.0.

Va por la API a propósito, no por SQL: así la XP y los niveles de focos y
categorías los calcula el backend con su curva real, y los datos quedan
consistentes en vez de inventados a mano.

Deja constancia de todo lo que crea en `poblado.json`, para que el borrado
posterior sea exacto y no toque nada que ya estuviera ahí.
"""
import json, random, sys, urllib.request, urllib.error
from datetime import datetime, timedelta

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
random.seed(7)  # reproducible: si hay que repetir, salen los mismos datos

def api(metodo, ruta, cuerpo=None):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(BASE + ruta, data=datos, method=metodo,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print(f"  ! {metodo} {ruta} -> {e.code} {e.read().decode()[:160]}")
        return None

HOY = datetime.now().replace(hour=20, minute=0, second=0, microsecond=0)

# categoría, nombre, días/semana, día en que empieza (hacia atrás), día en que
# se abandona (None = sigue vivo), pesos de intensidad chispa/impulso/all_out
FOCOS = [
    (1, "Gimnasio",              3.0, 150, None, (1, 4, 3)),
    (1, "Correr",                2.0, 120, None, (2, 3, 1)),
    (1, "Dormir 8h",             5.0,  90, None, (5, 1, 0)),
    (2, "Leer Dune",             3.5, 110,   18, (3, 3, 1)),
    (2, "Meditar",               4.0, 140, None, (6, 1, 0)),
    (2, "Curso de estadística",  1.5,  60, None, (1, 2, 2)),
    (3, "Llamar a los padres",   1.0, 150, None, (2, 2, 0)),
    (3, "Cenas con amigos",      0.8, 130, None, (0, 2, 3)),
    (4, "Levantarme a las 7",    4.5, 100, None, (5, 2, 0)),
    (4, "Cero móvil en la cama", 3.0,  75,   40, (3, 1, 0)),
    (5, "Arduino",               1.2,  95, None, (0, 2, 3)),
    (5, "Inglés",                2.5,  70, None, (2, 3, 1)),
    (5, "Proyecto tracker",      2.0,  30, None, (1, 2, 3)),
]

NOTAS = {
    "Gimnasio": ["Pecho y espalda", "Pierna", "", "Hombro y brazo", "Full body"],
    "Correr": ["5k suaves", "", "Series", "10k", "Trote corto"],
    "Dormir 8h": ["", "", "Me acosté pronto", ""],
    "Leer Dune": ["", "Dos capítulos", "Terminado el primer libro", "Un rato antes de dormir"],
    "Meditar": ["", "10 min", "", "20 min guiada"],
    "Curso de estadística": ["Módulo de regresión", "", "Ejercicios", "Examen del tema 3"],
    "Llamar a los padres": ["", "Llamada larga", ""],
    "Cenas con amigos": ["", "Cumple de Marta", "Cena en casa"],
    "Levantarme a las 7": ["", "", "6:45 hoy", ""],
    "Cero móvil en la cama": ["", "Dejado en el salón", ""],
    "Arduino": ["Sensor de temperatura", "", "Soldando", "El display por fin va"],
    "Inglés": ["", "Podcast en el coche", "Clase con Sam", "Vocabulario"],
    "Proyecto tracker": ["Curva de XP", "", "Pantalla de registro", "Fondo nuevo", "Desplegable"],
}

# La semana muerta: unas vacaciones sin registrar nada, para que el historial
# tenga un hueco de verdad y no una regularidad de robot.
HUECO = range(52, 60)

creado = {"focusIds": [], "activityIds": [], "closedFocusId": None,
          "childFocusId": None, "cuando": HOY.isoformat()}

print("Creando focos…")
focos = []
for categoria, nombre, ritmo, inicio, abandono, pesos in FOCOS:
    f = api("POST", "/focuses", {"categoryId": categoria, "name": nombre})
    if not f:
        continue
    creado["focusIds"].append(f["id"])
    focos.append((f["id"], categoria, nombre, ritmo, inicio, abandono, pesos))
    print(f"  {nombre} (id {f['id']})")

print("\nGenerando actividades…")
pendientes = []
for fid, categoria, nombre, ritmo, inicio, abandono, pesos in focos:
    fin = abandono if abandono is not None else 0
    for dia in range(inicio, fin - 1, -1):
        if dia in HUECO or random.random() > ritmo / 7:
            continue
        intensidad = random.choices(["chispa", "impulso", "all_out"], weights=pesos)[0]
        cuando = HOY - timedelta(days=dia, hours=random.randint(0, 11))
        pendientes.append({
            "categoryId": categoria,
            "focusId": fid,
            "description": random.choice(NOTAS[nombre]),
            "intensity": intensidad,
            "date": cuando.isoformat(),
        })

# Una racha viva de los últimos días, para que la tira de 30 no acabe en hueco.
for dia in range(5, -1, -1):
    pendientes.append({
        "categoryId": 1, "focusId": focos[2][0], "description": "",
        "intensity": "chispa",
        "date": (HOY - timedelta(days=dia, hours=2)).isoformat(),
    })

pendientes.sort(key=lambda a: a["date"])
print(f"  {len(pendientes)} actividades a insertar")

for i, a in enumerate(pendientes, 1):
    r = api("POST", "/activities", a)
    if r:
        creado["activityIds"].append(r["activity"]["id"])
    if i % 25 == 0:
        print(f"  … {i}/{len(pendientes)}")

# Un foco terminado a mano y su hijo especializado: el caso que motivó el
# cierre manual —acabaste el libro— y que hasta ahora no se veía con datos.
print("\nCerrando 'Leer Dune' y engendrando su hijo…")
dune = next((f for f in focos if f[2] == "Leer Dune"), None)
if dune:
    if api("PATCH", f"/focuses/{dune[0]}", {"frozen": True}):
        creado["closedFocusId"] = dune[0]
        hijo = api("POST", "/focuses", {"categoryId": 2, "name": "Leer El Mesías de Dune",
                                        "parentFocusId": dune[0]})
        if hijo:
            creado["childFocusId"] = hijo["id"]
            creado["focusIds"].append(hijo["id"])
            for dia in range(16, -1, -2):
                r = api("POST", "/activities", {
                    "categoryId": 2, "focusId": hijo["id"], "description": "",
                    "intensity": random.choice(["chispa", "impulso"]),
                    "date": (HOY - timedelta(days=dia, hours=1)).isoformat()})
                if r:
                    creado["activityIds"].append(r["activity"]["id"])

with open("server/scripts/poblado.json", "w") as fh:
    json.dump(creado, fh, indent=1)

print(f"\nHecho: {len(creado['focusIds'])} focos y {len(creado['activityIds'])} actividades.")
print("Manifiesto en server/scripts/poblado.json")
