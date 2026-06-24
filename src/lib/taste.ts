import { RATING_WEIGHT, type Axis, type Item } from "../types.ts";

/** Clamp to [0,1] and coerce bad values to 0.5 (the neutral middle). */
export function clamp01(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0.5;
  return Math.min(1, Math.max(0, v));
}

/** Coordinate for one axis, healing missing keys to the centre. */
export function coordOf(coords: Record<string, number>, axisKey: string): number {
  return clamp01(coords[axisKey]);
}

/**
 * The weighted centroid of taste — the gravitational heart of what you love.
 * Loved items pull hardest; "non" items don't pull at all.
 */
export function centroid(items: Item[], axes: Axis[]): Record<string, number> | null {
  if (!items.length || !axes.length) return null;
  let totalWeight = 0;
  const acc: Record<string, number> = {};
  for (const a of axes) acc[a.key] = 0;

  for (const it of items) {
    const w = RATING_WEIGHT[it.rating];
    if (w <= 0) continue;
    totalWeight += w;
    for (const a of axes) acc[a.key] += coordOf(it.coords, a.key) * w;
  }

  if (totalWeight === 0) {
    // Fall back to an unweighted average across everything placed.
    for (const a of axes) {
      acc[a.key] = items.reduce((s, it) => s + coordOf(it.coords, a.key), 0) / items.length;
    }
    return acc;
  }

  for (const a of axes) acc[a.key] = acc[a.key] / totalWeight;
  return acc;
}

/** Euclidean distance across all axes (normalised so the diagonal ≈ 1). */
export function distance(
  a: Record<string, number>,
  b: Record<string, number>,
  axes: Axis[],
): number {
  if (!axes.length) return 0;
  let sum = 0;
  for (const ax of axes) {
    const d = coordOf(a, ax.key) - coordOf(b, ax.key);
    sum += d * d;
  }
  return Math.sqrt(sum) / Math.sqrt(axes.length);
}

/** Pick the two axes along which the user's items spread the most (variance). */
export function principalAxes(items: Item[], axes: Axis[]): [string, string] | null {
  if (axes.length < 2) return null;
  if (items.length < 2) return [axes[0].key, axes[1].key];

  const variances = axes.map((ax) => {
    const vals = items.map((it) => coordOf(it.coords, ax.key));
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const v = vals.reduce((s, x) => s + (x - mean) * (x - mean), 0) / vals.length;
    return { key: ax.key, v };
  });
  variances.sort((p, q) => q.v - p.v);
  return [variances[0].key, variances[1].key];
}
