import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/BrandMark";
import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { HOME_HREF, studyHref } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { liveStudies } from "@/studies/registry";

export const metadata: Metadata = {
  title: "Offline",
  description: `The pages ${SITE.name} keeps on your device for reading without a connection.`,
  robots: { index: false },
};

/**
 * Shown by the service worker, offline, in place of a page it hasn't kept,
 * with the address the reader was opening in the hash. It lists what is kept:
 * the same pages as the worker's list (src/lib/offline/manifest.ts), so every
 * link here opens offline. Plain links, not <Link>: offline, a full page load
 * is what the saved copy answers.
 */
export default function OfflinePage() {
  const kept = [
    { href: HOME_HREF, title: "The index", summary: "Every study, and where the texts and data come from." },
    ...liveStudies().map((study) => ({ href: studyHref(study.slug), title: study.title, summary: study.summary })),
  ];

  return (
    <main className="flex min-h-dvh flex-col bg-paper px-14 py-10 text-ink max-sm:px-5 max-sm:py-6">
      <a href={HOME_HREF} aria-label={`${SITE.name}, the index`} className="self-start rounded-control">
        <Wordmark />
      </a>
      <div className="my-auto max-w-[56ch] py-12">
        <p className="text-[14px] text-ink-muted">Offline</p>
        <h1 className="mt-3 text-[48px] leading-[1] font-semibold tracking-[-0.03em] text-balance [font-stretch:115%] max-sm:text-[36px]">
          This page isn&rsquo;t saved on this device.
        </h1>
        <OfflineNotice />

        <section aria-labelledby="kept" className="mt-14">
          <h2 id="kept" className="text-[14px] font-medium text-ink-muted">
            Kept for reading offline
          </h2>
          <ul className="mt-3 border-t border-paper-line">
            {kept.map((page) => (
              <li key={page.href} className="border-b border-paper-line">
                <a
                  href={page.href}
                  className="block py-3.5 transition-colors hover:bg-paper-sunk active:bg-paper-sunk pointer-coarse:py-4"
                >
                  <span className="block text-[16px] font-medium">{page.title}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-ink-muted">{page.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
