import { getRegion } from "./data";
import type { Setup, SetupItem } from "./types";

export type Action =
  | { type: "load"; setup: Setup }
  | { type: "setRegion"; region: string }
  | { type: "setPrice"; price: number }
  | { type: "addItem"; item: SetupItem }
  | { type: "updateItem"; index: number; patch: Partial<SetupItem> }
  | { type: "duplicateItem"; index: number }
  | { type: "removeItem"; index: number }
  | { type: "setAll"; patch: Pick<Partial<SetupItem>, "loadPct" | "hoursPerDay"> }
  | { type: "toggleReplace"; index: number }
  | { type: "addReplacement"; item: SetupItem }
  | { type: "updateReplacement"; index: number; patch: Partial<SetupItem> }
  | { type: "removeReplacement"; index: number }
  | { type: "setUpgradeCost"; cost: number }
  | { type: "clearUpgrade" }
  | { type: "setUps"; wh: number | undefined }
  | { type: "reset" };

const emptyUpgrade = { replace: [], with: [], cost: 0 };

export function reducer(s: Setup, a: Action): Setup {
  const up = s.upgrade ?? emptyUpgrade;
  switch (a.type) {
    case "load":
      return a.setup;
    case "setRegion":
      return { ...s, region: a.region, pricePerKwh: getRegion(a.region).pricePerKwh };
    case "setPrice":
      return { ...s, pricePerKwh: a.price };
    case "addItem":
      return { ...s, items: [...s.items, a.item] };
    case "updateItem":
      return { ...s, items: s.items.map((it, i) => (i === a.index ? { ...it, ...a.patch } : it)) };
    case "duplicateItem":
      return { ...s, items: [...s.items.slice(0, a.index + 1), { ...s.items[a.index] }, ...s.items.slice(a.index + 1)] };
    case "removeItem": {
      // Keep the upgrade's "replace" indexes pointing at the same rows.
      const replace = up.replace.filter((i) => i !== a.index).map((i) => (i > a.index ? i - 1 : i));
      return {
        ...s,
        items: s.items.filter((_, i) => i !== a.index),
        upgrade: s.upgrade ? { ...s.upgrade, replace } : undefined,
      };
    }
    case "setAll":
      return { ...s, items: s.items.map((it) => ({ ...it, ...a.patch })) };
    case "toggleReplace": {
      const replace = up.replace.includes(a.index)
        ? up.replace.filter((i) => i !== a.index)
        : [...up.replace, a.index].sort((x, y) => x - y);
      return { ...s, upgrade: { ...up, replace } };
    }
    case "addReplacement":
      return { ...s, upgrade: { ...up, with: [...up.with, a.item] } };
    case "updateReplacement":
      return { ...s, upgrade: { ...up, with: up.with.map((it, i) => (i === a.index ? { ...it, ...a.patch } : it)) } };
    case "removeReplacement":
      return { ...s, upgrade: { ...up, with: up.with.filter((_, i) => i !== a.index) } };
    case "setUpgradeCost":
      return { ...s, upgrade: { ...up, cost: a.cost } };
    case "clearUpgrade":
      return { ...s, upgrade: undefined };
    case "setUps":
      return { ...s, upsWh: a.wh };
    case "reset":
      return { v: 1, region: s.region, pricePerKwh: getRegion(s.region).pricePerKwh, items: [] };
  }
}
