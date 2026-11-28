import { Wordmark } from "@/components/brand/BrandMark";
import { stripMarkup } from "@/lib/bible/markup";
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
 * contributors, where to follow the project, and the dedication: the motto,
 * linked to Psalm 115:1 with the verse (read from the KJV data) as its title.
 * One row where it fits; in a narrower window the icons and copyright wrap
 * to a second row, right-aligned, so no link breaks mid-phrase. The Sources
 * section above it carries the credits.
 */
export function SiteFooter() {
  const ref = toReference(SITE.dedication.verse);
  const [verse] = readPassage(ref);
  return (
    <footer className="bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] pb-8 pl-8 pr-8 min-[720px]:pr-[136px] md:pl-14 lg:pr-[188px]">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-8 border-t border-paper-line py-[13.5px] text-[13px] text-ink-muted">
          <div className="flex items-center gap-7">
            <a href="#cover" aria-label={`${SITE.name}, back to the top`} className="rounded-control text-ink">
              <Wordmark className="text-[14px]" />
            </a>
            <nav aria-label="Footer">
              <ul className="flex items-center gap-[22px] whitespace-nowrap">
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
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
            <p className="whitespace-nowrap">
              © {SITE.copyrightYear} {SITE.name}. Free and open source.{" "}
              <a
                lang="la"
                className={`${link} italic`}
                href={readerHref(ref.book, ref.chapter, ref.verse)}
                title={`“${stripMarkup(verse.t)}” ${formatReference(ref)}`}
                aria-label={`${SITE.dedication.motto}: ${SITE.dedication.english}. ${formatReference(ref)}`}
              >
                {SITE.dedication.motto}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
