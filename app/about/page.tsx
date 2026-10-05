import type { Metadata } from "next";
import { pricesReviewed, regions } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "How the numbers are calculated",
  description: "The formulas, data sources and assumptions behind WattsMyLab's homelab power and cost estimates.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">How the numbers are calculated</h1>

      <section>
        <h2 className="text-lg font-semibold">Average power</h2>
        <p>
          Every device has an idle and a load figure. You say what share of the time it spends under load (15% by default),
          and we blend the two: <code>average W = idle × (1 − load share) + load × load share</code>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Energy and cost</h2>
        <p>
          <code>kWh per year = average W × quantity × hours on per day × 365 ÷ 1000</code>, and{" "}
          <code>cost per year = kWh per year × price per kWh</code>. Monthly cost is a twelfth of that; daily is a 365th.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Upgrade payback</h2>
        <p>
          <code>payback months = upgrade cost ÷ (yearly saving ÷ 12)</code>. If the new setup costs the same or more to run, it
          never pays back, and we say so.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">UPS runtime and heat</h2>
        <p>
          <code>runtime minutes ≈ battery Wh × 0.8 ÷ load W × 60</code>, allowing for inverter losses. Heat is{" "}
          <code>W × 3.412 BTU/h</code>, since nearly every watt a computer draws ends up as heat.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Where device figures come from</h2>
        <p>
          Each preset is labelled Measured, Community, Spec sheet or Estimate. Measured readings beat community ones, which beat
          spec sheets, which beat estimates. Spec sheets often list maximum rather than typical draw. Every preset states the
          configuration it assumes, because CPUs, RAM, drives and PSUs change server draw a lot.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Default electricity prices</h2>
        <p>Reviewed {pricesReviewed}. Your own tariff will differ, so type in the rate from your bill.</p>
        <ul className="mt-2 list-disc pl-5">
          {regions.map((r) => (
            <li key={r.code}>
              {r.name}: {formatMoney(r.pricePerKwh, r.code, { precise: true })}/kWh ({r.source})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p>
          Everything is calculated in your browser. Your setup lives only in the page address, so sharing the link shares the
          setup. We guess your region from your browser language, never your IP, and we don&apos;t set tracking cookies.
        </p>
      </section>
    </div>
  );
}
