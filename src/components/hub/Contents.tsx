import Link from "next/link";
import { SearchButton } from "@/components/command/SearchButton";
import { BOOKS } from "@/lib/bible/canon";
import { cn } from "@/lib/cn";
import type { Category, Study } from "@/studies/registry";
import { StudyIllustration } from "./illustrations";
import { RecentStudies } from "./RecentStudies";
import { Status } from "./Status";

export interface ContentsGroup {
  category: Category;
  studies: Study[];
}

const bookNames = (books: Study["books"]) =>
  books === "all" ? "All 66 books" : books.map((id) => BOOKS.find((b) => b.id === id)?.name ?? id).join(", ");

function StudyRow({ study }: { study: Study }) {
  const live = study.status === "live" && study.href;
  const body = (
    <>
      <div className={cn("w-[120px] shrink-0 overflow-hidden rounded-[8px] border border-paper-line", !live && "opacity-80")}>
        <StudyIllustration id={study.illustration} palette={study.palette} variant="thumb" className="block h-auto w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className={cn("text-[16px] font-semibold tracking-[-0.01em]", !live && "text-ink/80")}>{study.title}</h4>
          <Status live={Boolean(live)} />
        </div>
        <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-ink-muted">{study.summary}</p>
        <p className="mt-1.5 text-[12px] text-ink-faint">{bookNames(study.books)}</p>
      </div>
    </>
  );
  return (
    <li>
      {live ? (
        <Link href={study.href!} className="illo-host -mx-3 flex items-start gap-5 rounded-[12px] px-3 py-4 transition-colors hover:bg-paper-sunk">
          {body}
        </Link>
      ) : (
        <div className="flex items-start gap-5 py-4">{body}</div>
      )}
    </li>
  );
}

/** The pages: the newest studies in a carousel, then the table of contents by category. */
export function Contents({ groups, recent }: { groups: ContentsGroup[]; recent: Study[] }) {
  const live = groups.reduce((n, g) => n + g.studies.filter((s) => s.status === "live").length, 0);
  const total = groups.reduce((n, g) => n + g.studies.length, 0);
  return (
    <main id="contents" className="bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] pt-20 pb-10 pl-8 pr-8 min-[720px]:pr-[136px] md:pl-14 lg:pr-[188px]">
        <RecentStudies studies={recent} />

        <div className="mt-24 mb-2 flex items-end justify-between gap-10 max-md:flex-col max-md:items-start max-md:gap-5">
          <div>
            <h2 className="text-[40px] leading-none font-semibold tracking-[-0.03em] [font-stretch:115%]">Contents</h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-muted">
              Every study, grouped by what it helps you see. {live === 1 ? "One is live" : `${live} are live`} and{" "}
              {total - live} more are planned; new ones appear here as they are built.
            </p>
          </div>
          <SearchButton />
        </div>

        {groups.map(({ category, studies }) => (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-title`}
            className="grid scroll-mt-10 grid-cols-1 gap-y-3 border-t border-paper-line pt-9 pb-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0"
          >
            <div className="lg:col-span-4">
              <h3 id={`${category.id}-title`} className="text-[24px] leading-tight font-semibold tracking-[-0.02em] [font-stretch:110%]">
                {category.title}
              </h3>
              <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-muted lg:max-w-[34ch]">{category.description}</p>
            </div>
            <ul className="divide-y divide-paper-line lg:col-span-8">
              {studies.map((study) => (
                <StudyRow key={study.slug} study={study} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
