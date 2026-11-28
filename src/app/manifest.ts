import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Lets a tablet keep Scripture Tools on its home screen and open it full
 * screen, without the browser's bars, which leaves a study more room. Each
 * study's Share button stands in for the address bar it no longer has.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141210",
    theme_color: "#141210",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
