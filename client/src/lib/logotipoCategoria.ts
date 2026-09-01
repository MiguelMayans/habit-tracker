import corazon from "../assets/wordmarks/corazon.png";
import cuerpo from "../assets/wordmarks/cuerpo.png";
import disciplina from "../assets/wordmarks/disciplina.png";
import ingenio from "../assets/wordmarks/ingenio.png";
import mente from "../assets/wordmarks/mente.png";

export type LogotipoCategoria = {
  src: string;
  ancho: number;
  alto: number;
};

/**
 * Logotipo dibujado de una categoría, cuando lo hay. Las que no tienen se
 * pintan con su nombre en texto, así que añadir uno nuevo es una línea.
 *
 * Compromiso asumido a conciencia: el texto va DENTRO de la imagen, o sea que
 * no se traduce, no escala a otros idiomas y no sigue a un cambio de nombre en
 * la base de datos. Para una app personal compensa; si algún día deja de ser
 * personal, esto es lo primero que hay que replantear.
 */
const LOGOTIPOS: Record<string, LogotipoCategoria> = {
  corazon: { src: corazon, ancho: 520, alto: 202 },
  cuerpo: { src: cuerpo, ancho: 520, alto: 247 },
  disciplina: { src: disciplina, ancho: 520, alto: 225 },
  ingenio: { src: ingenio, ancho: 520, alto: 224 },
  mente: { src: mente, ancho: 520, alto: 285 },
};

export function logotipoDeCategoria(slug: string): LogotipoCategoria | null {
  return LOGOTIPOS[slug] ?? null;
}
