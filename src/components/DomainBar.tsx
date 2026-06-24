import { useState } from "react";
import type { Domain } from "../types.ts";
import { useLang } from "../i18n.tsx";

interface Props {
  domains: Domain[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
}

const SUGGESTIONS_FR = ["Films", "Vins nature", "Riffs de guitare", "Cafés", "Polices", "Romans"];
const SUGGESTIONS_EN = ["Films", "Natural wine", "Guitar riffs", "Coffee", "Typefaces", "Novels"];

export function DomainBar({ domains, currentId, onSelect, onCreate }: Props) {
  const { t, lang } = useLang();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const v = name.trim();
    if (!v) return;
    onCreate(v);
    setName("");
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {domains.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onSelect(d.id)}
          className={`rounded-full border px-4 py-1.5 font-sans text-[13px] font-semibold transition-colors ${
            d.id === currentId
              ? "border-amour/60 bg-amour/15 text-amour"
              : "border-night-line bg-night-raised/50 text-ivory-dim hover:text-ivory"
          }`}
        >
          {d.name}
        </button>
      ))}

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            list="domain-suggestions"
            placeholder={t("Nouveau domaine…", "New domain…")}
            className="w-44 rounded-full border border-compass/50 bg-night-deep px-4 py-1.5 font-sans text-[13px] text-ivory outline-none placeholder:text-haze focus:border-compass"
          />
          <datalist id="domain-suggestions">
            {(lang === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={submit}
            className="rounded-full bg-compass px-3 py-1.5 font-sans text-[13px] font-bold text-night-deep"
          >
            {t("Créer", "Create")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-night-line px-4 py-1.5 font-sans text-[13px] font-semibold text-haze transition-colors hover:border-compass hover:text-compass"
        >
          + {t("Domaine", "Domain")}
        </button>
      )}
    </div>
  );
}
