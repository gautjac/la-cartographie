import type { Axis, Item, Rating } from "../types.ts";
import { useLang } from "../i18n.tsx";
import { coordOf } from "../lib/taste.ts";
import { RATING_HEX } from "../lib/ratings.ts";
import { RatingPicker } from "./RatingPicker.tsx";

interface Props {
  item: Item;
  axes: Axis[];
  onChangeRating: (r: Rating) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ItemCard({ item, axes, onChangeRating, onDelete, onClose }: Props) {
  const { t, lang } = useLang();
  const hex = RATING_HEX[item.rating];
  const blurb = lang === "fr" ? item.blurb : item.blurbEn || item.blurb;

  return (
    <div className="animate-riseIn rounded-2xl border border-night-line bg-night-raised/60 p-4 shadow-halo">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: hex }}
          />
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-ivory">
              {item.name}
            </h3>
            {item.origin === "discovery" && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-lueur">
                {t("venu d'une découverte", "from a discovery")}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-full px-2 py-1 font-sans text-lg leading-none text-haze hover:text-ivory"
          aria-label={t("Fermer", "Close")}
        >
          ×
        </button>
      </div>

      {blurb && (
        <p className="mt-3 font-sans text-[13px] italic leading-relaxed text-ivory-soft">
          {blurb}
        </p>
      )}

      <div className="mt-4">
        <RatingPicker value={item.rating} onChange={onChangeRating} size="sm" />
      </div>

      <dl className="mt-4 space-y-1.5">
        {axes.map((a) => {
          const v = coordOf(item.coords, a.key);
          return (
            <div key={a.key} className="flex items-center gap-3">
              <dt className="w-24 shrink-0 truncate font-sans text-[11px] text-haze">
                {lang === "fr" ? a.label : a.labelEn}
              </dt>
              <dd className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-night-line">
                  <div
                    className="h-full rounded-full bg-compass/70"
                    style={{ width: `${Math.round(v * 100)}%` }}
                  />
                </div>
              </dd>
              <span className="w-8 text-right font-mono text-[11px] text-ivory-dim">
                {v.toFixed(2)}
              </span>
            </div>
          );
        })}
      </dl>

      <button
        type="button"
        onClick={onDelete}
        className="mt-4 font-sans text-[12px] text-haze underline-offset-2 hover:text-non hover:underline"
      >
        {t("Retirer de la carte", "Remove from the map")}
      </button>
    </div>
  );
}
