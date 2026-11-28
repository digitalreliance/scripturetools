import { XREFS_CREDIT } from "@/lib/xrefs/credit";
import { SITE } from "@/lib/site";
import { CHART_SOURCE } from "@/studies/revelation-chiasm/data/chiasm";

const link = "underline decoration-paper-line underline-offset-3 transition-colors hover:text-ink hover:decoration-ink-faint";

/** Every text and dataset, credited. */
export function Sources() {
  return (
    <section id="sources" aria-labelledby="sources-title" className="border-t border-paper-line bg-paper text-ink">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-y-8 pt-14 pb-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0 pl-8 pr-8 min-[720px]:pr-[136px] md:pl-14 lg:pr-[188px]">
        <div className="lg:col-span-4">
          <h2 id="sources-title" className="text-[24px] leading-tight font-semibold tracking-[-0.02em] [font-stretch:110%]">Sources</h2>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-muted">
            Every text and dataset here is public domain or openly licensed, and credited wherever it appears.
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-x-10 gap-y-8 text-[14px] leading-relaxed sm:grid-cols-2 lg:col-span-8">
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
            <dt className="font-semibold">Made for computers and tablets</dt>
            <dd className="mt-1.5 text-ink-muted">
              {SITE.name} works on a computer or a tablet, an iPad included, by mouse, trackpad, keyboard or touch. Phones
              get a link to send to a bigger screen, and a scaled preview.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
