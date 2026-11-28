import { offlineManifest } from "@/lib/offline/manifest";

/**
 * The list the service worker (public/sw.js) reads to know what to keep for
 * offline reading. Prerendered at build time from the registry.
 */
export function GET() {
  return Response.json(offlineManifest());
}
