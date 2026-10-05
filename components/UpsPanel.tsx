"use client";

import { useState } from "react";
import { upsRuntimeMinutes, vaToBatteryWh } from "@/lib/calc";
import { NumberField } from "./NumberField";

type Props = { wh: number | undefined; onChange: (wh: number | undefined) => void; loadW: number; peakW: number };

function formatRuntime(min: number | null) {
  if (min === null) return "–";
  if (min < 1) return "under a minute";
  if (min < 120) return `${Math.round(min)} min`;
  return `${(min / 60).toFixed(1)} h`;
}

export function UpsPanel({ wh, onChange, loadW, peakW }: Props) {
  const [unit, setUnit] = useState<"Wh" | "VA">("Wh");
  const [va, setVa] = useState(1500);
  const batteryWh = unit === "Wh" ? (wh ?? 0) : vaToBatteryWh(va);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <NumberField
          className="max-w-40 flex-1"
          label={unit === "Wh" ? "Battery capacity" : "UPS rating"}
          suffix={unit}
          value={unit === "Wh" ? (wh ?? 0) : va}
          max={1_000_000}
          step={unit === "Wh" ? 10 : 50}
          onChange={(n) => {
            if (unit === "Wh") onChange(n || undefined);
            else {
              setVa(n);
              onChange(Math.round(vaToBatteryWh(n)) || undefined);
            }
          }}
        />
        <div className="flex rounded-md border border-line text-xs" role="group" aria-label="Capacity unit">
          {(["Wh", "VA"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              className={`px-2 py-1.5 ${unit === u ? "bg-accent-soft font-semibold" : "text-muted"}`}
              onClick={() => {
                setUnit(u);
                if (u === "VA") onChange(Math.round(vaToBatteryWh(va)));
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {batteryWh > 0 && (
        <p className="text-sm">
          About <strong>{formatRuntime(upsRuntimeMinutes(batteryWh, loadW))}</strong> at your average draw, and{" "}
          <strong>{formatRuntime(upsRuntimeMinutes(batteryWh, peakW))}</strong> with everything at full load.
        </p>
      )}
      <p className="text-xs text-muted">
        Assumes 80% inverter efficiency.{" "}
        {unit === "VA" && "VA ratings don't state battery size, so we assume about 0.15 Wh per VA; check your UPS's battery for a better figure. "}
        Real runtime drops as batteries age.
      </p>
    </div>
  );
}
