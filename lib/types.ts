// Types and constants shared by the app. Kept free of Zod so the calculator bundle stays small;
// the Zod schemas that validate device and region data live in schema.ts.

export const categories = ["server", "mini-pc", "nas", "sbc", "network", "storage"] as const;
export type Category = (typeof categories)[number];

export const sourceTypes = ["measured", "community", "spec-sheet", "estimate"] as const;
export type SourceType = (typeof sourceTypes)[number];

export type Device = {
  slug: string; // "dell-r720"
  name: string; // "Dell PowerEdge R720"
  category: Category;
  idleW: number;
  loadW: number;
  rackU?: number; // Phase 2: 1, 2, 4; undefined = shelf item
  sourceType: SourceType;
  sourceUrl?: string; // datasheet, issue or thread
  config: string; // assumed CPU, RAM, drives, PSUs
  readings?: { idleW: number; loadW: number; by?: string }[];
  lastReviewed: string; // ISO date
  notes?: string;
};

export type Region = {
  code: string;
  name: string;
  currency: string;
  locale: string;
  pricePerKwh: number;
  source: string;
  sourceUrl: string;
  asOf: string;
};

export type SetupItem = {
  deviceSlug?: string; // preset, or undefined for custom
  name: string;
  idleW: number;
  loadW: number;
  qty: number;
  hoursPerDay: number; // default 24
  loadPct: number; // default 15
};

export type Upgrade = { replace: number[]; with: SetupItem[]; cost: number };

export type Setup = {
  v: 1;
  region: string;
  pricePerKwh: number;
  items: SetupItem[];
  upgrade?: Upgrade;
  upsWh?: number;
};

export const DEFAULT_HOURS = 24;
export const DEFAULT_LOAD_PCT = 15;
