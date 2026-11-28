"use client";

import { useHashParam } from "@/lib/hooks/use-hash-param";
import { useOnline } from "@/lib/offline/client";
import { HOME_HREF, OFFLINE_HREF } from "@/lib/routes";

/**
 * The address the reader was opening, from the hash the service worker sets
 * (#from=/read/psalms/115). Only a path on this site counts.
 */
function attempted(from: string | null): string | null {
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) return null;
  return from.split(/[?#]/)[0] === OFFLINE_HREF ? null : from;
}

const button = "inline-flex h-11 items-center rounded-control px-5 text-[15px] transition-colors";

/**
 * What happened, and what to do: the offline page's message and buttons,
 * which depend on where the reader was going and whether the connection is
 * back. Before the browser can say, it shows the message for no address.
 */
export function OfflineNotice() {
  const from = attempted(useHashParam("from")[0]);
  const online = useOnline();

  let message: string;
  if (!from) {
    message =
      "When there’s no connection, a page that isn’t kept on this device leads here. The pages below are kept, and open without one.";
  } else if (online) {
    message = "You’re connected again, so it should open now.";
  } else {
    message =
      "You’re offline, and the page you opened wasn’t kept for reading without a connection. The pages below were, and open now.";
  }

  return (
    <>
      <p aria-live="polite" className="mt-5 text-[17px] leading-relaxed text-ink-muted">
        {message}
        {from ? (
          <span className="mt-2 block truncate text-[14px] text-ink-faint" title={from}>
            {from}
          </span>
        ) : null}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 max-sm:flex-col">
        {from ? (
          <button
            type="button"
            onClick={() => window.location.assign(from)}
            className={`${button} justify-center bg-ink font-semibold text-paper hover:bg-black active:bg-black`}
          >
            Try again
          </button>
        ) : null}
        {/*
          A plain link: offline, a full page load is what the saved copy answers.
          One style whatever the hash says, so nothing changes once it is read.
        */}
        <a
          href={HOME_HREF}
          className={`${button} justify-center border border-paper-line font-medium hover:bg-paper-sunk active:bg-paper-sunk`}
        >
          Go to the index
        </a>
      </div>
    </>
  );
}
