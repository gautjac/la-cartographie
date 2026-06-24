import { useState } from "react";
import type { Rating } from "../types.ts";
import { useLang } from "../i18n.tsx";
import { RatingPicker } from "./RatingPicker.tsx";

interface Props {
  busy: boolean;
  hasAxes: boolean;
  onAdd: (name: string, rating: Rating) => void;
}

export function ItemForm({ busy, hasAxes, onAdd }: Props) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [rating, setRating] = useState<Rating>("aime");

  function submit() {
    const v = name.trim();
    if (!v || busy) return;
    onAdd(v, rating);
    setName("");
    setRating("aime");
  }

  return (
    <div className="rounded-2xl border border-night-line bg-night-raised/40 p-4">
      <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-haze">
        {hasAxes ? t("Placer un objet", "Place something") : t("Premier objet", "First item")}
      </h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        disabled={busy}
        placeholder={t("Le nom d'une chose que tu connais…", "Something you know…")}
        className="mt-3 w-full rounded-xl border border-night-line bg-night-deep px-3.5 py-2.5 font-sans text-sm text-ivory outline-none placeholder:text-haze focus:border-compass disabled:opacity-50"
      />
      <div className="mt-3">
        <RatingPicker value={rating} onChange={setRating} />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={busy || !name.trim()}
        className="mt-4 w-full rounded-xl bg-amour px-4 py-2.5 font-sans text-sm font-bold text-night-deep transition-transform enabled:hover:scale-[1.01] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? t("La carte te situe…", "Charting…")
          : hasAxes
            ? t("Ajouter à la carte", "Add to the map")
            : t("Tracer les axes", "Draw the axes")}
      </button>
      {!hasAxes && (
        <p className="mt-2 font-sans text-[11px] leading-snug text-haze">
          {t(
            "Le premier objet définit les axes perceptuels du domaine.",
            "The first item defines the domain's perceptual axes.",
          )}
        </p>
      )}
    </div>
  );
}
