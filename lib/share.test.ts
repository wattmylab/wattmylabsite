import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import { devices, getRegion, itemFromDevice } from "./data";
import { decodeSetup, emptySetup, encodeSetup } from "./share";
import type { Setup } from "./types";

const preset = (slug: string) => itemFromDevice(devices.find((d) => d.slug === slug)!);

describe("share link round-trip", () => {
  it("restores a mixed setup exactly", () => {
    const s: Setup = {
      v: 1,
      region: "GB",
      pricePerKwh: 0.31,
      items: [
        { ...preset("dell-r720"), qty: 2, loadPct: 30 },
        preset("n100-mini-pc"),
        { name: "My weird box", idleW: 42.5, loadW: 90, qty: 1, hoursPerDay: 8, loadPct: 50 },
        { ...preset("hdd-3-5"), qty: 6, idleW: 4 },
      ],
      upgrade: { replace: [0], with: [{ ...preset("n100-mini-pc"), qty: 2 }], cost: 320 },
      upsWh: 216,
    };
    const r = decodeSetup(encodeSetup(s));
    expect(r.ok).toBe(true);
    expect(r.setup).toEqual(s);
  });

  it("uses the region default price when none is stored", () => {
    const s = { ...emptySetup("DE"), items: [preset("raspberry-pi-5")] };
    const r = decodeSetup(encodeSetup(s));
    expect(r.setup.pricePerKwh).toBe(getRegion("DE").pricePerKwh);
    expect(r.setup.upgrade).toBeUndefined();
  });

  it("keeps a 10-device setup under about 300 characters", () => {
    const slugs = [
      "dell-r720", "hp-dl380-gen9", "n100-mini-pc", "lenovo-m720q", "synology-4-bay",
      "raspberry-pi-5", "switch-24-port-poe", "access-point", "router-consumer", "hdd-3-5",
    ];
    const s: Setup = { ...emptySetup("GB"), items: slugs.map((d, i) => ({ ...preset(d), qty: (i % 3) + 1 })) };
    const encoded = encodeSetup(s);
    expect(encoded.length).toBeLessThanOrEqual(300);
  });
});

describe("decoding bad input", () => {
  it("falls back to an empty setup on garbage", () => {
    const r = decodeSetup("not-a-real-value!!", "GB");
    expect(r.ok).toBe(false);
    expect(r.setup.items).toEqual([]);
    expect(r.setup.region).toBe("GB");
  });
  it("rejects unknown versions with a clear message", () => {
    const r = decodeSetup(compressToEncodedURIComponent(JSON.stringify({ v: 2, r: "GB", i: [] })));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/newer version/);
  });
  it("rejects out-of-range values", () => {
    const r = decodeSetup(compressToEncodedURIComponent(JSON.stringify({ v: 1, r: "GB", i: [{ n: "x", i: -5 }] })));
    expect(r.ok).toBe(false);
  });
  it("falls back to the default region for an unknown country code", () => {
    const r = decodeSetup(compressToEncodedURIComponent(JSON.stringify({ v: 1, r: "ZZ", i: [] })), "US");
    expect(r.ok && r.setup.region).toBe("US");
  });
  it("drops upgrade indexes that point past the device list", () => {
    const r = decodeSetup(compressToEncodedURIComponent(JSON.stringify({ v: 1, r: "US", i: [{ n: "a", i: 1 }], u: { r: [0, 5], w: [], c: 0 } })));
    expect(r.ok && r.setup.upgrade?.replace).toEqual([0]);
  });
});
