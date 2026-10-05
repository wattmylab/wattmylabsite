import { describe, expect, it } from "vitest";
import { reducer } from "./reducer";
import { emptySetup } from "./share";
import type { Setup, SetupItem } from "./types";

const it_ = (name: string): SetupItem => ({ name, idleW: 1, loadW: 2, qty: 1, hoursPerDay: 24, loadPct: 15 });

describe("reducer", () => {
  it("switches region and resets the price to its default", () => {
    const s = reducer({ ...emptySetup("GB"), pricePerKwh: 9 }, { type: "setRegion", region: "DE" });
    expect(s.region).toBe("DE");
    expect(s.pricePerKwh).toBe(0.438);
  });
  it("keeps upgrade indexes aligned when a row is removed", () => {
    const s: Setup = { ...emptySetup(), items: [it_("a"), it_("b"), it_("c")], upgrade: { replace: [0, 2], with: [], cost: 0 } };
    const next = reducer(s, { type: "removeItem", index: 0 });
    expect(next.items.map((i) => i.name)).toEqual(["b", "c"]);
    expect(next.upgrade?.replace).toEqual([1]);
  });
  it("duplicates a row in place", () => {
    const s: Setup = { ...emptySetup(), items: [it_("a"), it_("b")] };
    expect(reducer(s, { type: "duplicateItem", index: 0 }).items.map((i) => i.name)).toEqual(["a", "a", "b"]);
  });
  it("applies a load share to every row", () => {
    const s: Setup = { ...emptySetup(), items: [it_("a"), it_("b")] };
    expect(reducer(s, { type: "setAll", patch: { loadPct: 40 } }).items.every((i) => i.loadPct === 40)).toBe(true);
  });
  it("toggles a row in and out of the upgrade", () => {
    let s: Setup = { ...emptySetup(), items: [it_("a"), it_("b")] };
    s = reducer(s, { type: "toggleReplace", index: 1 });
    s = reducer(s, { type: "toggleReplace", index: 0 });
    expect(s.upgrade?.replace).toEqual([0, 1]);
    s = reducer(s, { type: "toggleReplace", index: 1 });
    expect(s.upgrade?.replace).toEqual([0]);
  });
});
