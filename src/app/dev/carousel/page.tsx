import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecentStudies } from "@/components/hub/RecentStudies";
import { getStudyOrThrow } from "@/studies/registry";

export const metadata: Metadata = {
  title: "Carousel preview",
  robots: { index: false, follow: false },
};

/** Five studies with finished drawings, planned ones included, in the order shown. */
const PREVIEW = ["revelation-chiasm", "pauls-journeys", "kings", "adam-to-christ", "alphabet-psalm"];

/**
 * Development-only review sheet: the hub's carousel with five studies, so
 * rotation and each plate's demo can be checked before five are live. Not
 * built for production.
 */
export default function CarouselPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-[1320px] pt-14 pr-[188px] pb-20 pl-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Carousel preview</h1>
        <p className="mt-1 mb-14 text-[14px] text-ink-muted">
          The hub&rsquo;s carousel with five studies, planned ones included. Only live studies appear on the hub.
        </p>
        <RecentStudies studies={PREVIEW.map(getStudyOrThrow)} label="Carousel preview" />
      </div>
    </main>
  );
}
