"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { heatBtuPerHour, totals } from "@/lib/calc";
import { getDevice, getRegion, guessRegion, itemFromDevice, pricesReviewed, regions } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { reducer } from "@/lib/reducer";
import { DEFAULT_LOAD_PCT, type Setup } from "@/lib/types";
import { decodeSetup, emptySetup, encodeSetup } from "@/lib/share";
import { DeviceRow } from "./DeviceRow";
import { NumberField } from "./NumberField";
import { PresetPicker } from "./PresetPicker";
import { UpgradePanel } from "./UpgradePanel";
import { UpsPanel } from "./UpsPanel";

const examples: { label: string; slugs: [string, number][] }[] = [
  { label: "Old enterprise rack", slugs: [["dell-r720", 1], ["hdd-3-5", 6], ["switch-24-port-poe", 1], ["access-point", 2], ["router-consumer", 1]] },
  { label: "Mini PC cluster", slugs: [["lenovo-m920q", 3], ["synology-4-bay", 1], ["switch-8-port", 1], ["router-consumer", 1]] },
  { label: "Pi and NAS", slugs: [["raspberry-pi-5", 2], ["synology-2-bay", 1], ["router-consumer", 1]] },
];

function exampleSetup(slugs: [string, number][], base: Setup): Setup {
  return {
    ...base,
    items: slugs.flatMap(([slug, qty]) => {
      const d = getDevice(slug);
      return d ? [{ ...itemFromDevice(d), qty }] : [];
    }),
    upgrade: undefined,
  };
}

export function Calculator() {
  const [setup, dispatch] = useReducer(reducer, emptySetup("US"));
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allLoad, setAllLoad] = useState(DEFAULT_LOAD_PCT);
  const [allHours, setAllHours] = useState(24);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const firstSync = useRef(true);

  // Load from the URL, or guess the region from the browser locale (never from IP).
  // This has to run after hydration because the static HTML can't know the URL or locale.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const region = guessRegion(navigator.languages ?? [navigator.language]);
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) {
      const r = decodeSetup(s, region);
      dispatch({ type: "load", setup: r.setup });
      if (!r.ok) setNotice(`${r.error} We've started you with an empty setup.`);
      if (r.setup.upgrade) setShowUpgrade(true);
    } else {
      dispatch({ type: "setRegion", region });
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the address bar as the share link.
  useEffect(() => {
    if (!ready) return;
    if (firstSync.current) {
      firstSync.current = false;
      if (!window.location.search) return;
    }
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (setup.items.length || setup.upgrade) url.searchParams.set("s", encodeSetup(setup));
      else url.searchParams.delete("s");
      window.history.replaceState(null, "", url);
    }, 300);
    return () => clearTimeout(t);
  }, [setup, ready]);

  const region = getRegion(setup.region);
  const t = totals(setup.items, setup.pricePerKwh);
  const money = (n: number, precise = false) => formatMoney(n, setup.region, { precise });
  const num = (n: number, d = 0) => formatNumber(n, setup.region, d);

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", encodeSetup(setup));
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url.toString());
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-28 pt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-12">
      {/* Devices */}
      <section aria-labelledby="devices-heading" className="space-y-4">
        {notice && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-md border border-line bg-accent-soft p-3 text-sm">
            <span>{notice}</span>
            <button type="button" className="text-muted" onClick={() => setNotice(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-panel p-3">
          <div>
            <label htmlFor="region" className="mb-1 block text-xs text-muted">
              Where you live
            </label>
            <select
              id="region"
              className="rounded-md border border-line bg-field px-2 py-1.5 text-sm"
              value={setup.region}
              onChange={(e) => dispatch({ type: "setRegion", region: e.target.value })}
            >
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.currency})
                </option>
              ))}
            </select>
          </div>
          <NumberField
            className="w-40"
            label="Electricity price"
            suffix={`${region.currency}/kWh`}
            value={setup.pricePerKwh}
            step={0.01}
            max={100}
            onChange={(price) => dispatch({ type: "setPrice", price })}
          />
          <p className="basis-full text-xs text-muted">
            {setup.pricePerKwh === region.pricePerKwh ? (
              <>
                Default: <a className="underline" href={region.sourceUrl} target="_blank" rel="noreferrer">{region.source}</a>.
                Check your bill for your own rate. Prices reviewed {pricesReviewed}.
              </>
            ) : (
              <button type="button" className="underline" onClick={() => dispatch({ type: "setPrice", price: region.pricePerKwh })}>
                Reset to the {region.name} average ({money(region.pricePerKwh, true)}/kWh)
              </button>
            )}
          </p>
        </div>

        <div className="flex items-baseline justify-between">
          <h2 id="devices-heading" className="text-lg font-semibold">
            Your devices
          </h2>
          {setup.items.length > 0 && (
            <button type="button" className="text-xs text-muted hover:text-foreground" onClick={() => dispatch({ type: "reset" })}>
              Clear all
            </button>
          )}
        </div>

        <PresetPicker onPick={(d) => dispatch({ type: "addItem", item: itemFromDevice(d) })} />
        <button
          type="button"
          className="text-sm text-accent-strong hover:underline"
          onClick={() =>
            dispatch({
              type: "addItem",
              item: { name: "Custom device", idleW: 20, loadW: 60, qty: 1, hoursPerDay: 24, loadPct: DEFAULT_LOAD_PCT },
            })
          }
        >
          + Add a custom device
        </button>

        {setup.items.length === 0 && ready && (
          <div className="rounded-lg border border-dashed border-line p-4 text-sm">
            <p className="text-muted">Search for your kit above, or start from an example:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="rounded-full border border-line px-3 py-1 hover:bg-accent-soft"
                  onClick={() => dispatch({ type: "load", setup: exampleSetup(ex.slugs, setup) })}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {setup.items.map((it, i) => (
            <DeviceRow
              key={i}
              item={it}
              costLabel={money(t.perItem[i].costYear)}
              wattsLabel={`${num(t.perItem[i].avgW, 1)} W avg`}
              onChange={(patch) => dispatch({ type: "updateItem", index: i, patch })}
              onDuplicate={() => dispatch({ type: "duplicateItem", index: i })}
              onRemove={() => dispatch({ type: "removeItem", index: i })}
            />
          ))}
        </ul>

        {setup.items.length > 1 && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-3">
            <p className="basis-full text-xs text-muted">Set every device at once</p>
            <NumberField className="w-28" label="Under load" suffix="%" value={allLoad} max={100} onChange={setAllLoad} />
            <button type="button" className="rounded-md border border-line px-2 py-1.5 text-xs hover:bg-accent-soft" onClick={() => dispatch({ type: "setAll", patch: { loadPct: allLoad } })}>
              Apply
            </button>
            <NumberField className="ml-2 w-28" label="On per day" suffix="h" value={allHours} max={24} step={0.5} onChange={setAllHours} />
            <button type="button" className="rounded-md border border-line px-2 py-1.5 text-xs hover:bg-accent-soft" onClick={() => dispatch({ type: "setAll", patch: { hoursPerDay: allHours } })}>
              Apply
            </button>
          </div>
        )}

        <details className="rounded-lg border border-line bg-panel p-4" open={showUpgrade} onToggle={(e) => setShowUpgrade(e.currentTarget.open)}>
          <summary className="cursor-pointer font-semibold">Compare an upgrade</summary>
          <p className="mb-4 mt-1 text-sm text-muted">Would swapping old kit for something efficient pay off?</p>
          <UpgradePanel setup={setup} dispatch={dispatch} />
        </details>

        <details className="rounded-lg border border-line bg-panel p-4">
          <summary className="cursor-pointer font-semibold">UPS runtime</summary>
          <div className="mt-3">
            <UpsPanel wh={setup.upsWh} onChange={(wh) => dispatch({ type: "setUps", wh })} loadW={t.onW} peakW={t.peakW} />
          </div>
        </details>
      </section>

      {/* Results */}
      <aside aria-labelledby="results-heading" className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 id="results-heading" className="text-sm font-semibold text-muted">
            Your lab costs
          </h2>
          <p className="mt-1 text-4xl font-bold tabular-nums" aria-live="polite">
            {money(t.costYear)}
            <span className="text-base font-medium text-muted"> /year</span>
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted">Per month</dt>
              <dd className="font-semibold tabular-nums">{money(t.costMonth)}</dd>
            </div>
            <div>
              <dt className="text-muted">Per day</dt>
              <dd className="font-semibold tabular-nums">{money(t.costDay, true)}</dd>
            </div>
            <div>
              <dt className="text-muted">Average draw</dt>
              <dd className="font-semibold tabular-nums">{num(t.avgW)} W</dd>
            </div>
            <div>
              <dt className="text-muted">Energy per year</dt>
              <dd className="font-semibold tabular-nums">{num(t.kwhYear)} kWh</dd>
            </div>
            <div>
              <dt className="text-muted">Peak (all at full load)</dt>
              <dd className="font-semibold tabular-nums">{num(t.peakW)} W</dd>
            </div>
            <div>
              <dt className="text-muted">Heat output</dt>
              <dd className="font-semibold tabular-nums">{num(heatBtuPerHour(t.avgW))} BTU/h</dd>
            </div>
          </dl>

          {setup.items.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <h3 className="text-xs font-semibold text-muted">Where it goes</h3>
              <ul className="mt-2 space-y-1.5">
                {setup.items
                  .map((it, i) => ({ it, cost: t.perItem[i].costYear, i }))
                  .sort((a, b) => b.cost - a.cost)
                  .map(({ it, cost, i }) => (
                    <li key={i} className="text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="truncate">
                          {it.qty > 1 && `${it.qty}× `}
                          {it.name}
                        </span>
                        <span className="tabular-nums">{money(cost)}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 rounded-full bg-line">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${t.costYear ? (cost / t.costYear) * 100 : 0}%` }} />
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={copyLink}
            disabled={setup.items.length === 0}
            className="mt-5 w-full rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-ink hover:brightness-95 disabled:opacity-50"
          >
            {copied ? "Link copied" : "Copy share link"}
          </button>
          <p className="mt-3 text-xs text-muted">
            Preset figures are typical estimates, not exact. Your config can change draw a lot, so check with a plug-in power meter
            and type in your own numbers.
          </p>
        </div>
      </aside>

      {/* Mobile sticky total */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-line bg-panel/95 px-4 py-3 backdrop-blur lg:hidden">
        <span className="text-sm text-muted">Per year</span>
        <span className="text-xl font-bold tabular-nums">{money(t.costYear)}</span>
        <button
          type="button"
          onClick={copyLink}
          disabled={setup.items.length === 0}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50"
        >
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    </div>
  );
}
