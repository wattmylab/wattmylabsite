"use client";

import dynamic from "next/dynamic";
import type { Dispatch } from "react";
import { compareUpgrade, itemAvgWatts, totals } from "@/lib/calc";
import { itemFromDevice } from "@/lib/data";
import { formatMoney, formatMonths, formatNumber } from "@/lib/format";
import type { Action } from "@/lib/reducer";
import type { Setup } from "@/lib/types";
import { DeviceRow } from "./DeviceRow";
import { NumberField } from "./NumberField";
import { PresetPicker } from "./PresetPicker";

const CostChart = dynamic(() => import("./CostChart"), {
  ssr: false,
  loading: () => <div className="h-56" />,
});

export function UpgradePanel({ setup, dispatch }: { setup: Setup; dispatch: Dispatch<Action> }) {
  const up = setup.upgrade ?? { replace: [], with: [], cost: 0 };
  const result = compareUpgrade(setup.items, up.replace, up.with, up.cost, setup.pricePerKwh);
  const withTotals = totals(up.with, setup.pricePerKwh);
  const ready = up.replace.length > 0 || up.with.length > 0;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold">1. Pick what you would retire</h3>
        {setup.items.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Add some devices first.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {setup.items.map((it, i) => (
              <li key={i}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={up.replace.includes(i)}
                    onChange={() => dispatch({ type: "toggleReplace", index: i })}
                  />
                  <span className="flex-1">
                    {it.qty > 1 && `${it.qty}× `}
                    {it.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold">2. Add what replaces it</h3>
        <div className="mt-2">
          <PresetPicker label="Add a replacement" onPick={(d) => dispatch({ type: "addReplacement", item: itemFromDevice(d) })} />
        </div>
        <ul className="mt-2 space-y-2">
          {up.with.map((it, i) => (
            <DeviceRow
              key={i}
              item={it}
              costLabel={formatMoney(withTotals.perItem[i].costYear, setup.region)}
              wattsLabel={`${formatNumber(itemAvgWatts(it), setup.region, 1)} W avg`}
              onChange={(patch) => dispatch({ type: "updateReplacement", index: i, patch })}
              onRemove={() => dispatch({ type: "removeReplacement", index: i })}
            />
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold">3. What it costs to buy</h3>
        <NumberField
          className="mt-2 max-w-48"
          label="Upgrade cost (after selling old kit)"
          value={up.cost}
          max={10_000_000}
          step={10}
          onChange={(cost) => dispatch({ type: "setUpgradeCost", cost })}
        />
      </section>

      {ready && (
        <section className="rounded-lg bg-accent-soft p-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Now</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(result.oldCostYear, setup.region)}/yr</p>
            </div>
            <div>
              <p className="text-muted">After upgrade</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(result.newCostYear, setup.region)}/yr</p>
            </div>
            <div>
              <p className="text-muted">Saving</p>
              <p className={`text-lg font-semibold tabular-nums ${result.savingYear > 0 ? "text-good" : "text-bad"}`}>
                {formatMoney(result.savingYear, setup.region)}/yr
              </p>
            </div>
            <div>
              <p className="text-muted">Pays for itself in</p>
              <p className="text-lg font-semibold">{formatMonths(result.paybackMonths)}</p>
            </div>
          </div>
          <div className="mt-4">
            <CostChart
              region={setup.region}
              oldCostYear={result.oldCostYear}
              newCostYear={result.newCostYear}
              upgradeCost={up.cost}
            />
          </div>
          <button type="button" className="mt-2 text-xs text-muted hover:text-foreground" onClick={() => dispatch({ type: "clearUpgrade" })}>
            Clear comparison
          </button>
        </section>
      )}
    </div>
  );
}
