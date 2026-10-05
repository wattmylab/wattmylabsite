import { DEFAULT_HOURS, DEFAULT_LOAD_PCT, type Device, type Region, type SetupItem } from "./types";
import server from "@/data/devices/server.json";
import miniPc from "@/data/devices/mini-pc.json";
import nas from "@/data/devices/nas.json";
import sbc from "@/data/devices/sbc.json";
import network from "@/data/devices/network.json";
import storage from "@/data/devices/storage.json";
import regionsFile from "@/data/regions.json";

// Validated against lib/schema.ts by lib/data.test.ts, which runs before every build.
export const rawDevices: unknown[] = [...server, ...miniPc, ...nas, ...sbc, ...network, ...storage];
export const devices = rawDevices as Device[];
export const regions = regionsFile.regions as Region[];
export const pricesReviewed: string = regionsFile.reviewed;

const bySlug = new Map(devices.map((d) => [d.slug, d]));
export const getDevice = (slug: string) => bySlug.get(slug);
export const getRegion = (code: string) => regions.find((r) => r.code === code) ?? regions[0];

export const categoryLabels: Record<Device["category"], string> = {
  server: "Enterprise servers",
  "mini-pc": "Mini PCs and SFF",
  nas: "NAS",
  sbc: "Single-board computers",
  network: "Network",
  storage: "Drives",
};

export const sourceLabels: Record<Device["sourceType"], string> = {
  measured: "Measured",
  community: "Community",
  "spec-sheet": "Spec sheet",
  estimate: "Estimate",
};

export function itemFromDevice(d: Device): SetupItem {
  return {
    deviceSlug: d.slug,
    name: d.name,
    idleW: d.idleW,
    loadW: d.loadW,
    qty: 1,
    hoursPerDay: DEFAULT_HOURS,
    loadPct: DEFAULT_LOAD_PCT,
  };
}

/** Guess a region from browser locales, never from IP. */
export function guessRegion(languages: readonly string[]): string {
  for (const lang of languages) {
    const country = lang.split("-")[1]?.toUpperCase();
    if (country === "UK") return "GB";
    if (country && regions.some((r) => r.code === country)) return country;
  }
  return "US";
}
