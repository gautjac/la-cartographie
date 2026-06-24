import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Item, Rating } from "./types.ts";
import { useLang, LangToggle } from "./i18n.tsx";
import {
  createDomain,
  db,
  deleteDomain,
  deleteItem,
  getSettings,
  putDiscovery,
  putItem,
  saveSettings,
  uid,
  updateDiscovery,
  updateDomain,
  updateItem,
} from "./db.ts";
import { chartItem, discover, ApiError } from "./lib/api.ts";
import { centroid, principalAxes } from "./lib/taste.ts";
import { Onboarding } from "./components/Onboarding.tsx";
import { DomainBar } from "./components/DomainBar.tsx";
import { StarChart } from "./components/StarChart.tsx";
import { ItemForm } from "./components/ItemForm.tsx";
import { ItemCard } from "./components/ItemCard.tsx";
import { Discovery } from "./components/Discovery.tsx";
import { RATING_HEX, ratingLabel } from "./lib/ratings.ts";
import { RATINGS } from "./types.ts";

const DOMAIN_KEY = "cartographie.domain";

export function App() {
  const { t, lang } = useLang();

  const settings = useLiveQuery(() => db.settings.get("app"), []);
  useEffect(() => {
    void getSettings();
  }, []);

  const domains = useLiveQuery(() => db.domains.orderBy("createdAt").toArray(), []);
  const [currentId, setCurrentId] = useState<string | null>(
    () => localStorage.getItem(DOMAIN_KEY),
  );

  // Keep the selected domain valid as domains load / change.
  useEffect(() => {
    if (!domains) return;
    if (currentId && domains.some((d) => d.id === currentId)) return;
    const next = domains[0]?.id ?? null;
    setCurrentId(next);
    if (next) localStorage.setItem(DOMAIN_KEY, next);
  }, [domains, currentId]);

  const domain = useMemo(
    () => domains?.find((d) => d.id === currentId) ?? null,
    [domains, currentId],
  );

  const items = useLiveQuery(
    () =>
      currentId
        ? db.items.where("domainId").equals(currentId).toArray()
        : Promise.resolve([] as Item[]),
    [currentId],
  );
  const sortedItems = useMemo(
    () => (items ? [...items].sort((a, b) => a.createdAt - b.createdAt) : []),
    [items],
  );

  const pendingDiscovery = useLiveQuery(async () => {
    if (!currentId) return null;
    const rows = await db.discoveries
      .where("[domainId+status]")
      .equals([currentId, "pending"])
      .toArray();
    return rows[rows.length - 1] ?? null;
  }, [currentId]);

  const allDiscoveryNames = useLiveQuery(async () => {
    if (!currentId) return [] as string[];
    const rows = await db.discoveries.where("domainId").equals(currentId).toArray();
    return rows.map((d) => d.name);
  }, [currentId]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [discBusy, setDiscBusy] = useState(false);
  const [discError, setDiscError] = useState<string | null>(null);

  const axes = domain?.axes ?? [];
  const principal = useMemo(() => principalAxes(sortedItems, axes), [sortedItems, axes]);
  const xKey =
    (domain?.xAxis && axes.some((a) => a.key === domain.xAxis) ? domain.xAxis : undefined) ??
    principal?.[0] ??
    axes[0]?.key ??
    "";
  const yKey =
    (domain?.yAxis && axes.some((a) => a.key === domain.yAxis) ? domain.yAxis : undefined) ??
    principal?.[1] ??
    axes[1]?.key ??
    axes[0]?.key ??
    "";

  const centroidCoords = useMemo(
    () => centroid(sortedItems, axes),
    [sortedItems, axes],
  );

  const selected = sortedItems.find((it) => it.id === selectedId) ?? null;

  // ---- actions ---------------------------------------------------------------

  async function handleCreateDomain(name: string) {
    const d = await createDomain(name);
    setCurrentId(d.id);
    localStorage.setItem(DOMAIN_KEY, d.id);
    setSelectedId(null);
  }

  async function handleAddItem(name: string, rating: Rating) {
    if (!domain) return;
    setAddBusy(true);
    setAddError(null);
    try {
      const placement = await chartItem({
        domain: domain.name,
        target: name,
        lang,
        existingAxes: domain.axes.length ? domain.axes : undefined,
        known: sortedItems.map((it) => ({ name: it.name, coords: it.coords })),
      });
      // First item: persist the axes Claude defined + a default projection.
      if (!domain.axes.length) {
        await updateDomain(domain.id, {
          axes: placement.axes,
          xAxis: placement.axes[0]?.key,
          yAxis: placement.axes[1]?.key,
        });
      }
      const item: Item = {
        id: uid(),
        domainId: domain.id,
        name: name.trim(),
        blurb: placement.blurb,
        blurbEn: placement.blurbEn,
        rating,
        coords: placement.coords,
        createdAt: Date.now(),
        origin: "user",
      };
      await putItem(item);
    } catch (err) {
      setAddError(
        err instanceof ApiError
          ? err.message
          : t("La carte n'a pas pu situer cet objet.", "Couldn't place that item."),
      );
    } finally {
      setAddBusy(false);
    }
  }

  async function handleFind() {
    if (!domain || axes.length < 2) return;
    setDiscBusy(true);
    setDiscError(null);
    try {
      const res = await discover({
        domain: domain.name,
        axes,
        items: sortedItems,
        avoid: [...sortedItems.map((i) => i.name), ...(allDiscoveryNames ?? [])],
        lang,
      });
      await putDiscovery({
        id: uid(),
        domainId: domain.id,
        name: res.name,
        realityNote: res.realityNote,
        realityNoteEn: res.realityNoteEn,
        why: res.why,
        whyEn: res.whyEn,
        oneStep: res.oneStep,
        oneStepEn: res.oneStepEn,
        coords: res.coords,
        createdAt: Date.now(),
        status: "pending",
      });
    } catch (err) {
      setDiscError(
        err instanceof ApiError
          ? err.message
          : t("La découverte a échoué.", "Discovery failed."),
      );
    } finally {
      setDiscBusy(false);
    }
  }

  async function handleTried(rating: Rating) {
    if (!pendingDiscovery || !domain) return;
    const item: Item = {
      id: uid(),
      domainId: domain.id,
      name: pendingDiscovery.name,
      blurb: pendingDiscovery.realityNote,
      blurbEn: pendingDiscovery.realityNoteEn,
      rating,
      coords: pendingDiscovery.coords,
      createdAt: Date.now(),
      origin: "discovery",
    };
    await putItem(item);
    await updateDiscovery(pendingDiscovery.id, { status: "tried" });
  }

  async function handleDismiss() {
    if (!pendingDiscovery) return;
    await updateDiscovery(pendingDiscovery.id, { status: "dismissed" });
  }

  async function handleDeleteItem() {
    if (!selected) return;
    await deleteItem(selected.id);
    setSelectedId(null);
  }

  async function handleDeleteDomain() {
    if (!domain) return;
    const ok = window.confirm(
      t(
        `Supprimer le domaine « ${domain.name} » et tout ce qu'il contient ?`,
        `Delete the domain "${domain.name}" and everything in it?`,
      ),
    );
    if (!ok) return;
    await deleteDomain(domain.id);
    setSelectedId(null);
  }

  // ---- render ----------------------------------------------------------------

  if (settings === undefined) {
    return <div className="skyfield min-h-screen" />;
  }
  if (!settings?.onboarded) {
    return <Onboarding onBegin={() => void saveSettings({ onboarded: true })} />;
  }

  const counts = RATINGS.map((r) => ({
    r,
    n: sortedItems.filter((i) => i.rating === r).length,
  }));

  return (
    <div className="skyfield min-h-screen text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none text-ivory sm:text-3xl">
              La Cartographie <span className="italic text-amour">du Goût</span>
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-haze">
              {t("la carte de ce que tu aimes", "the map of what you love")}
            </p>
          </div>
          <LangToggle className="mt-1" />
        </header>

        <div className="mt-6">
          <DomainBar
            domains={domains ?? []}
            currentId={currentId}
            onSelect={(id) => {
              setCurrentId(id);
              localStorage.setItem(DOMAIN_KEY, id);
              setSelectedId(null);
            }}
            onCreate={handleCreateDomain}
          />
        </div>

        {!domain ? (
          <EmptyState onCreate={handleCreateDomain} />
        ) : (
          <main className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* chart */}
            <section className="rounded-2xl border border-night-line bg-night-deep/50 p-4 shadow-halo sm:p-5">
              {axes.length >= 2 ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-haze">
                      <AxisSelect
                        label="X"
                        value={xKey}
                        axes={axes}
                        onChange={(k) => domain && updateDomain(domain.id, { xAxis: k })}
                      />
                      <AxisSelect
                        label="Y"
                        value={yKey}
                        axes={axes}
                        onChange={(k) => domain && updateDomain(domain.id, { yAxis: k })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteDomain}
                      className="font-sans text-[11px] text-haze hover:text-non"
                    >
                      {t("Supprimer le domaine", "Delete domain")}
                    </button>
                  </div>
                  <StarChart
                    axes={axes}
                    items={sortedItems}
                    xKey={xKey}
                    yKey={yKey}
                    centroidCoords={centroidCoords}
                    discovery={pendingDiscovery ?? null}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                  {/* legend */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-night-line/60 pt-3">
                    {counts.map(({ r, n }) => (
                      <span key={r} className="flex items-center gap-1.5 font-sans text-[11px] text-ivory-dim">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: RATING_HEX[r] }}
                        />
                        {ratingLabel(r, lang)}
                        <span className="font-mono text-haze">{n}</span>
                      </span>
                    ))}
                    {pendingDiscovery && (
                      <span className="flex items-center gap-1.5 font-sans text-[11px] text-lueur">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-lueur" />
                        {t("inconnu adjacent", "adjacent unknown")}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <p className="font-display text-xl italic text-ivory-soft">
                    {t("Le ciel est encore vide.", "The sky is still empty.")}
                  </p>
                  <p className="mt-2 max-w-xs font-sans text-[13px] text-haze">
                    {t(
                      "Place un premier objet à droite — il dessinera les axes de ce domaine.",
                      "Place a first item on the right — it will draw this domain's axes.",
                    )}
                  </p>
                </div>
              )}
            </section>

            {/* side rail */}
            <aside className="space-y-4">
              <ItemForm busy={addBusy} hasAxes={axes.length >= 2} onAdd={handleAddItem} />
              {addError && (
                <p className="rounded-lg border border-non/40 bg-non/10 px-3 py-2 font-sans text-[12px] text-non">
                  {addError}
                </p>
              )}
              {selected && (
                <ItemCard
                  item={selected}
                  axes={axes}
                  onChangeRating={(r) => updateItem(selected.id, { rating: r })}
                  onDelete={handleDeleteItem}
                  onClose={() => setSelectedId(null)}
                />
              )}
              <Discovery
                ready={axes.length >= 2}
                itemCount={sortedItems.length}
                discovery={pendingDiscovery ?? null}
                busy={discBusy}
                error={discError}
                onFind={handleFind}
                onTried={handleTried}
                onDismiss={handleDismiss}
              />
            </aside>
          </main>
        )}

        <footer className="mt-10 border-t border-night-line/50 pt-4 text-center font-sans text-[11px] text-haze">
          {t(
            "Tout reste sur ton appareil. Les découvertes sont des œuvres réelles — jamais inventées.",
            "Everything stays on your device. Discoveries are real works — never invented.",
          )}
        </footer>
      </div>
    </div>
  );
}

function AxisSelect({
  label,
  value,
  axes,
  onChange,
}: {
  label: string;
  value: string;
  axes: { key: string; label: string; labelEn: string }[];
  onChange: (k: string) => void;
}) {
  const { lang } = useLang();
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-compass">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-night-line bg-night-raised px-2 py-1 font-sans text-[12px] text-ivory outline-none focus:border-compass"
      >
        {axes.map((a) => (
          <option key={a.key} value={a.key}>
            {lang === "fr" ? a.label : a.labelEn}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ onCreate }: { onCreate: (name: string) => void }) {
  const { t, lang } = useLang();
  const suggestions =
    lang === "fr"
      ? ["Films", "Vins nature", "Riffs de guitare", "Cafés"]
      : ["Films", "Natural wine", "Guitar riffs", "Coffee"];
  return (
    <div className="animate-riseIn mt-16 flex flex-col items-center text-center">
      <p className="font-display text-2xl italic text-ivory-soft">
        {t("Par où commence ton goût ?", "Where does your taste begin?")}
      </p>
      <p className="mt-2 max-w-md font-sans text-sm text-haze">
        {t(
          "Crée un domaine — un champ que tu connais assez pour en sentir les nuances.",
          "Create a domain — a field you know well enough to feel its nuances.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onCreate(s)}
            className="rounded-full border border-night-line bg-night-raised/50 px-4 py-2 font-sans text-[13px] font-semibold text-ivory-dim transition-colors hover:border-amour/60 hover:text-amour"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
