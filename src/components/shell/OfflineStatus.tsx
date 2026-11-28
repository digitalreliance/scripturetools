"use client";

import { CloudOff } from "lucide-react";
import { useOnline } from "@/lib/offline/client";

/**
 * The first item in a study's status bar while the device has no connection.
 * The study keeps working: it was saved for offline reading, and everything
 * it shows is already in the page. Only links out (GitHub) need the network.
 */
export function OfflineStatus() {
  const online = useOnline();
  return (
    <>
      {online ? null : (
        <span
          title="You’re offline. This study keeps working; links to GitHub need a connection."
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-s-ink"
        >
          <CloudOff aria-hidden className="size-3.5" />
          Offline
        </span>
      )}
      {/* Out of the flow, so it takes no room in the bar. */}
      <span aria-live="polite" className="sr-only">
        {online ? "" : "You’re offline. This study keeps working."}
      </span>
    </>
  );
}
