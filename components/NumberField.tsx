"use client";

import { useId, useState } from "react";

type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hideLabel?: boolean;
  className?: string;
};

/** A number input that lets people type freely ("0.", "") and only commits valid numbers. */
export function NumberField({ label, value, onChange, min = 0, max, step = 1, suffix, hideLabel, className = "" }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Resync the draft when the value changes from outside (e.g. "Apply to all").
  if (value !== prevValue) {
    setPrevValue(value);
    if (Number(draft) !== value) setDraft(String(value));
  }

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1 block text-xs text-muted"}>
        {label}
      </label>
      <div className="flex items-center rounded-md border border-line bg-field focus-within:ring-2 focus-within:ring-accent">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm tabular-nums outline-none"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n)) {
              const clamped = Math.min(max ?? Infinity, Math.max(min, n));
              onChange(clamped);
            }
          }}
          onBlur={() => setDraft(String(value))}
        />
        {suffix && <span className="pr-2 text-xs text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
