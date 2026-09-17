import corazon from "../assets/wordmarks/corazon.png";
import cuerpo from "../assets/wordmarks/cuerpo.png";
import disciplina from "../assets/wordmarks/disciplina.png";
import ingenio from "../assets/wordmarks/ingenio.png";
import mente from "../assets/wordmarks/mente.png";

export type CategoryWordmark = {
  src: string;
  width: number;
  height: number;
};

/**
 * A category's drawn wordmark, where there is one. Categories without one are
 * rendered with their name as text, so adding a new wordmark is a single line.
 *
 * A trade-off taken knowingly: the text lives INSIDE the image, which means it
 * is not translatable, does not scale to other languages, and does not follow
 * a name change in the database. Worth it for a personal app; the day it stops
 * being personal, this is the first thing to reconsider.
 */
const WORDMARKS: Record<string, CategoryWordmark> = {
  corazon: { src: corazon, width: 520, height: 202 },
  cuerpo: { src: cuerpo, width: 520, height: 247 },
  disciplina: { src: disciplina, width: 520, height: 225 },
  ingenio: { src: ingenio, width: 520, height: 224 },
  mente: { src: mente, width: 520, height: 285 },
};

export function categoryWordmark(slug: string): CategoryWordmark | null {
  return WORDMARKS[slug] ?? null;
}
