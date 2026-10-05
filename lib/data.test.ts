import { describe, expect, it } from "vitest";
import { z } from "zod";
import regionsFile from "@/data/regions.json";
import { devices, guessRegion, rawDevices, regions } from "./data";
import { DeviceSchema, RegionSchema } from "./schema";

describe("device data", () => {
  it("every preset matches the schema", () => {
    const r = z.array(DeviceSchema).safeParse(rawDevices);
    expect(r.success ? "ok" : z.prettifyError(r.error)).toBe("ok");
    expect(devices.length).toBeGreaterThanOrEqual(40);
  });
  it("has unique slugs", () => {
    expect(new Set(devices.map((d) => d.slug)).size).toBe(devices.length);
  });
});

describe("regions", () => {
  it("every region matches the schema", () => {
    const r = z.array(RegionSchema).safeParse(regionsFile.regions);
    expect(r.success ? "ok" : z.prettifyError(r.error)).toBe("ok");
  });
  it("covers the launch countries", () => {
    expect(regions.map((r) => r.code)).toEqual(["GB", "US", "DE", "FR", "NL", "IE", "ES", "IT"]);
  });
  it("guesses from browser locales", () => {
    expect(guessRegion(["en-GB", "en"])).toBe("GB");
    expect(guessRegion(["de-DE"])).toBe("DE");
    expect(guessRegion(["fr", "fr-FR"])).toBe("FR");
    expect(guessRegion(["en-AU"])).toBe("US");
    expect(guessRegion([])).toBe("US");
  });
});
