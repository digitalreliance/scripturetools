import { Wordmark } from "@/components/brand/BrandMark";
import { VerseText } from "@/components/bible/VerseText";
import { formatReference, toReference } from "@/lib/bible/reference";
import { readPassage } from "@/lib/bible/server";
import { readerHref } from "@/lib/routes";
import { GitHubMark, XMark } from "@/components/brand/SocialMarks";
import { CONTRIBUTING_URL, newIssueUrl, REPO_URL, xProfileUrl } from "@/lib/contribute";
import { SITE } from "@/lib/site";

const link = "transition-colors hover:text-ink";
const iconLink =
  "inline-flex size-9 items-center justify-center rounded-control transition-colors hover:bg-paper-sunk hover:text-ink";

/**
 * The hub's last line: the wordmark (back to the cover), the ways in for
 * contributors, and where to follow the project, then the dedication: the
 * motto and Psalm 115:1, read from the KJV data. The Sources section above it
 * carries the credits.
 */
export function SiteFooter() {
  const ref = toReference(SITE.dedication.verse);
  const [verse] = readPassage(ref);
  return (
    <footer className="bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] pr-[188px] pb-8 pl-14">
        <div className="flex h-16 items-center justify-between gap-8 border-t border-paper-line text-[13px] text-ink-muted">
          <div className="flex min-w-0 items-center gap-7">
            <a href="#cover" aria-label={`${SITE.name}, back to the top`} className="rounded-control text-ink">
              <Wordmark className="text-[14px]" />
            </a>
            <nav aria-label="Footer">
              <ul className="flex items-center gap-[22px]">
                <li>
                  <a className={link} href="#contents">
                    All studies
                  </a>
                </li>
                <li>
                  <a className={link} href="#sources">
                    Sources and licences
                  </a>
                </li>
                <li>
                  <a className={link} href={CONTRIBUTING_URL}>
                    Contribute
                  </a>
                </li>
                <li>
                  <a className={link} href={newIssueUrl("mistake", { page: `${SITE.url}/` })}>
                    Report a mistake
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {SITE.xHandle ? (
              <a className={iconLink} href={xProfileUrl(SITE.xHandle)} aria-label={`@${SITE.xHandle} on X`}>
                <XMark className="size-[15px]" />
              </a>
            ) : (
              // No account yet: the mark holds its place, says so, and goes nowhere.
              <span
                role="img"
                aria-label={`${SITE.name} on X, coming soon`}
                title="Coming soon"
                className="inline-flex size-9 cursor-default items-center justify-center text-ink-faint"
              >
                <XMark className="size-[15px]" />
              </span>
            )}
            <a className={iconLink} href={REPO_URL} aria-label={`${SITE.name} on GitHub`}>
              <GitHubMark />
            </a>
            <span aria-hidden className="mx-2.5 h-4 w-px bg-paper-line" />
            <p>
              © {SITE.copyrightYear} {SITE.name}. Free and open source.
            </p>
          </div>
        </div>
        <p className="mx-auto max-w-[72ch] text-center text-[13px] leading-[1.6] text-ink-muted">
          <span lang="la" className="font-medium tracking-[0.14em] text-ink uppercase">
            {SITE.dedication.motto}
          </span>
          <span aria-hidden className="mx-2">
            ·
          </span>
          &ldquo;
          <VerseText text={verse.t} />
          &rdquo;{" "}
          <a className={link} href={readerHref(ref.book, ref.chapter, ref.verse)}>
            {formatReference(ref)}
          </a>
        </p>
      </div>
    </footer>
  );
}
