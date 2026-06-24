import type { Lang, Rating } from "../types.ts";

/** Raw hex for SVG fills (Tailwind classes can't reach into <svg> attributes). */
export const RATING_HEX: Record<Rating, string> = {
  amour: "#f0c761",
  aime: "#74c8c0",
  bof: "#8089a6",
  non: "#b5705f",
};

/** Base star radius by rating — adored things shine biggest. */
export const RATING_RADIUS: Record<Rating, number> = {
  amour: 7,
  aime: 5.4,
  bof: 4.2,
  non: 3.6,
};

export function ratingLabel(r: Rating, lang: Lang): string {
  const fr: Record<Rating, string> = {
    amour: "Coup de cœur",
    aime: "J'aime",
    bof: "Bof",
    non: "Non",
  };
  const en: Record<Rating, string> = {
    amour: "Adored",
    aime: "Like",
    bof: "Meh",
    non: "No",
  };
  return lang === "fr" ? fr[r] : en[r];
}

export function ratingGlyph(r: Rating): string {
  return { amour: "★", aime: "✦", bof: "·", non: "×" }[r];
}
