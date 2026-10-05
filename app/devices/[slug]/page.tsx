import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceBadge } from "@/components/SourceBadge";
import { avgWatts, costPerYear, itemKwhPerYear } from "@/lib/calc";
import { categoryLabels, devices, getDevice, getRegion, itemFromDevice } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { DEFAULT_LOAD_PCT } from "@/lib/types";
import { emptySetup, encodeSetup } from "@/lib/share";
import { SUBMIT_READING_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return devices.map((d) => ({ slug: d.slug }));
}

const showcaseRegions = ["GB", "US", "DE"];

function yearlyCost(slug: string, region: string) {
  const d = getDevice(slug)!;
  return costPerYear(itemKwhPerYear(itemFromDevice(d)), getRegion(region).pricePerKwh);
}

export async function generateMetadata({ params }: PageProps<"/devices/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = getDevice(slug);
  if (!d) return {};
  const gb = formatMoney(yearlyCost(slug, "GB"), "GB");
  const us = formatMoney(yearlyCost(slug, "US"), "US");
  return {
    title: `${d.name} power consumption and running cost`,
    description: `A ${d.name} typically draws ${d.idleW} W idle and ${d.loadW} W under load. Running 24/7 costs about ${gb} a year in the UK and ${us} in the US.`,
    alternates: { canonical: `/devices/${slug}` },
  };
}

export default async function DevicePage({ params }: PageProps<"/devices/[slug]">) {
  const { slug } = await params;
  const d = getDevice(slug);
  if (!d) notFound();

  const avg = avgWatts(d.idleW, d.loadW, DEFAULT_LOAD_PCT / 100);
  const kwh = itemKwhPerYear(itemFromDevice(d));
  const openLink = (region: string) => `/?s=${encodeSetup({ ...emptySetup(region), items: [itemFromDevice(d)] })}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted">
        <Link href="/devices" className="hover:underline">
          Devices
        </Link>{" "}
        / {categoryLabels[d.category]}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{d.name} power consumption and running cost</h1>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <SourceBadge type={d.sourceType} />
        <span className="text-muted">Last reviewed {d.lastReviewed}</span>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-line bg-panel p-4 text-center">
        <div>
          <dt className="text-xs text-muted">Idle</dt>
          <dd className="text-2xl font-bold tabular-nums">{d.idleW} W</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Under load</dt>
          <dd className="text-2xl font-bold tabular-nums">{d.loadW} W</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Typical average</dt>
          <dd className="text-2xl font-bold tabular-nums">{avg.toFixed(1)} W</dd>
        </div>
      </dl>
      <p className="mt-2 text-sm text-muted">
        Assumed config: {d.config}. {d.notes}
      </p>

      <h2 className="mt-8 text-lg font-semibold">What it costs to run 24/7</h2>
      <p className="text-sm text-muted">
        About {Math.round(kwh)} kWh a year, at {DEFAULT_LOAD_PCT}% of the time under load.
      </p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 font-normal">Region</th>
            <th className="py-2 font-normal">Price per kWh</th>
            <th className="py-2 text-right font-normal">Per month</th>
            <th className="py-2 text-right font-normal">Per year</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {showcaseRegions.map((code) => {
            const r = getRegion(code);
            const year = yearlyCost(slug, code);
            return (
              <tr key={code} className="border-b border-line">
                <td className="py-2">{r.name}</td>
                <td className="py-2 tabular-nums">{formatMoney(r.pricePerKwh, code, { precise: true })}</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(year / 12, code)}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{formatMoney(year, code)}</td>
                <td className="py-2 pl-3 text-right">
                  <Link href={openLink(code)} className="text-accent-strong hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={openLink("GB")} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          Open in the calculator
        </Link>
        <a href={SUBMIT_READING_URL} className="rounded-md border border-line px-4 py-2 text-sm" target="_blank" rel="noreferrer">
          Submit your reading
        </a>
      </div>

      <p className="mt-8 text-xs text-muted">
        These figures are typical, not exact. Server draw changes a lot with CPUs, RAM, drives and PSU count, so measure yours
        with a plug-in power meter and enter your own numbers in the calculator.
      </p>
    </div>
  );
}
