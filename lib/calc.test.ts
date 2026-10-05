import { describe, expect, it } from "vitest";
import {
  avgWatts,
  compareUpgrade,
  costPerYear,
  cumulativeCost,
  heatBtuPerHour,
  itemKwhPerYear,
  paybackMonths,
  totals,
  upsRuntimeMinutes,
  vaToBatteryWh,
} from "./calc";
import type { SetupItem } from "./types";

const item = (o: Partial<SetupItem> = {}): SetupItem => ({
  name: "Test",
  idleW: 100,
  loadW: 300,
  qty: 1,
  hoursPerDay: 24,
  loadPct: 15,
  ...o,
});

describe("avgWatts", () => {
  it("weights idle and load by the load share", () => {
    expect(avgWatts(100, 300, 0.15)).toBeCloseTo(130);
  });
  it("is idle at 0% and load at 100%", () => {
    expect(avgWatts(100, 300, 0)).toBe(100);
    expect(avgWatts(100, 300, 1)).toBe(300);
  });
  it("clamps load share outside 0..1", () => {
    expect(avgWatts(100, 300, 2)).toBe(300);
    expect(avgWatts(100, 300, -1)).toBe(100);
  });
});

describe("itemKwhPerYear", () => {
  it("uses P_avg × qty × hours × 365 / 1000", () => {
    // 130 W × 2 × 24 h × 365 / 1000 = 2277.6
    expect(itemKwhPerYear(item({ qty: 2 }))).toBeCloseTo(2277.6);
  });
  it("is zero when hours per day is zero", () => {
    expect(itemKwhPerYear(item({ hoursPerDay: 0 }))).toBe(0);
  });
  it("uses load watts at 100% load", () => {
    expect(itemKwhPerYear(item({ loadPct: 100, hoursPerDay: 10 }))).toBeCloseTo((300 * 10 * 365) / 1000);
  });
});

describe("costPerYear", () => {
  it("multiplies kWh by price", () => {
    expect(costPerYear(1000, 0.2632)).toBeCloseTo(263.2);
  });
});

describe("totals", () => {
  it("sums rows and derives day and month", () => {
    const t = totals([item(), item({ idleW: 10, loadW: 10, hoursPerDay: 12 })], 0.25);
    const kwh = (130 * 24 * 365) / 1000 + (10 * 12 * 365) / 1000;
    expect(t.kwhYear).toBeCloseTo(kwh);
    expect(t.costYear).toBeCloseTo(kwh * 0.25);
    expect(t.costMonth).toBeCloseTo((kwh * 0.25) / 12);
    expect(t.costDay).toBeCloseTo((kwh * 0.25) / 365);
    expect(t.onW).toBeCloseTo(140);
    expect(t.avgW).toBeCloseTo(135);
    expect(t.peakW).toBe(310);
    expect(t.perItem).toHaveLength(2);
  });
  it("handles an empty setup", () => {
    const t = totals([], 0.3);
    expect(t.costYear).toBe(0);
    expect(t.avgW).toBe(0);
  });
});

describe("paybackMonths", () => {
  it("divides cost by monthly saving", () => {
    expect(paybackMonths(300, 400, 160)).toBeCloseTo(15);
  });
  it("is null (never) when the saving is zero or negative", () => {
    expect(paybackMonths(300, 200, 200)).toBeNull();
    expect(paybackMonths(300, 200, 250)).toBeNull();
  });
  it("is zero for a free upgrade that saves money", () => {
    expect(paybackMonths(0, 200, 100)).toBe(0);
  });
});

describe("compareUpgrade", () => {
  it("replaces chosen rows and keeps the rest", () => {
    const items = [item(), item({ idleW: 5, loadW: 5 })];
    const r = compareUpgrade(items, [0], [item({ idleW: 7, loadW: 25 })], 200, 0.3);
    const old = totals(items, 0.3).costYear;
    const next = totals([items[1], item({ idleW: 7, loadW: 25 })], 0.3).costYear;
    expect(r.oldCostYear).toBeCloseTo(old);
    expect(r.newCostYear).toBeCloseTo(next);
    expect(r.savingYear).toBeCloseTo(old - next);
    expect(r.paybackMonths).toBeCloseTo(200 / ((old - next) / 12));
  });
});

describe("UPS and heat", () => {
  it("estimates runtime with 80% efficiency", () => {
    // 216 Wh × 0.8 / 100 W × 60 = 103.68 min
    expect(upsRuntimeMinutes(216, 100)).toBeCloseTo(103.68);
  });
  it("returns null with no load", () => {
    expect(upsRuntimeMinutes(216, 0)).toBeNull();
  });
  it("converts VA to a rough battery size", () => {
    expect(vaToBatteryWh(1500)).toBeCloseTo(225);
  });
  it("converts watts to BTU/h", () => {
    expect(heatBtuPerHour(100)).toBeCloseTo(341.2);
  });
});

describe("cumulativeCost", () => {
  it("starts at the upfront cost and adds a month each step", () => {
    const c = cumulativeCost(120, 36, 50);
    expect(c).toHaveLength(37);
    expect(c[0]).toBe(50);
    expect(c[12]).toBeCloseTo(170);
    expect(c[36]).toBeCloseTo(410);
  });
});
