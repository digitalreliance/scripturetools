"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { isPhonePage, PHONE_PAGE_ATTRIBUTE } from "./phone-pages";

/**
 * Keeps html[data-phone-page] true to the page on screen as the reader moves
 * around without reloading: a phone tapping from the index into a study must
 * meet the gate before the study paints. (The boot script sets it on first
 * load.) Renders nothing.
 */
export function DeviceRoute() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute(PHONE_PAGE_ATTRIBUTE, isPhonePage(pathname));
  }, [pathname]);
  return null;
}
