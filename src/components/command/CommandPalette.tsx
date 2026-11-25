"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { CommandDialogProps } from "./CommandDialog";
import { loadCommandDialog, OPEN_EVENT, preloadCommandPalette } from "./open";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
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
  const [Palette, setPalette] = useState<ComponentType<CommandDialogProps> | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Meta" || event.key === "Control") {
        preloadCommandPalette();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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

  return Palette ? <Palette open={open} onOpenChange={setOpen} /> : null;
}
