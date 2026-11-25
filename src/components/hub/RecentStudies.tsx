import Link from "next/link";
import { formatIsoDate } from "@/lib/dates";
import { getCategory, lastChanged, type Study } from "@/studies/registry";
import { StudyIllustration } from "./illustrations";
import { Status } from "./Status";
import { StudyCarousel } from "./StudyCarousel";

/** The day the study arrived, or last changed for readers. */
function Dated({ study }: { study: Study }) {
  const day = lastChanged(study);
  if (!day) return null;
  return (
    <time dateTime={day} className="text-[12px] text-ink-muted">
      {study.updated ? "Updated" : "Added"} {formatIsoDate(day)}
    </time>
  );
}

/** Everything beside the plate: status, title, summary, facts, the way in. */
function SlideText({ study }: { study: Study }) {
  return (
    <>
      <p className="flex items-center gap-3">
        <Status live={study.status === "live"} />
        <span className="text-[12px] text-ink-muted">{getCategory(study.category).title}</span>
        <Dated study={study} />
      </p>
      <h2 className="mt-4 text-[50px] leading-[0.98] font-semibold tracking-[-0.03em] text-balance [font-stretch:115%]">
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
      {study.href ? (
        <Link
          href={study.href}
          className="mt-8 inline-flex h-11 items-center rounded-control bg-ink px-5 text-[15px] font-semibold text-paper transition-colors hover:bg-black"
        >
          Open study
        </Link>
      ) : null}
    </>
  );
}

/**
 * The newest live studies under the cover, one large plate at a time, most
 * recently released or updated first. Each plate plays its demo as it is
 * presented. The drawings render here on the server; the carousel only
 * stacks and shows them.
 */
export function RecentStudies({ studies, label = "New and updated studies" }: { studies: Study[]; label?: string }) {
  if (studies.length === 0) return null;
  return (
    <StudyCarousel
      label={label}
      slides={studies.map((study) => ({
        id: study.slug,
        title: study.title,
        href: study.href,
        figure: (
          <StudyIllustration id={study.illustration} palette={study.palette} variant="plate" className="block h-auto w-full" />
        ),
        text: <SlideText study={study} />,
      }))}
    />
  );
}
