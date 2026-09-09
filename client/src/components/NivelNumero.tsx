import n0 from "../assets/numeros/0.png";
import n1 from "../assets/numeros/1.png";
import n2 from "../assets/numeros/2.png";
import n3 from "../assets/numeros/3.png";
import n4 from "../assets/numeros/4.png";
import n5 from "../assets/numeros/5.png";
import n6 from "../assets/numeros/6.png";
import n7 from "../assets/numeros/7.png";
import n8 from "../assets/numeros/8.png";
import n9 from "../assets/numeros/9.png";

/** Cada cifra recortada de la lámina, con su ráfaga. Índice = valor. */
const CIFRAS = [n0, n1, n2, n3, n4, n5, n6, n7, n8, n9];

/** Alto de la lámina de origen, para declarar la proporción de cada `img`. */
const ALTO_ORIGEN = 260;
const ANCHOS_ORIGEN = [200, 149, 179, 181, 178, 187, 189, 194, 199, 197];

/**
 * El nivel dibujado a mano, cifra a cifra, en lugar de tipografía.
 *
 * Compromiso asumido, el mismo que con los logotipos de categoría: son
 * imágenes, así que no escalan sin perder nitidez ni responden a un cambio de
 * color. Se exportan a 260px de alto, más del doble de lo que miden en
 * pantalla, para que aguanten una pantalla de densidad doble.
 *
 * Solo se usa donde el nivel es el protagonista y va grande. En los sitios
 * donde aparece pequeño —la ficha de un foco, el diálogo de borrado— sigue
 * siendo texto: a ese tamaño la ráfaga se convierte en ruido y no se lee.
 */
export function NivelNumero({
  valor,
  alto,
  className = "",
}: {
  valor: number;
  /** Alto en píxeles de cada cifra, ráfaga incluida. */
  alto: number;
  className?: string;
}) {
  const cifras = String(valor).split("").map(Number);

  return (
    // Una sola etiqueta para todo el número: leído cifra a cifra, un lector de
    // pantalla diría "uno, dos" en vez de "doce".
    <span
      role="img"
      aria-label={`Nivel ${valor}`}
      className={`inline-flex items-end ${className}`}
    >
      {cifras.map((c, i) => (
        <img
          key={i}
          src={CIFRAS[c]}
          alt=""
          width={ANCHOS_ORIGEN[c]}
          height={ALTO_ORIGEN}
          className="block w-auto max-w-none"
          style={{
            height: `${alto}px`,
            // Las ráfagas se solapan un poco, como en la lámina de origen: sin
            // esto las cifras de un número de dos dígitos quedan separadas y
            // se leen como dos cosas distintas.
            marginLeft: i === 0 ? undefined : `${-alto * 0.14}px`,
          }}
        />
      ))}
    </span>
  );
}
