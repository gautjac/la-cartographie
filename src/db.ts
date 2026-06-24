import Dexie, { type Table } from "dexie";
import type { Discovery, Domain, Item, Settings } from "./types.ts";

class CartoDB extends Dexie {
  domains!: Table<Domain, string>;
  items!: Table<Item, string>;
  discoveries!: Table<Discovery, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("la-cartographie");
    this.version(1).stores({
      domains: "id, createdAt, name",
      items: "id, domainId, rating, createdAt, [domainId+rating]",
      discoveries: "id, domainId, status, createdAt, [domainId+status]",
      settings: "id",
    });
  }
}

export const db = new CartoDB();

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  const fresh: Settings = { id: "app", onboarded: false, lang: "fr" };
  await db.settings.put(fresh);
  return fresh;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "app" });
}

export async function createDomain(name: string): Promise<Domain> {
  const domain: Domain = {
    id: uid(),
    name: name.trim(),
    axes: [],
    createdAt: Date.now(),
  };
  await db.domains.put(domain);
  return domain;
}

export async function updateDomain(id: string, patch: Partial<Domain>): Promise<void> {
  await db.domains.update(id, patch);
}

export async function deleteDomain(id: string): Promise<void> {
  await db.transaction("rw", db.domains, db.items, db.discoveries, async () => {
    await db.items.where("domainId").equals(id).delete();
    await db.discoveries.where("domainId").equals(id).delete();
    await db.domains.delete(id);
  });
}

export async function putItem(item: Item): Promise<void> {
  await db.items.put(item);
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<void> {
  await db.items.update(id, patch);
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

export async function putDiscovery(d: Discovery): Promise<void> {
  await db.discoveries.put(d);
}

export async function updateDiscovery(id: string, patch: Partial<Discovery>): Promise<void> {
  await db.discoveries.update(id, patch);
}
