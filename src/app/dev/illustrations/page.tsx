import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudyIllustration } from "@/components/hub/illustrations";
import { STUDIES } from "@/studies/registry";

export const metadata: Metadata = {
  title: "Illustration gallery",
  robots: { index: false, follow: false },
};

/**
 * Development-only review sheet: every study illustration at plate and thumb
 * size on its own palette. Hover a row to play its animation. Not built for
 * production.
 */
export default function IllustrationGallery() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-dvh bg-paper px-10 py-10 text-ink">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Illustration gallery</h1>
      <p className="mt-1 text-[14px] text-ink-muted">Every study illustration at plate and thumb size. Hover a row to play its animation.</p>
      <ul className="mt-8 grid grid-cols-2 gap-x-10 gap-y-8">
        {STUDIES.map((study) => (
          <li key={study.slug} id={study.illustration} className="illo-host flex items-start gap-5 rounded-[12px] p-3 hover:bg-paper-sunk">
            <div className="w-[420px] shrink-0 overflow-hidden rounded-[10px] border border-paper-line">
              <StudyIllustration id={study.illustration} palette={study.palette} variant="plate" className="block h-auto w-full" />
            </div>
            <div className="min-w-0">
              <div className="w-[120px] overflow-hidden rounded-[8px] border border-paper-line">
                <StudyIllustration id={study.illustration} palette={study.palette} variant="thumb" className="block h-auto w-full" />
              </div>
              <p className="mt-3 text-[14px] font-semibold">{study.title}</p>
              <p className="text-[12px] text-ink-muted">{study.illustration}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
