import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Datasets in public/data change only when we redeploy. Let browsers reuse
  // them for an hour and serve stale copies while revalidating for a day.
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // The offline service worker (public/sw.js). Browsers check it for a
        // new version on every visit; it may fetch from this site only.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      // Tailwind compiles the global stylesheet. CSS Modules stay out of this
      // rule: its `as: "*.css"` would turn them into global CSS and empty
      // their class maps.
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
