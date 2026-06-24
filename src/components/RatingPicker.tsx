import { RATINGS, type Rating } from "../types.ts";
import { useLang } from "../i18n.tsx";
import { RATING_HEX, ratingGlyph, ratingLabel } from "../lib/ratings.ts";

interface Props {
  value: Rating;
  onChange: (r: Rating) => void;
  size?: "sm" | "md";
}

export function RatingPicker({ value, onChange, size = "md" }: Props) {
  const { lang } = useLang();
  return (
    <div className="flex flex-wrap gap-1.5">
      {RATINGS.map((r) => {
        const active = r === value;
        const hex = RATING_HEX[r];
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`flex items-center gap-1.5 rounded-full border font-sans font-semibold transition-all ${
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]"
            } ${active ? "text-night-deep" : "border-night-line bg-night-raised/40 text-ivory-dim hover:text-ivory"}`}
            style={active ? { backgroundColor: hex, borderColor: hex } : undefined}
          >
            <span aria-hidden style={!active ? { color: hex } : undefined}>
              {ratingGlyph(r)}
            </span>
            {ratingLabel(r, lang)}
          </button>
        );
      })}
    </div>
  );
}
