"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Share } from "lucide-react";
import { ToolButton } from "./parts";

/**
 * Shares a link to the study exactly as it is on screen: the view, the
 * selection, everything the URL's hash holds. On a touch device it opens the
 * system's share sheet (AirDrop, Messages, Mail…); elsewhere it copies the
 * link. A study opened from an iPad's home screen has no address bar, so this
 * is how its views get passed on.
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const reset = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reset.current), []);

  async function share() {
    const url = window.location.href;
    const sheet = window.matchMedia("(pointer: coarse)").matches && typeof navigator.share === "function";
    if (sheet) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // The reader closed the share sheet; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(reset.current);
      reset.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <>
      <ToolButton
        onClick={share}
        title={copied ? "Link copied" : "Share a link to this view"}
        aria-label="Share a link to this view"
        icon={
          copied ? (
            <Check aria-hidden />
          ) : (
            <>
              <Link2 aria-hidden className="pointer-coarse:hidden" />
              <Share aria-hidden className="hidden pointer-coarse:block" />
            </>
          )
        }
      />
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}
