import { sourceLabels } from "@/lib/data";
import type { SourceType } from "@/lib/types";

const styles: Record<SourceType, string> = {
  measured: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  community: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "spec-sheet": "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  estimate: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
};

export function SourceBadge({ type }: { type: SourceType }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[type]}`}>{sourceLabels[type]}</span>;
}
