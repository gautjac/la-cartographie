import { useLang, LangToggle } from "../i18n.tsx";

const STEPS: { fr: [string, string]; en: [string, string] }[] = [
  {
    fr: ["Choisis un domaine", "Films, vins nature, riffs, polices, cafés — tout ce qui a un goût."],
    en: ["Pick a domain", "Films, natural wine, riffs, typefaces, coffee — anything with a taste."],
  },
  {
    fr: ["Place ce que tu connais", "Note quelques objets. La carte dessine elle-même ses axes."],
    en: ["Place what you know", "Rate a few things. The map draws its own axes."],
  },
  {
    fr: ["Trouve l'inconnu adjacent", "Pas plus de la même chose — la chose juste au-delà."],
    en: ["Find the adjacent unknown", "Not more of the same — the thing just beyond."],
  },
];

export function Onboarding({ onBegin }: { onBegin: () => void }) {
  const { t, lang } = useLang();
  return (
    <div className="skyfield relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="absolute right-5 top-5">
        <LangToggle />
      </div>

      <div className="animate-riseIn w-full max-w-lg text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-compass">
          {t("Atlas du goût", "An atlas of taste")}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-ivory sm:text-6xl">
          La Cartographie
          <span className="block italic text-amour">du Goût</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md font-sans text-[15px] leading-relaxed text-ivory-soft">
          {t(
            "Cartographie ton goût comme un ciel étoilé. Puis laisse-le te montrer la chose juste au bord de ce que tu aimes déjà.",
            "Chart your taste like a night sky. Then let it show you the thing right at the edge of what you already love.",
          )}
        </p>

        <ol className="mx-auto mt-10 max-w-sm space-y-4 text-left">
          {STEPS.map((s, i) => {
            const [title, body] = lang === "fr" ? s.fr : s.en;
            return (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-night-line font-mono text-xs text-compass">
                  {i + 1}
                </span>
                <div>
                  <p className="font-sans text-sm font-semibold text-ivory">{title}</p>
                  <p className="font-sans text-[13px] leading-snug text-haze">{body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={onBegin}
          className="mt-11 rounded-full bg-amour px-8 py-3 font-sans text-sm font-bold text-night-deep shadow-halo transition-transform hover:scale-[1.03] active:scale-95"
        >
          {t("Ouvrir l'atlas", "Open the atlas")}
        </button>
      </div>
    </div>
  );
}
