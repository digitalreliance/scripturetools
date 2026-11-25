import type { Metadata } from "next";
import { Contents, type ContentsGroup } from "@/components/hub/Contents";
import { Cover } from "@/components/hub/Cover";
import { SiteFooter } from "@/components/hub/SiteFooter";
import { Sources } from "@/components/hub/Sources";
import { ThumbIndex } from "@/components/hub/ThumbIndex";
import { SITE } from "@/lib/site";
import { CATEGORIES, recentStudies, studiesIn } from "@/studies/registry";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: ${SITE.tagline}` },
  description: SITE.description,
};

export default function HomePage() {
  const groups: ContentsGroup[] = CATEGORIES.map((category) => ({
    category,
    studies: studiesIn(category.id)
      .filter((s) => s.status === "live" || SITE.showPlannedStudies)
      .toSorted((a, b) => Number(b.status === "live") - Number(a.status === "live")),
  })).filter((group) => group.studies.length > 0);

  const recent = recentStudies(SITE.recentStudyCount);

  return (
    <>
      <Cover />
      <Contents groups={groups} recent={recent} />
      <Sources />
      <SiteFooter />
      <ThumbIndex tabs={groups.map((g) => ({ id: g.category.id, label: g.category.tab, count: g.studies.length }))} />
    </>
  );
}
