"use client";

import Link from "next/link";
import { NumberField } from "./NumberField";
import type { SetupItem } from "@/lib/types";

type Props = {
  item: SetupItem;
  costLabel: string;
  wattsLabel: string;
  onChange: (patch: Partial<SetupItem>) => void;
  onDuplicate?: () => void;
  onRemove: () => void;
};

export function DeviceRow({ item, costLabel, wattsLabel, onChange, onDuplicate, onRemove }: Props) {
  return (
    <li className="rounded-lg border border-line bg-panel p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            className="w-full truncate bg-transparent text-sm font-medium outline-none focus:underline"
            value={item.name}
            aria-label="Device name"
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <p className="text-xs text-muted">
            {item.deviceSlug ? (
              <Link href={`/devices/${item.deviceSlug}`} className="underline-offset-2 hover:underline">
                Preset details
              </Link>
            ) : (
              "Custom device"
            )}
            {" · "}
            {wattsLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{costLabel}</p>
          <p className="text-xs text-muted">per year</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <NumberField label="Qty" value={item.qty} min={1} max={999} onChange={(qty) => onChange({ qty: Math.round(qty) || 1 })} />
        <NumberField label="Idle" suffix="W" value={item.idleW} max={100000} step={0.5} onChange={(idleW) => onChange({ idleW })} />
        <NumberField label="Load" suffix="W" value={item.loadW} max={100000} step={0.5} onChange={(loadW) => onChange({ loadW })} />
        <NumberField label="On per day" suffix="h" value={item.hoursPerDay} max={24} step={0.5} onChange={(hoursPerDay) => onChange({ hoursPerDay })} />
        <NumberField label="Under load" suffix="%" value={item.loadPct} max={100} onChange={(loadPct) => onChange({ loadPct })} />
      </div>
      <div className="mt-2 flex gap-3 text-xs">
        {onDuplicate && (
          <button type="button" className="text-muted hover:text-foreground" onClick={onDuplicate}>
            Duplicate
          </button>
        )}
        <button type="button" className="text-muted hover:text-red-600" onClick={onRemove}>
          Remove
        </button>
      </div>
    </li>
  );
}
