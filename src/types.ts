export type Lang = "fr" | "en";

export type Rating = "amour" | "aime" | "bof" | "non";

export const RATINGS: Rating[] = ["amour", "aime", "bof", "non"];

/** Weight used when computing the taste centroid (the heart of your cluster). */
export const RATING_WEIGHT: Record<Rating, number> = {
  amour: 2,
  aime: 1,
  bof: 0.3,
  non: 0,
};

/** One perceptual dimension of a domain, a 0..1 scale with named poles. */
export interface Axis {
  key: string; // stable lowercase ascii slug, e.g. "chaleur"
  label: string; // FR
  labelEn: string;
  low: string; // FR low-pole label (coord → 0)
  lowEn: string;
  high: string; // FR high-pole label (coord → 1)
  highEn: string;
}

/** A field of taste the user cares about: films, natural wine, guitar riffs… */
export interface Domain {
  id: string;
  name: string;
  axes: Axis[]; // defined by Claude on the first item; stable thereafter
  createdAt: number;
  xAxis?: string; // selected projection (axis keys) — a UI preference
  yAxis?: string;
}

/** A single thing the user has experienced and placed on the map. */
export interface Item {
  id: string;
  domainId: string;
  name: string;
  note?: string; // the user's own note
  blurb?: string; // Claude's one-line characterization (FR)
  blurbEn?: string;
  rating: Rating;
  coords: Record<string, number>; // axisKey -> 0..1
  createdAt: number;
  origin: "user" | "discovery"; // "discovery" = accepted from an adjacent-unknown suggestion
}

/** An "adjacent unknown" Claude proposes — one real step beyond your cluster. */
export interface Discovery {
  id: string;
  domainId: string;
  name: string;
  realityNote: string; // what it actually is (real, attributable) — FR
  realityNoteEn: string;
  why: string; // how it's adjacent to your taste — FR
  whyEn: string;
  oneStep: string; // the single dimension it stretches — FR
  oneStepEn: string;
  coords: Record<string, number>;
  createdAt: number;
  status: "pending" | "tried" | "dismissed";
}

export interface Settings {
  id: "app";
  onboarded: boolean;
  lang: Lang;
}
