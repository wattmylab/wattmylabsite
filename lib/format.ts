import { getRegion } from "./data";

export function formatMoney(amount: number, regionCode: string, opts: { precise?: boolean; whole?: boolean } = {}): string {
  const r = getRegion(regionCode);
  const digits = opts.whole ? 0 : opts.precise || Math.abs(amount) < 100 ? 2 : 0;
  return new Intl.NumberFormat(r.locale, {
    style: "currency",
    currency: r.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatNumber(n: number, regionCode: string, maxDigits = 0): string {
  return new Intl.NumberFormat(getRegion(regionCode).locale, { maximumFractionDigits: maxDigits }).format(n);
}

export function formatMonths(months: number | null): string {
  if (months === null) return "never";
  if (months < 1) return "under a month";
  if (months < 24) return `${Math.round(months)} months`;
  return `${(months / 12).toFixed(1)} years`;
}
