import { useState } from "react";
import type { Discovery as Disc, Rating } from "../types.ts";
import { useLang } from "../i18n.tsx";
import { RatingPicker } from "./RatingPicker.tsx";

interface Props {
  ready: boolean;
  itemCount: number;
  discovery: Disc | null;
  busy: boolean;
  error: string | null;
  onFind: () => void;
  onTried: (r: Rating) => void;
  onDismiss: () => void;
}

const MIN_ITEMS = 3;

export function Discovery({
  ready,
  itemCount,
  discovery,
  busy,
  error,
  onFind,
  onTried,
  onDismiss,
}: Props) {
  const { t, lang } = useLang();
  const [rating, setRating] = useState<Rating>("aime");
  const enough = itemCount >= MIN_ITEMS;

  if (discovery) {
    return (
      <div className="animate-riseIn rounded-2xl border border-lueur/40 bg-lueur/[0.07] p-4 shadow-halo">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lueur">
          {t("L'inconnu adjacent", "The adjacent unknown")}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-ivory">
          {discovery.name}
        </h3>
        <p className="mt-1 font-sans text-[12px] leading-snug text-lueur-soft">
          {lang === "fr" ? discovery.realityNote : discovery.realityNoteEn}
        </p>
        <p className="mt-3 font-sans text-[13px] leading-relaxed text-ivory-soft">
          {lang === "fr" ? discovery.why : discovery.whyEn}
        </p>
        <p className="mt-3 rounded-lg border border-lueur/20 bg-night-deep/40 px-3 py-2 font-sans text-[12px] text-ivory-dim">
          <span className="font-semibold text-lueur">{t("Le pas de côté : ", "One step out: ")}</span>
          {lang === "fr" ? discovery.oneStep : discovery.oneStepEn}
        </p>

        <div className="mt-4 border-t border-night-line/70 pt-3">
          <p className="font-sans text-[12px] text-haze">
            {t("Tu l'as essayé ? Note-le pour l'ajouter à ta carte.", "Tried it? Rate it to add it to your map.")}
          </p>
          <div className="mt-2">
            <RatingPicker value={rating} onChange={setRating} size="sm" />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onTried(rating)}
              className="flex-1 rounded-xl bg-lueur px-3 py-2 font-sans text-[13px] font-bold text-night-deep transition-transform hover:scale-[1.01] active:scale-95"
            >
              {t("Je l'ai essayé", "I tried it")}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl border border-night-line px-3 py-2 font-sans text-[13px] font-semibold text-haze hover:text-ivory"
            >
              {t("Écarter", "Dismiss")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-night-line bg-night-raised/40 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lueur">
        {t("Découverte", "Discovery")}
      </p>
      <p className="mt-2 font-sans text-[13px] leading-relaxed text-ivory-soft">
        {t(
          "Quand ta carte est assez fournie, je peux te montrer la chose juste au-delà de ton amas.",
          "Once your map is rich enough, I can show you the thing just beyond your cluster.",
        )}
      </p>
      <button
        type="button"
        onClick={onFind}
        disabled={!ready || !enough || busy}
        className="mt-4 w-full rounded-xl border border-lueur/60 bg-lueur/10 px-4 py-2.5 font-sans text-sm font-bold text-lueur transition-transform enabled:hover:scale-[1.01] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? t("Je scrute le bord…", "Scanning the edge…") : t("Trouve l'inconnu adjacent", "Find the adjacent unknown")}
      </button>
      {!enough && (
        <p className="mt-2 font-sans text-[11px] text-haze">
          {t(
            `Place encore ${Math.max(0, MIN_ITEMS - itemCount)} objet(s) pour ouvrir la découverte.`,
            `Place ${Math.max(0, MIN_ITEMS - itemCount)} more item(s) to unlock discovery.`,
          )}
        </p>
      )}
      {error && <p className="mt-2 font-sans text-[12px] text-non">{error}</p>}
    </div>
  );
}
