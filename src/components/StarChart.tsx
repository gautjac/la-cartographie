import { useMemo, useState } from "react";
import type { Axis, Discovery, Item } from "../types.ts";
import { useLang } from "../i18n.tsx";
import { coordOf } from "../lib/taste.ts";
import { RATING_HEX, RATING_RADIUS } from "../lib/ratings.ts";

const SIZE = 360;
const PAD = 38;
const INNER = SIZE - PAD * 2;

function px(x: number): number {
  return PAD + coord01(x) * INNER;
}
function py(y: number): number {
  return PAD + (1 - coord01(y)) * INNER;
}
function coord01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

interface Props {
  axes: Axis[];
  items: Item[];
  xKey: string;
  yKey: string;
  centroidCoords: Record<string, number> | null;
  discovery: Discovery | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function StarChart({
  axes,
  items,
  xKey,
  yKey,
  centroidCoords,
  discovery,
  selectedId,
  onSelect,
}: Props) {
  const { t, lang } = useLang();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const xAxis = axes.find((a) => a.key === xKey) ?? axes[0];
  const yAxis = axes.find((a) => a.key === yKey) ?? axes[1] ?? axes[0];

  const placed = useMemo(
    () =>
      items.map((it) => ({
        it,
        x: px(coordOf(it.coords, xKey)),
        y: py(coordOf(it.coords, yKey)),
      })),
    [items, xKey, yKey],
  );

  // Constellation: the adored items, linked into a polygon by angle around the centroid.
  const loved = placed.filter((p) => p.it.rating === "amour");
  const cx = centroidCoords ? px(coordOf(centroidCoords, xKey)) : null;
  const cy = centroidCoords ? py(coordOf(centroidCoords, yKey)) : null;
  const constellation =
    loved.length >= 2 && cx !== null && cy !== null
      ? [...loved]
          .sort(
            (a, b) =>
              Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
          )
          .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ")
      : null;

  const dx =
    discovery && cx !== null ? px(coordOf(discovery.coords, xKey)) : null;
  const dy =
    discovery && cy !== null ? py(coordOf(discovery.coords, yKey)) : null;

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelFor = (it: Item) =>
    hoverId === it.id || selectedId === it.id ? it.name : null;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full touch-manipulation select-none"
      role="img"
      aria-label={t("Carte de ton goût", "Map of your taste")}
      onClick={() => onSelect(null)}
    >
      <defs>
        <radialGradient id="centreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(243,236,218,0.30)" />
          <stop offset="100%" stopColor="rgba(243,236,218,0)" />
        </radialGradient>
        <radialGradient id="discGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(239,111,156,0.55)" />
          <stop offset="100%" stopColor="rgba(239,111,156,0)" />
        </radialGradient>
      </defs>

      {/* grid */}
      <g stroke="rgba(243,236,218,0.07)" strokeWidth={0.6}>
        {ticks.map((v) => (
          <line key={`v${v}`} x1={px(v)} y1={PAD} x2={px(v)} y2={SIZE - PAD} />
        ))}
        {ticks.map((v) => (
          <line key={`h${v}`} x1={PAD} y1={py(v)} x2={SIZE - PAD} y2={py(v)} />
        ))}
      </g>
      <rect
        x={PAD}
        y={PAD}
        width={INNER}
        height={INNER}
        fill="none"
        stroke="rgba(243,236,218,0.16)"
        strokeWidth={0.8}
      />

      {/* axis pole labels */}
      <g
        fontFamily="'IBM Plex Mono', monospace"
        fontSize={8.5}
        fill="rgba(243,236,218,0.5)"
      >
        <text x={PAD} y={SIZE - PAD + 14} textAnchor="start">
          ◄ {lang === "fr" ? xAxis?.low : xAxis?.lowEn}
        </text>
        <text x={SIZE - PAD} y={SIZE - PAD + 14} textAnchor="end">
          {lang === "fr" ? xAxis?.high : xAxis?.highEn} ►
        </text>
        <text
          x={PAD - 13}
          y={SIZE - PAD}
          textAnchor="start"
          transform={`rotate(-90 ${PAD - 13} ${SIZE - PAD})`}
        >
          ◄ {lang === "fr" ? yAxis?.low : yAxis?.lowEn}
        </text>
        <text
          x={PAD - 13}
          y={PAD}
          textAnchor="end"
          transform={`rotate(-90 ${PAD - 13} ${PAD})`}
        >
          {lang === "fr" ? yAxis?.high : yAxis?.highEn} ►
        </text>
      </g>
      <g
        fontFamily="'Manrope', sans-serif"
        fontSize={9}
        fontWeight={700}
        fill="rgba(134,168,224,0.85)"
        letterSpacing="0.5"
      >
        <text x={SIZE / 2} y={SIZE - 6} textAnchor="middle">
          {(lang === "fr" ? xAxis?.label : xAxis?.labelEn)?.toUpperCase()}
        </text>
        <text
          x={11}
          y={SIZE / 2}
          textAnchor="middle"
          transform={`rotate(-90 11 ${SIZE / 2})`}
        >
          {(lang === "fr" ? yAxis?.label : yAxis?.labelEn)?.toUpperCase()}
        </text>
      </g>

      {/* constellation links between adored items */}
      {constellation && (
        <polygon
          points={constellation}
          fill="rgba(240,199,97,0.05)"
          stroke="rgba(240,199,97,0.35)"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      )}

      {/* the taste centre */}
      {cx !== null && cy !== null && (
        <g>
          <circle cx={cx} cy={cy} r={26} fill="url(#centreGlow)" />
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill="none"
            stroke="rgba(243,236,218,0.85)"
            strokeWidth={1}
          />
          <line
            x1={cx - 6}
            y1={cy}
            x2={cx + 6}
            y2={cy}
            stroke="rgba(243,236,218,0.6)"
            strokeWidth={0.7}
          />
          <line
            x1={cx}
            y1={cy - 6}
            x2={cx}
            y2={cy + 6}
            stroke="rgba(243,236,218,0.6)"
            strokeWidth={0.7}
          />
        </g>
      )}

      {/* path from centre to the adjacent unknown */}
      {dx !== null && dy !== null && cx !== null && cy !== null && (
        <line
          x1={cx}
          y1={cy}
          x2={dx}
          y2={dy}
          stroke="rgba(239,111,156,0.6)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}

      {/* the items, as stars */}
      {placed.map(({ it, x, y }) => {
        const hex = RATING_HEX[it.rating];
        const r = RATING_RADIUS[it.rating];
        const active = hoverId === it.id || selectedId === it.id;
        return (
          <g
            key={it.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(it.id === selectedId ? null : it.id);
            }}
            onMouseEnter={() => setHoverId(it.id)}
            onMouseLeave={() => setHoverId((p) => (p === it.id ? null : p))}
          >
            <circle cx={x} cy={y} r={r * 2.1} fill={hex} opacity={active ? 0.28 : 0.16} />
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={hex}
              stroke={active ? "#f3ecda" : "rgba(6,8,15,0.7)"}
              strokeWidth={active ? 1.3 : 0.8}
            />
            {/* generous invisible hit target */}
            <circle cx={x} cy={y} r={Math.max(12, r * 2.4)} fill="transparent" />
          </g>
        );
      })}

      {/* the adjacent unknown star */}
      {dx !== null && dy !== null && discovery && (
        <g className="motion-safe:animate-pulseStar" style={{ transformOrigin: `${dx}px ${dy}px` }}>
          <circle cx={dx} cy={dy} r={20} fill="url(#discGlow)" />
          <circle cx={dx} cy={dy} r={6} fill="#ef6f9c" stroke="#f7a6c2" strokeWidth={1.2} />
        </g>
      )}

      {/* hovered / selected labels, drawn last so they sit on top */}
      <g fontFamily="'Manrope', sans-serif" fontSize={10} fontWeight={600}>
        {placed.map(({ it, x, y }) => {
          const label = labelFor(it);
          if (!label) return null;
          const left = x > SIZE - 90;
          return (
            <text
              key={`lbl-${it.id}`}
              x={left ? x - 9 : x + 9}
              y={y - 8}
              textAnchor={left ? "end" : "start"}
              fill="#f3ecda"
              stroke="rgba(6,8,15,0.85)"
              strokeWidth={2.4}
              paintOrder="stroke"
            >
              {label}
            </text>
          );
        })}
        {dx !== null && dy !== null && discovery && (
          <text
            x={dx + 9}
            y={dy - 9}
            textAnchor="start"
            fill="#f7a6c2"
            stroke="rgba(6,8,15,0.85)"
            strokeWidth={2.4}
            paintOrder="stroke"
          >
            {discovery.name}
          </text>
        )}
      </g>
    </svg>
  );
}
