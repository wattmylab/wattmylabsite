import type { SetupItem } from "./types";

export const DAYS_PER_YEAR = 365;
export const UPS_EFFICIENCY = 0.8;
export const W_TO_BTU = 3.412;
/** Rough battery capacity per VA for small line-interactive UPS units (e.g. 1500 VA ≈ 2×12 V 9 Ah). */
export const WH_PER_VA = 0.15;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Time-weighted average draw of one unit, in watts. loadShare is 0..1. */
export function avgWatts(idleW: number, loadW: number, loadShare: number): number {
  const L = clamp(loadShare, 0, 1);
  return idleW * (1 - L) + loadW * L;
}

/** Average draw of a whole row (all units), in watts, while it is switched on. */
export function itemAvgWatts(item: SetupItem): number {
  return avgWatts(item.idleW, item.loadW, item.loadPct / 100) * item.qty;
}

/** Average draw of a row spread across the whole day, in watts. */
export function itemDailyAvgWatts(item: SetupItem): number {
  return (itemAvgWatts(item) * clamp(item.hoursPerDay, 0, 24)) / 24;
}

export function itemKwhPerYear(item: SetupItem): number {
  return (itemAvgWatts(item) * clamp(item.hoursPerDay, 0, 24) * DAYS_PER_YEAR) / 1000;
}

export function costPerYear(kwhPerYear: number, pricePerKwh: number): number {
  return kwhPerYear * pricePerKwh;
}

export type Totals = {
  avgW: number; // average draw across the day
  onW: number; // draw while everything is on, at the set load share
  peakW: number; // everything on at full load
  kwhYear: number;
  costYear: number;
  costMonth: number;
  costDay: number;
  perItem: { kwhYear: number; costYear: number; avgW: number }[];
};

export function totals(items: SetupItem[], pricePerKwh: number): Totals {
  const perItem = items.map((it) => {
    const kwhYear = itemKwhPerYear(it);
    return { kwhYear, costYear: costPerYear(kwhYear, pricePerKwh), avgW: itemAvgWatts(it) };
  });
  const kwhYear = perItem.reduce((s, p) => s + p.kwhYear, 0);
  const costYear = costPerYear(kwhYear, pricePerKwh);
  return {
    avgW: items.reduce((s, it) => s + itemDailyAvgWatts(it), 0),
    onW: perItem.reduce((s, p) => s + p.avgW, 0),
    peakW: items.reduce((s, it) => s + it.loadW * it.qty, 0),
    kwhYear,
    costYear,
    costMonth: costYear / 12,
    costDay: costYear / DAYS_PER_YEAR,
    perItem,
  };
}

/** Months to pay back an upgrade, or null ("never") when it saves nothing. */
export function paybackMonths(upgradeCost: number, oldCostYear: number, newCostYear: number): number | null {
  const savingPerMonth = (oldCostYear - newCostYear) / 12;
  if (savingPerMonth <= 0) return null;
  return Math.max(0, upgradeCost) / savingPerMonth;
}

/** Estimated UPS runtime in minutes at a given draw. Null when there is no load. */
export function upsRuntimeMinutes(batteryWh: number, loadW: number): number | null {
  if (loadW <= 0) return null;
  return ((batteryWh * UPS_EFFICIENCY) / loadW) * 60;
}

export function vaToBatteryWh(va: number): number {
  return va * WH_PER_VA;
}

export function heatBtuPerHour(watts: number): number {
  return watts * W_TO_BTU;
}

/** Cumulative cost at the end of each month, for `months` months, starting from `upfront`. */
export function cumulativeCost(costYear: number, months: number, upfront = 0): number[] {
  return Array.from({ length: months + 1 }, (_, m) => upfront + (costYear / 12) * m);
}

export type UpgradeResult = {
  oldCostYear: number;
  newCostYear: number;
  savingYear: number;
  paybackMonths: number | null;
};

/** Compare the current setup with one where `replace` rows are swapped for `withItems`. */
export function compareUpgrade(
  items: SetupItem[],
  replace: number[],
  withItems: SetupItem[],
  upgradeCost: number,
  pricePerKwh: number,
): UpgradeResult {
  const oldCostYear = totals(items, pricePerKwh).costYear;
  const kept = items.filter((_, i) => !replace.includes(i));
  const newCostYear = totals([...kept, ...withItems], pricePerKwh).costYear;
  return {
    oldCostYear,
    newCostYear,
    savingYear: oldCostYear - newCostYear,
    paybackMonths: paybackMonths(upgradeCost, oldCostYear, newCostYear),
  };
}
