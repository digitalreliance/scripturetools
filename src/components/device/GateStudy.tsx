"use client";

import { usePathname } from "next/navigation";

export interface GateStudyEntry {
  href: string;
  title: string;
  summary: string;
}

/**
 * On a study's page, the gate says which study the link opens, so a link
 * shared to a phone still tells its reader what is waiting for them.
 */
export function GateStudy({ studies }: { studies: readonly GateStudyEntry[] }) {
  const pathname = usePathname();
  const study = studies.find((s) => s.href === pathname);
  if (!study) return null;
  return (
    <div className="mt-6 rounded-panel border border-cover-line bg-cover-raised px-4 py-3.5">
      <p className="text-[13px] text-cover-muted">This link opens</p>
      <p className="mt-1 text-[17px] leading-snug font-semibold tracking-[-0.01em] [font-stretch:108%]">{study.title}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-cover-muted">{study.summary}</p>
    </div>
  );
}
