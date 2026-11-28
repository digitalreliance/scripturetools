"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, LibraryBig, Monitor, Send } from "lucide-react";
import { HOME_HREF } from "@/lib/routes";
import { enterPreview } from "./preview";

/**
 * The phone gate's choices: send the link on, copy it, preview anyway, or go
 * back to the index, which a phone can browse.
 */
export function GateActions() {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // navigator.share only exists in the browser; decide after hydration.
    const id = window.setTimeout(() => setCanShare(typeof navigator.share === "function"), 0);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }

  async function sendLink() {
    if (!canShare) return copyLink();
    try {
      await navigator.share({ title: document.title, url: window.location.href });
    } catch {
      // The visitor closed the share sheet; nothing to do.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={sendLink}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-cover-ink px-5 text-[15px] font-semibold text-cover transition-[filter] active:brightness-90"
      >
        {canShare ? <Send aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
        {canShare ? "Send to my tablet or computer" : "Copy link"}
      </button>
      {canShare ? (
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-control border border-cover-line px-5 text-[15px] font-medium text-cover-ink transition-colors active:bg-cover-raised"
        >
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </p>
      <button
        type="button"
        onClick={enterPreview}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 text-[15px] font-medium text-cover-muted underline decoration-cover-line underline-offset-4 transition-colors active:text-cover-ink"
      >
        <Monitor aria-hidden className="size-4" />
        Preview the desktop version
      </button>
      <Link
        href={`${HOME_HREF}#contents`}
        className="-mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 text-[15px] font-medium text-cover-muted underline decoration-cover-line underline-offset-4 transition-colors active:text-cover-ink"
      >
        <LibraryBig aria-hidden className="size-4" />
        Browse every study
      </Link>
    </div>
  );
}
