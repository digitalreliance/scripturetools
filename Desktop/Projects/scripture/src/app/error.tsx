"use client";

import Link from "next/link";

/** Shown if a page throws in the browser, instead of a blank screen. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center bg-paper px-14 text-ink">
      <p className="text-[14px] text-ink-muted">Something went wrong</p>
      <h1 className="mt-3 max-w-[22ch] text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] [font-stretch:115%]">
        This page stopped working while it was loading.
      </h1>
      <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-ink-muted">
        Try it again. If it keeps happening, go back to the index and open the study from there.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-control bg-ink px-5 text-[15px] font-semibold text-paper hover:bg-black"
        >
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-control border border-paper-line px-5 text-[15px] font-medium">
          Go to the index
        </Link>
      </div>
    </main>
  );
}
