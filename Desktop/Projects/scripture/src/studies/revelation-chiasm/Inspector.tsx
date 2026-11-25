import { BookOpenText, Footprints } from "lucide-react";
import { Passage } from "@/components/bible/Passage";
import { InspectorTabs } from "@/components/shell/controls";
import { Field, PanelSection, ToolButton } from "@/components/shell/parts";
import { levelColor } from "./colors";
import { displayLetter } from "./data/chiasm";
import { distanceSentence, formatNumber, longRef, revRef } from "./format";
import type { LevelView, MemberView, MirrorPayload, MirrorVerse } from "./types";

function MemberCard({
  member,
  level,
  verses,
  onShowInText,
}: {
  member: MemberView;
  level: LevelView;
  verses: MirrorVerse[];
  onShowInText: () => void;
}) {
  const passage = verses.slice(member.span.first - 1, member.span.last).map((v) => ({ chapter: v.c, n: v.v, t: v.t, p: v.p }));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
          <span className="mr-2 tabular" style={{ color: levelColor(level.colorIndex) }}>
            {displayLetter(member)}
          </span>
          {longRef(member.ref)}
        </h3>
      </div>
      <p className="mt-0.5 text-ui text-s-muted">{distanceSentence(member.distance, member.prime)}</p>
      <div
        className="mt-3 border-l-2 pl-3 font-scripture text-[15.5px] leading-[1.7] text-s-ink"
        style={{ borderColor: levelColor(level.colorIndex), ["--scripture-highlight" as string]: `color-mix(in oklab, ${levelColor(level.colorIndex)} 18%, transparent)` }}
      >
        <Passage verses={passage} highlight={member.phrases} showNumbers={passage.length > 1} />
      </div>
      <ToolButton variant="ghost" icon={<BookOpenText aria-hidden />} onClick={onShowInText} className="mt-2 -ml-2.5 text-s-muted hover:text-s-ink">
        Show in the text
      </ToolButton>
    </div>
  );
}

function PairPanel({
  level,
  payload,
  onShowInText,
  onWalk,
}: {
  level: LevelView | undefined;
  payload: MirrorPayload;
  onShowInText: (half: "first" | "second") => void;
  onWalk: () => void;
}) {
  if (!level) {
    return (
      <div className="px-4 py-8">
        <h2 className="text-[15px] font-semibold">Pick a pair</h2>
        <p className="mt-2 text-ui leading-relaxed text-s-muted">
          Choose any level in the outline or on the canvas to read both of its passages side by side. Or walk the whole
          structure, one level at a time, from the first verse to the centre.
        </p>
        <ToolButton variant="outline" icon={<Footprints aria-hidden />} onClick={onWalk} className="mt-4">
          Walk to the centre
        </ToolButton>
      </div>
    );
  }
  const { delta } = level.symmetry;
  const discrepancies = payload.discrepancies.filter((d) => d.letter === level.letter);
  const notes = payload.notes.filter((n) => n.letter === level.letter);
  return (
    <div>
      <PanelSection>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-[5px] px-1.5 text-[12px] font-bold text-white tabular"
            style={{ backgroundColor: levelColor(level.colorIndex) }}
          >
            {level.letter}
          </span>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{level.theme}</h2>
        </div>
        <p className="mt-1.5 text-ui text-s-muted">
          {level.isCenter ? "The centre of the book" : `Level ${level.level} of ${payload.levels.length}, counting inward from the outermost pair`}
        </p>
      </PanelSection>
      <PanelSection title="First half">
        <MemberCard member={level.first} level={level} verses={payload.verses} onShowInText={() => onShowInText("first")} />
      </PanelSection>
      <PanelSection title="Its mirror">
        <MemberCard member={level.second} level={level} verses={payload.verses} onShowInText={() => onShowInText("second")} />
      </PanelSection>
      <PanelSection title="Symmetry">
        <Field label="Before the centre">{formatNumber(level.symmetry.before)} verses</Field>
        <Field label="After the centre">{formatNumber(level.symmetry.after)} verses</Field>
        <Field label="Difference">
          {delta === 0 ? "None, an exact mirror" : `${formatNumber(Math.abs(delta))} ${Math.abs(delta) === 1 ? "verse" : "verses"}`}
        </Field>
        {discrepancies.map((d) => (
          <p key={`${d.letter}${d.prime}`} className="mt-2 text-[12px] leading-relaxed text-s-muted">
            The chart prints {d.printed} for {displayLetter(d)}; counting KJV verses gives {d.computed.min === d.computed.max ? d.computed.min : `${d.computed.min}–${d.computed.max}`}.
          </p>
        ))}
        {notes.map((n) => (
          <p key={`${n.letter}${n.prime}`} className="mt-2 text-[12px] leading-relaxed text-s-muted">
            {displayLetter(n)}: {n.note}
          </p>
        ))}
      </PanelSection>
    </div>
  );
}

function AboutPanel({ payload, onShowWelcome }: { payload: MirrorPayload; onShowWelcome: () => void }) {
  const { stats } = payload;
  return (
    <div className="text-ui leading-relaxed">
      <PanelSection title="A book built like a mirror">
        <div className="space-y-3 text-s-ink">
          <p>
            A chiasm is a pattern where ideas are stated in one order and then repeated in reverse: A, B, C, then C, B, A.
            Ancient writers used it to frame a text around its centre, so the middle carries the weight.
          </p>
          <p>
            This chart reads all of Revelation that way: 51 pairs of passages, from “things which must shortly come to pass”
            (1:1) and “Surely I come quickly” (22:20) inward to the dragon cast out of heaven (12:9) and the salvation
            announced in the next verse (12:10).
          </p>
        </div>
      </PanelSection>
      <PanelSection title="How the distances are counted">
        <p className="text-s-ink">
          Revelation&rsquo;s 404 verses are numbered in order. A passage in the first half is measured in verses before 12:9;
          its mirror, in verses after 12:10. If the book were a perfect mirror, every pair would match.
        </p>
        <div className="mt-3">
          <Field label="Correlation">{stats.correlation.toFixed(4)}</Field>
          <Field label="Average difference">{formatNumber(stats.meanAbsDelta)} verses</Field>
          <Field label="Within three verses">
            {stats.withinThree} of {stats.levels} levels
          </Field>
        </div>
      </PanelSection>
      <PanelSection title="Where the chart differs">
        <p className="text-s-muted">Numbers printed on the chart that differ from counting KJV verses:</p>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-[12px] text-s-muted">
              <th className="py-1 font-medium">Passage</th>
              <th className="py-1 font-medium">Printed</th>
              <th className="py-1 text-right font-medium">KJV count</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {payload.discrepancies.map((d) => (
              <tr key={`${d.letter}${d.prime}`} className="border-t border-s-line">
                <td className="py-1.5">
                  {displayLetter(d)} {revRef(d.ref)}
                </td>
                <td className="py-1.5">{d.printed}</td>
                <td className="py-1.5 text-right">{d.computed.min === d.computed.max ? d.computed.min : `${d.computed.min}–${d.computed.max}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-3 space-y-1.5 text-s-muted">
          {payload.notes.map((n) => (
            <li key={`${n.letter}${n.prime}`}>
              <span className="font-medium text-s-ink">{displayLetter(n)}</span> {n.note}
            </li>
          ))}
        </ul>
      </PanelSection>
      <PanelSection title="Source">
        <p className="text-s-ink">{payload.source.note}</p>
        <p className="mt-2 text-s-muted">
          Labels quote the King James Version (1769 text, public domain); the chart&rsquo;s own wording is kept in the data
          for comparison.
        </p>
      </PanelSection>
      <PanelSection title="Keyboard">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {[
            ["1 to 4", "Switch view"],
            ["↑ ↓", "Previous or next level"],
            ["F", "Fold the arcs at the centre"],
            ["Space", "Walk to the centre, or pause"],
            ["Esc", "Stop, or clear the selection"],
            ["[ ]", "Hide or show the side panels"],
          ].map(([key, action]) => (
            <div key={key} className="contents">
              <dt className="font-medium text-s-ink tabular">{key}</dt>
              <dd className="text-s-muted">{action}</dd>
            </div>
          ))}
        </dl>
        <ToolButton variant="outline" onClick={onShowWelcome} className="mt-4">
          Show the introduction
        </ToolButton>
      </PanelSection>
    </div>
  );
}

export function Inspector({
  payload,
  level,
  tab,
  onTab,
  onShowInText,
  onWalk,
  onShowWelcome,
}: {
  payload: MirrorPayload;
  level: LevelView | undefined;
  tab: string;
  onTab: (tab: string) => void;
  onShowInText: (half: "first" | "second") => void;
  onWalk: () => void;
  onShowWelcome: () => void;
}) {
  return (
    <InspectorTabs
      value={tab}
      onValueChange={onTab}
      label="Inspector"
      tabs={[
        { value: "pair", label: "Pair", meta: level ? level.letter : undefined, content: <PairPanel level={level} payload={payload} onShowInText={onShowInText} onWalk={onWalk} /> },
        { value: "about", label: "About", content: <AboutPanel payload={payload} onShowWelcome={onShowWelcome} /> },
      ]}
    />
  );
}
