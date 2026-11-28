import Link from "next/link";
import { Wordmark } from "@/components/brand/BrandMark";
import { SearchButton } from "@/components/command/SearchButton";
import { SiteContributeMenu } from "@/components/shell/ContributeMenu";
import { studyHref } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { CrossReferenceArcs } from "./CrossReferenceArcs";

/** Every control in the bar is 36 px tall on the 8 px control radius; links get the same hit area. */
const navLink =
  "inline-flex h-9 items-center rounded-control px-3 text-cover-muted transition-colors duration-120 hover:text-cover-ink active:text-cover-ink max-sm:px-2.5";

/**
 * The cover: dark calfskin with a blind-tooled border, the promise of the
 * product, and the whole Bible's cross references as the opening figure.
 */
export function Cover() {
  return (
    <header id="cover" className="theme-cover relative isolate overflow-hidden bg-cover text-cover-ink">
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light" />
      <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[22px] border border-cover-line max-sm:inset-2 max-sm:rounded-[18px]" />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 md:px-14">
        <nav aria-label="Main" className="flex h-[76px] items-center justify-between gap-3 max-sm:h-16">
          <Link href="/" className="inline-flex shrink-0 items-center rounded-control whitespace-nowrap text-cover-ink">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1 text-[14px] max-sm:gap-0.5">
            {/* On the narrowest phones, "Browse studies" under the headline does this job. */}
            <a href="#contents" className={`${navLink} max-[359px]:hidden`}>
              Studies
            </a>
            {/* In a narrow window, Sources waits in the footer. */}
            <a href="#sources" className={`${navLink} max-md:hidden`}>
              Sources
            </a>
            <SiteContributeMenu tone="cover" collapse />
            <span aria-hidden className="mx-3 h-5 w-px bg-cover-line max-sm:hidden" />
            <SearchButton tone="cover" collapse />
          </div>
        </nav>

        <div className="pt-[3.5vh] pb-8">
          <h1 className="max-w-[15ch] text-[clamp(40px,11vw,56px)] leading-[0.95] md:text-[clamp(56px,6vw,88px)] font-semibold tracking-[-0.035em] text-balance [font-stretch:118%]">
            {SITE.tagline}
          </h1>
          <p className="mt-6 max-w-[54ch] text-[19px] leading-[1.6] text-cover-muted max-sm:text-[17px]">
            Interactive maps, diagrams, timelines and symbols, built on the King James text. Each study is a small
            instrument for seeing one pattern in Scripture clearly.
          </p>
          {/* On a phone the two buttons stack, full width, as one column of choices. */}
          <div className="mt-7 flex flex-wrap gap-3 max-sm:flex-col">
            <Link
              href={studyHref("revelation-chiasm")}
              className="inline-flex h-11 items-center justify-center rounded-control bg-cover-ink px-5 text-[15px] font-semibold text-cover transition-colors hover:bg-white active:bg-white"
            >
              Open Revelation&rsquo;s mirror
            </Link>
            <a
              href="#contents"
              className="inline-flex h-11 items-center justify-center rounded-control border border-cover-line px-5 text-[15px] font-medium text-cover-ink transition-colors hover:border-cover-muted/60 active:border-cover-muted/60"
            >
              Browse studies
            </a>
          </div>
          <p className="mt-6 text-[13px] text-cover-muted">
            <span lang="la" className="font-medium tracking-[0.14em] uppercase">
              {SITE.dedication.motto}
            </span>
            <span aria-hidden className="mx-2">
              ·
            </span>
            {SITE.dedication.english}
          </p>
        </div>

        <div className="pb-14">
          <CrossReferenceArcs />
        </div>
      </div>
    </header>
  );
}
