import { cn } from "@/lib/cn";

/** A study's status as a dot and a word: filled for live, hollow for planned. */
export function Status({ live }: { live: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
      <span aria-hidden className={cn("size-2 rounded-full", live ? "bg-ink" : "border border-ink-muted")} />
      {live ? "Live" : "Planned"}
    </span>
  );
}
