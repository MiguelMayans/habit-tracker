import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, RegisterActivityResult, XpOutcome } from "../api/client";
import { categoryColorVar } from "../lib/categoryColor";
import { CategoryIcon } from "./CategoryIcon";

/** Compases de la secuencia, en ms desde que se abre el modal. */
const T_ARRANQUE = 380;
const T_LLENADO = 850;
const T_ESTALLIDO = 420;

/**
 * Lo que ves al registrar. La barra no se pinta en su estado final: arranca
 * donde estaba y sube. Si el nivel sube, llega al tope, revienta y vuelve a
 * empezar desde cero — que es el momento por el que existe esta pantalla.
 */
export function ModalResultado({
  resultado,
  categoria,
  volverA,
  onCerrar,
}: {
  resultado: RegisterActivityResult;
  categoria: Category | undefined;
  /** Id de la categoría de la que venías, si el registro llegó con contexto. */
  volverA: string;
  onCerrar: () => void;
}) {
  const acento = categoria
    ? categoryColorVar(categoria.slug)
    : "var(--color-amarillo)";

  useEffect(() => {
    function onTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onTecla);
    return () => window.removeEventListener("keydown", onTecla);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-negro"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-resultado"
    >
      <div className="textura-diagonales" />
      <div className="textura-trama" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10">
        <p
          id="titulo-resultado"
          className="anim-fila text-[10px] font-bold tracking-[0.24em] text-hueso/50"
        >
          ACTIVIDAD REGISTRADA
        </p>

        <p
          className="anim-slam texto-rotulo m-0 mt-3 font-display text-[64px] leading-none text-amarillo"
          style={{ transform: "skewX(-8deg)" }}
        >
          +{resultado.xpGained}
          <span className="text-[26px]"> XP</span>
        </p>

        <div className="mt-9 grid gap-7">
          <BloqueXp
            titulo={categoria?.name ?? "Categoría"}
            slug={categoria?.slug}
            acento={acento}
            datos={resultado.category}
          />
          {resultado.focus && (
            <BloqueXp
              titulo="Foco"
              acento={acento}
              datos={resultado.focus}
              retardo={180}
            />
          )}
        </div>

        {/* Cerrar deja el formulario listo para otra; el enlace cierra el
            recorrido devolviéndote de donde viniste. */}
        <div
          className="anim-fila mt-10 grid gap-3"
          style={{ "--retardo": "0.9s" } as React.CSSProperties}
        >
          <Link
            to={volverA === "" ? "/" : `/categories/${volverA}`}
            className="boton-slam w-full"
          >
            <span>{volverA === "" ? "Ver categorías" : "Volver"}</span>
          </Link>
          <button
            type="button"
            onClick={onCerrar}
            className="boton-slam w-full"
            style={{
              background: "transparent",
              color: "var(--color-amarillo)",
              boxShadow: "none",
              border: "2px solid var(--color-amarillo)",
            }}
          >
            <span>Registrar otra</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BloqueXp({
  titulo,
  slug,
  acento,
  datos,
  retardo = 0,
}: {
  titulo: string;
  slug?: string;
  acento: string;
  datos: XpOutcome;
  retardo?: number;
}) {
  // Ancho actual de la barra y si debe animarse: al reiniciar tras subir de
  // nivel hay que saltar a cero sin transición, o se vería retroceder.
  const [ancho, setAncho] = useState(datos.progressBefore);
  const [conTransicion, setConTransicion] = useState(false);
  const [nivelVisible, setNivelVisible] = useState(datos.levelBefore);
  const [celebrando, setCelebrando] = useState(false);

  useEffect(() => {
    const relojes: number[] = [];
    const t = (ms: number, fn: () => void) =>
      relojes.push(window.setTimeout(fn, retardo + ms));

    if (!datos.leveledUp) {
      t(T_ARRANQUE, () => {
        setConTransicion(true);
        setAncho(datos.progressAfter);
      });
    } else {
      // 1. Sube hasta arriba del todo.
      t(T_ARRANQUE, () => {
        setConTransicion(true);
        setAncho(1);
      });
      // 2. Revienta: fogonazo, número nuevo y sacudida.
      t(T_ARRANQUE + T_LLENADO, () => {
        setCelebrando(true);
        setNivelVisible(datos.levelAfter);
      });
      // 3. La barra vuelve a cero de golpe, sin transición.
      t(T_ARRANQUE + T_LLENADO + 120, () => {
        setConTransicion(false);
        setAncho(0);
      });
      // 4. Y arranca el nivel nuevo.
      t(T_ARRANQUE + T_LLENADO + T_ESTALLIDO, () => {
        setConTransicion(true);
        setAncho(datos.progressAfter);
      });
    }

    return () => relojes.forEach(window.clearTimeout);
  }, [datos, retardo]);

  return (
    <div className={celebrando ? "anim-sacude relative" : "relative"}>
      {celebrando && (
        <div
          className="anim-fogonazo pointer-events-none fixed inset-0 z-20"
          style={{ background: "var(--color-hueso)" }}
        />
      )}

      <div className="flex items-end gap-2.5">
        {slug && (
          <CategoryIcon
            slug={slug}
            strokeWidth={2.4}
            className="mb-1 h-6 w-6 shrink-0"
            style={{ color: acento }}
          />
        )}
        <h2
          className="m-0 font-display text-[19px] leading-none uppercase"
          style={{ color: acento }}
        >
          {titulo}
        </h2>

        <span className="relative ml-auto flex items-baseline gap-1.5">
          {celebrando && (
            <span
              className="anim-estallido pointer-events-none absolute -inset-10 -z-10"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg at 50% 50%, var(--color-amarillo) 0deg 5deg, transparent 5deg 13deg)",
                WebkitMaskImage:
                  "radial-gradient(circle at 50% 50%, #000 10%, transparent 62%)",
                maskImage:
                  "radial-gradient(circle at 50% 50%, #000 10%, transparent 62%)",
              }}
            />
          )}
          <span className="text-[9px] font-bold tracking-[0.24em] text-hueso/60">
            NIVEL
          </span>
          <b
            // La key remonta el número al subir, y con ello dispara su entrada.
            key={nivelVisible}
            className={`texto-rotulo font-display text-[38px] leading-[0.82] text-amarillo ${
              celebrando ? "anim-cae-nivel" : ""
            }`}
          >
            {nivelVisible}
          </b>
        </span>
      </div>

      <div className="barra-xp relative mt-3 h-5 overflow-hidden bg-[#242424]">
        <div
          className="relative h-full bg-amarillo"
          style={{
            width: `${Math.round(ancho * 100)}%`,
            transition: conTransicion
              ? "width .85s cubic-bezier(.2,.9,.25,1)"
              : "none",
          }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] text-hueso/70">
        <span>{datos.totalXp} XP</span>
        <i className="h-[3px] w-[3px] rotate-45 bg-hueso/50" />
        <span>
          {datos.atMaxLevel ? (
            <b className="text-amarillo">NIVEL MÁXIMO</b>
          ) : (
            <>
              <b className="text-amarillo">{datos.xpToNextLevel}</b> AL NV{" "}
              {datos.levelAfter + 1}
            </>
          )}
        </span>
        {datos.leveledUp && celebrando && (
          <span
            className="ml-auto bg-amarillo px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-negro"
            style={{ transform: "skewX(-10deg)" }}
          >
            ¡SUBES A {datos.levelAfter}!
          </span>
        )}
      </div>
    </div>
  );
}
