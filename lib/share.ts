import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import * as z from "zod/mini";
import { getDevice, getRegion, regions } from "./data";
import { DEFAULT_HOURS, DEFAULT_LOAD_PCT, type Setup, type SetupItem } from "./types";

// Compact wire format: short keys, and anything equal to a default or to the preset is left out.
// zod/mini keeps the validator small in the calculator bundle.
const num = (max: number) => z.number().check(z.minimum(0), z.maximum(max));
const str = (max: number) => z.string().check(z.maxLength(max));
const list = <T extends z.ZodMiniType>(t: T, max = 200) => z.array(t).check(z.maxLength(max));

const CompactItem = z.object({
  d: z.optional(str(64)), // preset slug
  n: z.optional(str(80)), // name (custom, or renamed preset)
  i: z.optional(num(100_000)), // idle W
  l: z.optional(num(100_000)), // load W
  q: z.optional(z.int().check(z.minimum(1), z.maximum(999))),
  h: z.optional(num(24)),
  p: z.optional(num(100)),
});
type CompactItem = z.infer<typeof CompactItem>;

const CompactSetup = z.object({
  v: z.literal(1),
  r: z.string().check(z.length(2)),
  p: z.optional(num(100)), // price per kWh, omitted when it is the region default
  i: list(CompactItem),
  u: z.optional(z.object({ r: list(z.int().check(z.minimum(0))), w: list(CompactItem), c: num(10_000_000) })),
  b: z.optional(num(1_000_000)), // UPS battery Wh
});
type CompactSetup = z.infer<typeof CompactSetup>;

function packItem(it: SetupItem): CompactItem {
  const preset = it.deviceSlug ? getDevice(it.deviceSlug) : undefined;
  const c: CompactItem = {};
  if (it.deviceSlug) c.d = it.deviceSlug;
  if (!preset || it.name !== preset.name) c.n = it.name;
  if (!preset || it.idleW !== preset.idleW) c.i = it.idleW;
  if (!preset || it.loadW !== preset.loadW) c.l = it.loadW;
  if (it.qty !== 1) c.q = it.qty;
  if (it.hoursPerDay !== DEFAULT_HOURS) c.h = it.hoursPerDay;
  if (it.loadPct !== DEFAULT_LOAD_PCT) c.p = it.loadPct;
  return c;
}

function unpackItem(c: CompactItem): SetupItem {
  const preset = c.d ? getDevice(c.d) : undefined;
  return {
    deviceSlug: preset ? c.d : undefined,
    name: c.n ?? preset?.name ?? c.d ?? "Custom device",
    idleW: c.i ?? preset?.idleW ?? 0,
    loadW: c.l ?? preset?.loadW ?? c.i ?? 0,
    qty: c.q ?? 1,
    hoursPerDay: c.h ?? DEFAULT_HOURS,
    loadPct: c.p ?? DEFAULT_LOAD_PCT,
  };
}

export function encodeSetup(s: Setup): string {
  const region = getRegion(s.region);
  const c: CompactSetup = { v: 1, r: s.region, i: s.items.map(packItem) };
  if (s.pricePerKwh !== region.pricePerKwh) c.p = s.pricePerKwh;
  if (s.upgrade && (s.upgrade.replace.length || s.upgrade.with.length || s.upgrade.cost)) {
    c.u = { r: s.upgrade.replace, w: s.upgrade.with.map(packItem), c: s.upgrade.cost };
  }
  if (s.upsWh) c.b = s.upsWh;
  return compressToEncodedURIComponent(JSON.stringify(c));
}

export function emptySetup(regionCode = "US"): Setup {
  const region = getRegion(regionCode);
  return { v: 1, region: region.code, pricePerKwh: region.pricePerKwh, items: [] };
}

export type DecodeResult = { ok: true; setup: Setup } | { ok: false; setup: Setup; error: string };

/** Decode a `?s=` value. Anything invalid falls back to an empty setup with an error message. */
export function decodeSetup(encoded: string, fallbackRegion = "US"): DecodeResult {
  const fail = (error: string): DecodeResult => ({ ok: false, setup: emptySetup(fallbackRegion), error });
  let json: unknown;
  try {
    const raw = decompressFromEncodedURIComponent(encoded);
    if (!raw) return fail("The shared link is incomplete or damaged.");
    json = JSON.parse(raw);
  } catch {
    return fail("The shared link is incomplete or damaged.");
  }
  if (typeof json === "object" && json !== null && "v" in json && json.v !== 1) {
    return fail("This link was made with a newer version of WattsMyLab.");
  }
  const parsed = CompactSetup.safeParse(json);
  if (!parsed.success) return fail("The shared link contains values we couldn't read.");
  const c = parsed.data;
  const known = regions.some((r) => r.code === c.r);
  const region = getRegion(known ? c.r : fallbackRegion);
  const items = c.i.map(unpackItem);
  return {
    ok: true,
    setup: {
      v: 1,
      region: region.code,
      pricePerKwh: c.p ?? region.pricePerKwh,
      items,
      upgrade: c.u
        ? { replace: c.u.r.filter((i) => i < items.length), with: c.u.w.map(unpackItem), cost: c.u.c }
        : undefined,
      upsWh: c.b,
    },
  };
}
