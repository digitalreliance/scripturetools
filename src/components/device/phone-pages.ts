import { HOME_HREF } from "@/lib/routes";

/**
 * Pages laid out for phones as well as for tablets and computers. A phone can
 * browse these; every other page (the studies) shows it the device gate.
 * Read by the boot script on first load and by DeviceRoute as the reader moves
 * between pages, which marks html[data-phone-page] on these.
 */
export const PHONE_PAGES: readonly string[] = [HOME_HREF];

/** Set on <html> while one of PHONE_PAGES is on screen. */
export const PHONE_PAGE_ATTRIBUTE = "data-phone-page";

/** "/studies/x/" and "/studies/x" are the same page. */
export function isPhonePage(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PHONE_PAGES.includes(path);
}
