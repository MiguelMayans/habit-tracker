import type { WorkKind } from "../api/client";

/** In the order the filter chips show them. */
export const WORK_KINDS: WorkKind[] = [
  "game", "book", "series", "movie", "anime", "comic",
];

/**
 * Each kind's colour in the Refuge, drawn from the same earthy family as the
 * categories (plus a slate blue for games, the one hue the categories lack),
 * so a shelf of mixed things reads at a glance.
 */
export const KIND_COLOR: Record<WorkKind, string> = {
  game: "#5b82ad",
  book: "var(--color-disciplina)",
  series: "var(--color-corazon)",
  movie: "var(--color-cuerpo)",
  anime: "var(--color-mente)",
  comic: "var(--color-ingenio)",
};

/** How each kind is named on screen: singular for a work, plural for a filter. */
export const KIND_LABEL: Record<WorkKind, { one: string; many: string }> = {
  game: { one: "Videojuego", many: "Juegos" },
  book: { one: "Libro", many: "Libros" },
  series: { one: "Serie", many: "Series" },
  movie: { one: "Película", many: "Pelis" },
  anime: { one: "Anime", many: "Anime" },
  comic: { one: "Manga / cómic", many: "Cómic" },
};

/** What a session is called, by kind: "today I played / read / watched". */
export const SESSION_VERB: Record<WorkKind, string> = {
  game: "He jugado",
  book: "He leído",
  series: "He visto",
  movie: "He visto",
  anime: "He visto",
  comic: "He leído",
};

/** An example for the progress field, so it is clear it is free text. */
export const PROGRESS_HINT: Record<WorkKind, string> = {
  game: "jefe final, 60 %",
  book: "pág. 140",
  series: "T2 · E5",
  movie: "a mitad",
  anime: "E12",
  comic: "tomo 4",
};
