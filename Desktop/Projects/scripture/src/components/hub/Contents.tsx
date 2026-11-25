import Link from "next/link";
import { SearchButton } from "@/components/command/SearchButton";
import { BOOKS } from "@/lib/bible/canon";
import { cn } from "@/lib/cn";
import { getCategory, type Category, type Study } from "@/studies/registry";
import { StudyIllustration } from "./illustrations";

export interface ContentsGroup {
  category: Category;
  studies: Study[];
}

const bookNames = (books: Study["books"]) =>
  books === "all" ? "All 66 books" : books.map((id) => BOOKS.find((b) => b.id === id)?.name ?? id).join(", ");

function Status({ live }: { live: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
      <span aria-hidden className={cn("size-2 rounded-full", live ? "bg-ink" : "border border-ink-muted")} />
      {live ? "Live" : "Planned"}
    </span>
  );
}

/** The featured live study, shown as a plate under the cover. */
function FeaturedPlate({ study }: { study: Study }) {
  return (
    <section aria-labelledby="featured-title" className="illo-host grid grid-cols-12 items-center gap-x-12">
      <Link
        href={study.href ?? "#"}
        tabIndex={-1}
        aria-hidden
        className="col-span-7 block overflow-hidden rounded-plate border border-paper-line bg-paper-raised"
      >
        <StudyIllustration id={study.illustration} palette={study.palette} variant="plate" className="block h-auto w-full" />
      </Link>
      <div className="col-span-5">
        <p className="flex items-center gap-3">
          <Status live />
          <span className="text-[12px] text-ink-muted">{getCategory(study.category).title}</span>
        </p>
        <h2 id="featured-title" className="mt-4 text-[50px] leading-[0.98] font-semibold tracking-[-0.03em] [font-stretch:115%]">
          {study.title}
        </h2>
        <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-ink-muted">{study.summary}</p>
        {study.facts ? (
          <dl className="mt-7 grid grid-cols-3 gap-6 border-t border-paper-line pt-5 text-[13px]">
            {study.facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-ink-muted">{label}</dt>
                <dd className="mt-1 leading-snug font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <Link
          href={study.href ?? "#"}
          className="mt-8 inline-flex h-11 items-center rounded-control bg-ink px-5 text-[15px] font-semibold text-paper transition-colors hover:bg-black"
        >
          Open study
        </Link>
      </div>
    </section>
  );
}

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

/** The pages: the featured study, then the table of contents by category. */
export function Contents({ groups, featured }: { groups: ContentsGroup[]; featured?: Study }) {
  const live = groups.reduce((n, g) => n + g.studies.filter((s) => s.status === "live").length, 0);
  const total = groups.reduce((n, g) => n + g.studies.length, 0);
  return (
    <main id="contents" className="bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] pt-20 pr-[188px] pb-10 pl-14">
        {featured ? <FeaturedPlate study={featured} /> : null}

        <div className="mt-24 mb-2 flex items-end justify-between gap-10">
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
            className="grid scroll-mt-10 grid-cols-12 gap-x-10 border-t border-paper-line pt-9 pb-8"
          >
            <div className="col-span-4">
              <h3 id={`${category.id}-title`} className="text-[24px] leading-tight font-semibold tracking-[-0.02em] [font-stretch:110%]">
                {category.title}
              </h3>
              <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-muted">{category.description}</p>
            </div>
            <ul className="col-span-8 divide-y divide-paper-line">
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
