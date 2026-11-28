import { Suspense } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { SITE } from "@/lib/site";
import { STUDIES } from "@/studies/registry";
import styles from "./DeviceGate.module.css";
import { GateActions } from "./GateActions";
import { GateStudy, type GateStudyEntry } from "./GateStudy";
import { PreviewBar } from "./PreviewBar";

/** Arcs on the laptop's screen, in canon colours. */
const LAPTOP_ARCS = [
  { d: "M34 88a18 18 0 0 1 36 0", color: "var(--color-canon-law)" },
  { d: "M48 88a34 34 0 0 1 68 0", color: "var(--color-canon-prophets)" },
  { d: "M82 88a22 22 0 0 1 44 0", color: "var(--color-canon-gospels)" },
  { d: "M40 88a50 50 0 0 1 100 0", color: "var(--color-canon-wisdom)" },
];

/** Arcs on the tablet's screen. */
const TABLET_ARCS = [
  { d: "M162 112a14 14 0 0 1 28 0", color: "var(--color-canon-history)" },
  { d: "M172 112a18 18 0 0 1 36 0", color: "var(--color-canon-epistles)" },
  { d: "M184 112a10 10 0 0 1 20 0", color: "var(--color-canon-revelation)" },
];

const LIVE_STUDIES: GateStudyEntry[] = STUDIES.flatMap((s) =>
  s.status === "live" && s.href ? [{ href: s.href, title: s.title, summary: s.summary }] : [],
);

/** A laptop with a tablet standing in front of it, each showing arcs. */
function Devices() {
  return (
    <svg
      viewBox="0 0 232 136"
      aria-hidden
      className="mb-10 w-full max-w-[280px] self-center short-landscape:sticky short-landscape:top-8 short-landscape:mt-4 short-landscape:mb-0 short-landscape:max-w-[320px]"
    >
      <rect x="14" y="8" width="150" height="98" rx="8" fill="none" stroke="var(--color-cover-line)" strokeWidth="2" />
      <path d="M2 112h174l-8 10H10z" fill="var(--color-cover-raised)" stroke="var(--color-cover-line)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 88h122" stroke="var(--color-cover-muted)" strokeWidth="1.5" strokeLinecap="round" />
      <g fill="none" strokeWidth="2" strokeLinecap="round">
        {LAPTOP_ARCS.map((arc) => (
          <path key={arc.d} d={arc.d} stroke={arc.color} pathLength={1} className={styles.arc} />
        ))}
      </g>
      <rect x="150" y="36" width="72" height="96" rx="9" fill="var(--color-cover)" stroke="var(--color-cover-line)" strokeWidth="2" />
      <path d="M160 112h52" stroke="var(--color-cover-muted)" strokeWidth="1.5" strokeLinecap="round" />
      <g fill="none" strokeWidth="2" strokeLinecap="round">
        {TABLET_ARCS.map((arc) => (
          <path key={arc.d} d={arc.d} stroke={arc.color} pathLength={1} className={`${styles.arc} ${styles.late}`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The screen shown instead of the app where it can't work. It is part of
 * every page's static HTML but hidden by default; globals.css reveals it on
 * phones (marked before first paint by the boot script), and in any window
 * narrower than SITE.minWindowWidth, where it asks for a wider one. Its copy
 * and actions change to match. Both elements below must stay direct children
 * of <body>.
 */
export function DeviceGate() {
  return (
    <>
      <div
        data-device-gate
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-gate-title"
        aria-describedby="device-gate-body"
        className="theme-cover min-h-dvh bg-cover px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-cover-ink short-landscape:px-[max(2rem,env(safe-area-inset-left))] short-landscape:pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-sm flex-col short-landscape:max-w-3xl">
          <div className="flex items-center gap-2 text-[15px] font-semibold [font-stretch:112%]">
            <BrandMark className="size-[22px]" />
            {SITE.name}
          </div>

          <div className="flex flex-1 flex-col justify-center py-10 short-landscape:grid short-landscape:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] short-landscape:items-start short-landscape:gap-10 short-landscape:py-6">
            <Devices />

            <div>
              <h1 id="device-gate-title" className="text-[34px] leading-[1.08] font-semibold tracking-[-0.02em] [font-stretch:118%]">
                <span className="hidden phone:inline">Made for a larger screen</span>
                <span className="phone:hidden">Make the window wider</span>
              </h1>
              <p id="device-gate-body" className="mt-4 text-[17px] leading-relaxed text-cover-muted">
                <span className="hidden phone:inline">
                  The maps, diagrams and timelines in {SITE.name} need the room of a tablet or a computer. Send yourself
                  this link and open it there.
                </span>
                <span className="phone:hidden">
                  The maps, diagrams and timelines in {SITE.name} need a window at least {SITE.minWindowWidth} pixels
                  wide. Widen this one and everything comes back as you left it.
                </span>
              </p>

              <div className="hidden phone:block">
                <Suspense fallback={null}>
                  <GateStudy studies={LIVE_STUDIES} />
                </Suspense>
                <div className="mt-8">
                  <GateActions />
                </div>
              </div>
            </div>
          </div>

          <p className="hidden text-[13px] leading-relaxed text-cover-muted phone:block">
            The preview shows the full desktop layout, scaled to fit your screen.
          </p>
        </div>
      </div>
      <PreviewBar />
    </>
  );
}
