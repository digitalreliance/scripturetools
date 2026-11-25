/**
 * The light half of the command palette, safe to import from any client
 * component: open it, or fetch its code ahead of time. The palette itself
 * (cmdk, Radix Dialog, the study registry, the reference parser) is a separate
 * chunk that loads the first time someone searches, so it adds nothing to the
 * JavaScript a page needs before interaction. Never import `./CommandDialog`
 * statically.
 */
import type { ComponentType } from "react";
import type { CommandDialogProps } from "./CommandDialog";

export const OPEN_EVENT = "scripture:open-command-palette";

/** Open the palette from any button. */
export function openCommandPalette(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

let dialog: Promise<ComponentType<CommandDialogProps>> | undefined;

/** The palette's code, fetched once. A failed fetch is forgotten so the next attempt retries. */
export function loadCommandDialog(): Promise<ComponentType<CommandDialogProps>> {
  dialog ??= import("./CommandDialog").then(
    (module) => module.CommandDialog,
    (error: unknown) => {
      dialog = undefined;
      throw error;
    },
  );
  return dialog;
}

/** Start fetching the palette's code when a visitor looks likely to open it. */
export function preloadCommandPalette(): void {
  loadCommandDialog().catch(() => {
    // Nothing to do: opening the palette tries again.
  });
}
