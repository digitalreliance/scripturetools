"use client";

import type { ComponentProps } from "react";
import { openCommandPalette, preloadCommandPalette } from "./open";

/**
 * A button that opens the command palette. It starts fetching the palette's
 * code as soon as the pointer or keyboard focus arrives, so the first click
 * rarely waits. Its contents are rendered by the server (see SearchButton).
 */
export function OpenPaletteButton(props: Omit<ComponentProps<"button">, "type" | "onClick" | "onPointerEnter" | "onFocus">) {
  return (
    <button
      type="button"
      {...props}
      onClick={openCommandPalette}
      onPointerEnter={preloadCommandPalette}
      onFocus={preloadCommandPalette}
    />
  );
}
