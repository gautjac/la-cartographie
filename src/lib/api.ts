import type { Axis, Item, Lang, Rating } from "../types.ts";
import { clamp01 } from "./taste.ts";

/** Read an NDJSON keepalive stream and return the final JSON line's payload. */
async function readLastLine(res: Response): Promise<unknown | null> {
  const raw = await res.text();
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  if (!last) return null;
  try {
    return JSON.parse(last);
  } catch {
    return null;
  }
}

export interface Placement {
  axes: Axis[];
  coords: Record<string, number>;
  blurb: string;
  blurbEn: string;
}

export class ApiError extends Error {}

/** Normalise raw coords against a known axis set, healing/clamping. */
function normCoords(raw: unknown, axes: Axis[]): Record<string, number> {
  const out: Record<string, number> = {};
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const a of axes) out[a.key] = clamp01(src[a.key] as number);
  return out;
}

function asAxes(raw: unknown): Axis[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a): Axis | null => {
      if (!a || typeof a !== "object") return null;
      const o = a as Record<string, unknown>;
      const key = String(o.key ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      if (!key) return null;
      return {
        key,
        label: String(o.label ?? key),
        labelEn: String(o.labelEn ?? o.label ?? key),
        low: String(o.low ?? ""),
        lowEn: String(o.lowEn ?? o.low ?? ""),
        high: String(o.high ?? ""),
        highEn: String(o.highEn ?? o.high ?? ""),
      };
    })
    .filter((a): a is Axis => a !== null)
    .slice(0, 6);
}

/**
 * Place one item on the domain's map. On the first item for a domain, Claude
 * defines the axes; afterwards it must reuse the supplied axes verbatim.
 */
export async function chartItem(input: {
  domain: string;
  target: string;
  lang: Lang;
  existingAxes?: Axis[];
  known?: { name: string; coords: Record<string, number> }[];
}): Promise<Placement> {
  const res = await fetch("/api/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: input.domain,
      target: input.target,
      lang: input.lang,
      existingAxes: input.existingAxes ?? [],
      known: (input.known ?? []).slice(0, 24),
    }),
  });
  const parsed = (await readLastLine(res)) as
    | { result?: Record<string, unknown>; error?: string }
    | null;
  if (!res.ok || !parsed || parsed.error || !parsed.result) {
    throw new ApiError(parsed?.error || `Le traceur n'a pas répondu (${res.status}).`);
  }
  const r = parsed.result;
  const axes = (input.existingAxes && input.existingAxes.length
    ? input.existingAxes
    : asAxes(r.axes));
  if (axes.length < 2) throw new ApiError("Axes invalides.");
  return {
    axes,
    coords: normCoords(r.coords, axes),
    blurb: String(r.blurb ?? ""),
    blurbEn: String(r.blurbEn ?? r.blurb ?? ""),
  };
}

export interface DiscoveryResult {
  name: string;
  realityNote: string;
  realityNoteEn: string;
  why: string;
  whyEn: string;
  oneStep: string;
  oneStepEn: string;
  coords: Record<string, number>;
}

/** Ask Claude for one real "adjacent unknown" just beyond the cluster. */
export async function discover(input: {
  domain: string;
  axes: Axis[];
  items: Item[];
  avoid: string[];
  lang: Lang;
}): Promise<DiscoveryResult> {
  const res = await fetch("/api/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: input.domain,
      lang: input.lang,
      axes: input.axes,
      avoid: input.avoid.slice(0, 80),
      items: input.items.slice(0, 60).map((it) => ({
        name: it.name,
        rating: it.rating as Rating,
        coords: it.coords,
      })),
    }),
  });
  const parsed = (await readLastLine(res)) as
    | { result?: Record<string, unknown>; error?: string }
    | null;
  if (!res.ok || !parsed || parsed.error || !parsed.result) {
    throw new ApiError(parsed?.error || `La découverte a échoué (${res.status}).`);
  }
  const r = parsed.result;
  const name = String(r.name ?? "").trim();
  if (!name) throw new ApiError("Aucune découverte renvoyée.");
  return {
    name,
    realityNote: String(r.realityNote ?? ""),
    realityNoteEn: String(r.realityNoteEn ?? r.realityNote ?? ""),
    why: String(r.why ?? ""),
    whyEn: String(r.whyEn ?? r.why ?? ""),
    oneStep: String(r.oneStep ?? ""),
    oneStepEn: String(r.oneStepEn ?? r.oneStep ?? ""),
    coords: normCoords(r.coords, input.axes),
  };
}
