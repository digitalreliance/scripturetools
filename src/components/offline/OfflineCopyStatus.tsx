"use client";

import { clsx } from "clsx";
import { formatIsoDate } from "@/lib/dates";
import { useOfflineCopy, useOnline, type OfflineCopy } from "@/lib/offline/client";
import { SITE } from "@/lib/site";

/** "today", "yesterday", or "on 28 November 2026", in the reader's own time zone. */
function savedWhen(savedAt: string): string {
  const day = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const saved = day(new Date(savedAt));
  const now = new Date();
  if (saved === day(now)) return "today";
  if (saved === day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "yesterday";
  return `on ${formatIsoDate(saved)}`;
}

function describe(copy: OfflineCopy, online: boolean): { text: string; saved: boolean } | null {
  switch (copy.state) {
    case "unknown":
      return null;
    case "saved":
      return online
        ? { text: `Saved on this device ${savedWhen(copy.savedAt)}.`, saved: true }
        : { text: "You’re offline, reading the copy saved on this device.", saved: true };
    case "saving":
      return online
        ? { text: "Saving to this device…", saved: false }
        : { text: "You’re offline, and nothing is saved on this device yet.", saved: false };
    case "failed":
      return {
        text: `Not saved yet. It will try again the next time you open ${SITE.name} with a connection.`,
        saved: false,
      };
    case "unsupported":
      return { text: "This browser can’t keep it for reading offline.", saved: false };
    case "off":
      return { text: "Saving for offline reading is off in development builds.", saved: false };
  }
}

/**
 * One line under "Works offline" on the hub: whether this device has the
 * site saved, and since when. Empty until the browser can say, with the
 * line's height held so nothing moves.
 */
export function OfflineCopyStatus({ className }: { className?: string }) {
  const status = describe(useOfflineCopy(), useOnline());
  return (
    <p
      aria-live="polite"
      className={clsx("flex min-h-5 items-start gap-2 text-[13px] leading-[20px] text-ink-muted", className)}
    >
      {status ? (
        <>
          {/* Centred on the first line, however many the message takes. */}
          <span
            aria-hidden
            className={clsx("mt-1.5 size-2 shrink-0 rounded-full", status.saved ? "bg-ink" : "border border-ink-muted")}
          />
          <span>{status.text}</span>
        </>
      ) : null}
    </p>
  );
}
