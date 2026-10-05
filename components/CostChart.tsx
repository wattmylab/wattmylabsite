"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cumulativeCost } from "@/lib/calc";
import { formatMoney } from "@/lib/format";

type Props = { region: string; oldCostYear: number; newCostYear: number; upgradeCost: number };

export default function CostChart({ region, oldCostYear, newCostYear, upgradeCost }: Props) {
  const current = cumulativeCost(oldCostYear, 36);
  const upgraded = cumulativeCost(newCostYear, 36, upgradeCost);
  const data = current.map((c, m) => ({ month: m, current: c, upgraded: upgraded[m] }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Cumulative cost of the current and upgraded setup over three years">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, 36]}
            ticks={[0, 6, 12, 18, 24, 30, 36]}
            tickFormatter={(m: number) => (m % 12 === 0 ? `${m / 12}y` : `${m}m`)}
            stroke="var(--muted)"
            fontSize={12}
          />
          <YAxis
            width={64}
            stroke="var(--muted)"
            fontSize={12}
            tickFormatter={(v: number) => formatMoney(v, region, { whole: true })}
          />
          <Tooltip
            formatter={(v) => formatMoney(Number(v), region)}
            labelFormatter={(m) => `Month ${m}`}
            contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="linear" dataKey="current" name="Keep current" stroke="var(--chart-old)" strokeWidth={2} dot={false} />
          <Line type="linear" dataKey="upgraded" name="Upgrade" stroke="var(--chart-new)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
