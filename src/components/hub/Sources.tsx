import { Wordmark } from "@/components/brand/BrandMark";
import { Kbd } from "@/components/primitives/Kbd";
import { XREFS_CREDIT } from "@/lib/xrefs/credit";
import { SITE } from "@/lib/site";
import { CHART_SOURCE } from "@/studies/revelation-chiasm/data/chiasm";

const link = "underline decoration-paper-line underline-offset-3 transition-colors hover:text-ink hover:decoration-ink-faint";

/** Every text and dataset, credited. */
export function Sources() {
  return (
    <footer id="sources" className="border-t border-paper-line bg-paper text-ink">
      <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-10 pt-14 pr-[188px] pb-12 pl-14">
        <div className="col-span-4">
          <h2 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] [font-stretch:110%]">Sources</h2>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-muted">
            Every text and dataset here is public domain or openly licensed, and credited wherever it appears.
          </p>
        </div>
        <dl className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-8 text-[14px] leading-relaxed">
          <div>
            <dt className="font-semibold">The Bible text</dt>
            <dd className="mt-1.5 text-ink-muted">
              King James Version, the standard 1769 text, from{" "}
              <a className={link} href="https://ebible.org/">
                eBible.org
              </a>
              . Public domain.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Cross references</dt>
            <dd className="mt-1.5 text-ink-muted">
              From{" "}
              <a className={link} href={XREFS_CREDIT.url}>
                OpenBible.info
              </a>
              , licensed{" "}
              <a className={link} href={XREFS_CREDIT.licenseUrl}>
                {XREFS_CREDIT.license}
              </a>
              ; adapted to KJV verse numbering and summarised by chapter.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Revelation&rsquo;s mirror</dt>
            <dd className="mt-1.5 text-ink-muted">
              {CHART_SOURCE.note} Distances are recounted from the KJV and every difference from the chart is listed in the
              study.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Designed for desktop</dt>
            <dd className="mt-1.5 text-ink-muted">
              {SITE.name} is built for screens at least {SITE.minDesktopWidth} pixels wide. Phones and tablets get a link to
              send to a computer and a scaled preview.
            </dd>
          </div>
        </dl>
        <div className="col-span-12 mt-14 flex items-center justify-between border-t border-paper-line pt-6 text-[13px] text-ink-muted">
          <Wordmark className="text-ink" />
          <span className="inline-flex items-center gap-2">
            Search from anywhere with <Kbd>⌘K</Kbd>
          </span>
        </div>
      </div>
    </footer>
  );
}
