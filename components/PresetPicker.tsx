"use client";

import { useId, useMemo, useState } from "react";
import { categoryLabels, devices } from "@/lib/data";
import type { Device } from "@/lib/types";

type Props = {
  onPick: (d: Device) => void;
  label?: string;
};

export function PresetPicker({ onPick, label = "Add a device" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return devices.filter((d) => {
      const hay = `${d.name} ${d.slug} ${categoryLabels[d.category]}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query]);

  const pick = (d: Device) => {
    onPick(d);
    setQuery("");
    setActive(0);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={listId + "-input"} className="sr-only">
        {label}
      </label>
      <input
        id={listId + "-input"}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={`${label}: R720, N100, NAS…`}
        className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && matches[active]) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-line bg-panel py-1 shadow-lg"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-muted">No preset matches. Add a custom device instead.</li>}
          {matches.map((d, i) => (
            <li
              key={d.slug}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-1.5 text-sm ${i === active ? "bg-accent-soft" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(d);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span>
                {d.name}
                <span className="ml-2 text-xs text-muted">{categoryLabels[d.category]}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {d.idleW}–{d.loadW} W
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
