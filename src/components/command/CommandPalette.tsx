"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { CommandDialogProps } from "./CommandDialog";
import { loadCommandDialog, OPEN_EVENT, preloadCommandPalette, type OpenEvent } from "./open";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Something focus can be returned to: an HTML element, or SVG such as a diagram's focusable marks. */
function focusable(element: Element | null): HTMLElement | SVGElement | null {
  return element instanceof HTMLElement || element instanceof SVGElement ? element : null;
}

/**
 * ⌘K, Ctrl+K or "/" anywhere: find a study, jump to a section, or a verse in
 * Revelation. Only this launcher ships with the page. It answers the shortcuts
 * from the first paint and fetches the palette itself (./CommandDialog) the
 * first time it opens. Pressing ⌘ or Ctrl, or pointing at a search button,
 * starts that fetch a moment early.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  // What had focus when the palette was asked to open; the palette returns focus
  // to it on closing. Noted here because the palette's code can arrive later.
  const [opener, setOpener] = useState<HTMLElement | SVGElement | null>(null);
  const [Palette, setPalette] = useState<ComponentType<CommandDialogProps> | null>(null);

  useEffect(() => {
    const show = (from: Element | null) => {
      if (open) return;
      setOpener(focusable(from));
      setOpen(true);
    };
    const onOpen = (event: Event) => show((event as OpenEvent).detail ?? document.activeElement);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Meta" || event.key === "Control") {
        preloadCommandPalette();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) setOpen(false);
        else show(document.activeElement);
      } else if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();
        show(document.activeElement);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fetch the palette the first time it is wanted.
  useEffect(() => {
    if (!open || Palette) return;
    let current = true;
    loadCommandDialog().then(
      (component) => {
        if (current) setPalette(() => component);
      },
      () => {
        // Offline, or this build's files are gone: stay closed so the next shortcut retries.
        if (current) setOpen(false);
      },
    );
    return () => {
      current = false;
    };
  }, [open, Palette]);

  return Palette ? <Palette open={open} onOpenChange={setOpen} opener={opener} /> : null;
}
