import type { Metadata } from "next";
import Link from "next/link";
import { SourceBadge } from "@/components/SourceBadge";
import { categoryLabels, devices } from "@/lib/data";
import { categories } from "@/lib/types";

export const metadata: Metadata = {
  title: "Homelab device power consumption",
  description: "Typical idle and load power draw for servers, mini PCs, NAS units, Raspberry Pis, switches and drives.",
};

export default function DevicesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Device power consumption</h1>
      <p className="mt-1 text-muted">Typical idle and load draw for common homelab kit. Click a device to see what it costs to run.</p>
      {categories.map((c) => (
        <section key={c} className="mt-8">
          <h2 className="text-lg font-semibold">{categoryLabels[c]}</h2>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-panel">
            {devices
              .filter((d) => d.category === c)
              .map((d) => (
                <li key={d.slug}>
                  <Link href={`/devices/${d.slug}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-accent-soft">
                    <span>{d.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-muted">
                        {d.idleW}–{d.loadW} W
                      </span>
                      <SourceBadge type={d.sourceType} />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
