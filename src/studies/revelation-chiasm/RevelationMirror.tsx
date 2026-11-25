"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChartScatter, FoldHorizontal, Footprints, Pause, Rainbow, Rows3, X } from "lucide-react";
import { Segmented, type SegmentedItem } from "@/components/shell/controls";
import { StatusItem, ToolButton, ToolbarDivider } from "@/components/shell/parts";
import { StudyShell } from "@/components/shell/StudyShell";
import { cn } from "@/lib/cn";
import { useHashParam } from "@/lib/hooks/use-hash-param";
import type { StudyPalette } from "@/studies/palettes";
import { formatNumber, revRef } from "./format";
import { Inspector } from "./Inspector";
import styles from "./mirror.module.css";
import { Outline } from "./Outline";
import type { LevelView, MirrorPayload, MirrorView } from "./types";
import { ArcsView } from "./views/ArcsView";
import { ChartView } from "./views/ChartView";
import { SymmetryView } from "./views/SymmetryView";
import { TextView } from "./views/TextView";

const VIEWS: readonly SegmentedItem<MirrorView>[] = [
  { value: "chart", label: "Chart", icon: <Rows3 aria-hidden />, hint: "Chart (1)" },
  { value: "arcs", label: "Arcs", icon: <Rainbow aria-hidden />, hint: "Arcs (2)" },
  { value: "symmetry", label: "Symmetry", icon: <ChartScatter aria-hidden />, hint: "Symmetry (3)" },
  { value: "text", label: "Text", icon: <BookOpen aria-hidden />, hint: "Text (4)" },
];
const VIEW_KEYS = VIEWS.map((v) => v.value);
const WELCOME_KEY = "scripture:revelation-chiasm:welcome:v1";
const WALK_STEP_MS = 1200;

const isView = (value: string | null): value is MirrorView => VIEW_KEYS.includes(value as MirrorView);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** The level whose passage contains a verse, or else the nearest one. */
function levelForOrdinal(levels: LevelView[], ordinal: number): LevelView {
  let best = levels[levels.length - 1];
  let bestGap = Infinity;
  for (const level of levels) {
    for (const { span } of [level.first, level.second]) {
      const gap = ordinal < span.first ? span.first - ordinal : ordinal > span.last ? ordinal - span.last : 0;
      if (gap < bestGap) {
        best = level;
        bestGap = gap;
      }
    }
  }
  return best;
}

export function RevelationMirror({
  payload,
  slug,
  title,
  palette,
}: {
  payload: MirrorPayload;
  slug: string;
  title: string;
  palette: StudyPalette;
}) {
  const { levels } = payload;
  const byLetter = useMemo(() => new Map(levels.map((l) => [l.letter, l])), [levels]);

  const [viewParam, setViewParam] = useHashParam("view");
  const [levelParam, setLevelParam] = useHashParam("level");
  const [verseParam, setVerseParam] = useHashParam("verse");
  const view: MirrorView = isView(viewParam) ? viewParam : "chart";
  const selected = levelParam && byLetter.has(levelParam) ? levelParam : null;
  const selectedLevel = selected ? byLetter.get(selected) : undefined;

  const [hover, setHover] = useState<string | null>(null);
  const [folded, setFolded] = useState(false);
  const [walking, setWalking] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("pair");
  const [focusHalf, setFocusHalf] = useState<"first" | "second">("first");
  const [drawIn, setDrawIn] = useState(true);
  const [welcome, setWelcome] = useState(false);

  const active = walking ? selected : (hover ?? selected);

  const setView = useCallback((next: MirrorView) => setViewParam(next === "chart" ? null : next), [setViewParam]);
  const select = useCallback(
    (letter: string | null) => {
      setLevelParam(letter);
      setFocusHalf("first");
      if (letter) setTab("pair");
    },
    [setLevelParam],
  );

  // The draw-in plays once per visit.
  useEffect(() => {
    const id = window.setTimeout(() => setDrawIn(false), 2600);
    return () => window.clearTimeout(id);
  }, []);

  // First visit: introduce the idea once the chart has started drawing.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        if (!window.localStorage.getItem(WELCOME_KEY)) setWelcome(true);
      } catch {
        setWelcome(true);
      }
    }, 900);
    return () => window.clearTimeout(id);
  }, []);

  const dismissWelcome = useCallback(() => {
    setWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // Storage can be unavailable; the card simply returns next visit.
    }
  }, []);

  // "#verse=12:9" (used by search) selects the pair containing that verse.
  useEffect(() => {
    if (!verseParam) return;
    const id = window.setTimeout(() => {
      setVerseParam(null);
      const match = /^(\d{1,2}):(\d{1,3})$/.exec(verseParam);
      if (!match) return;
      const [chapter, verse] = [Number(match[1]), Number(match[2])];
      const start = payload.chapterStarts[chapter - 1];
      const next = payload.chapterStarts[chapter] ?? payload.verses.length + 1;
      if (!start || verse < 1 || start + verse - 1 >= next) return;
      select(levelForOrdinal(levels, start + verse - 1).letter);
    }, 0);
    return () => window.clearTimeout(id);
  }, [verseParam, setVerseParam, payload, levels, select]);

  // Walk to the centre: one level inward every step, stopping at the centre.
  useEffect(() => {
    if (!walking) return;
    const current = selectedLevel?.level ?? 0;
    const id = window.setTimeout(
      () => {
        if (current >= levels.length) setWalking(false);
        else select(levels[current].letter);
      },
      current === 0 ? 0 : WALK_STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [walking, selectedLevel, levels, select]);

  const toggleWalk = useCallback(() => {
    if (walking) {
      setWalking(false);
      return;
    }
    if (selectedLevel?.isCenter) setLevelParam(null);
    setHover(null);
    setTab("pair");
    setWalking(true);
  }, [walking, selectedLevel, setLevelParam]);

  const toggleFold = useCallback(() => {
    setFolded((v) => !v);
    if (view !== "arcs") setView("arcs");
  }, [view, setView]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const onControl = event.target instanceof HTMLElement && event.target.closest("button, a, [role=tab]");
      const index = selectedLevel ? selectedLevel.level - 1 : -1;
      switch (event.key) {
        case "1":
        case "2":
        case "3":
        case "4":
          setView(VIEW_KEYS[Number(event.key) - 1]);
          break;
        case "ArrowDown":
          event.preventDefault();
          setWalking(false);
          select(levels[Math.min(index + 1, levels.length - 1)].letter);
          break;
        case "ArrowUp":
          event.preventDefault();
          setWalking(false);
          select(levels[Math.max(index - 1, 0)].letter);
          break;
        case "f":
        case "F":
          toggleFold();
          break;
        case " ":
          if (onControl) return;
          event.preventDefault();
          toggleWalk();
          break;
        case "Escape":
          if (walking) setWalking(false);
          else if (welcome) dismissWelcome();
          else select(null);
          break;
        default:
          return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [levels, selectedLevel, walking, welcome, select, setView, toggleFold, toggleWalk, dismissWelcome]);

  const showInText = useCallback(
    (half: "first" | "second") => {
      setView("text");
      setFocusHalf(half);
    },
    [setView],
  );

  const canvas = (() => {
    switch (view) {
      case "arcs":
        return (
          <ArcsView
            levels={levels}
            chapterStarts={payload.chapterStarts}
            total={payload.verses.length}
            active={active}
            folded={folded}
            onHover={setHover}
            onSelect={select}
          />
        );
      case "symmetry":
        return <SymmetryView levels={levels} stats={payload.stats} active={active} onHover={setHover} onSelect={select} />;
      case "text":
        return (
          <TextView
            verses={payload.verses}
            chapterStarts={payload.chapterStarts}
            levels={levels}
            active={selected}
            selected={selected}
            focusHalf={focusHalf}
            onSelect={select}
            onFocusHalf={setFocusHalf}
          />
        );
      default:
        return <ChartView levels={levels} active={active} selected={selected} drawIn={drawIn} onHover={setHover} onSelect={select} />;
    }
  })();

  return (
    <StudyShell
      slug={slug}
      title={title}
      palette={palette}
      subtitle="51 mirrored pairs around Revelation 12:9–10"
      toolbar={<Segmented label="View" value={view} onValueChange={setView} items={VIEWS} />}
      actions={
        <>
          {view === "arcs" ? (
            <ToolButton
              variant={folded ? "primary" : "outline"}
              icon={<FoldHorizontal aria-hidden />}
              aria-pressed={folded}
              onClick={toggleFold}
              title="Fold at the centre (F)"
            >
              {folded ? "Unfold" : "Fold"}
            </ToolButton>
          ) : null}
          <ToolButton
            variant="outline"
            icon={walking ? <Pause aria-hidden /> : <Footprints aria-hidden />}
            onClick={toggleWalk}
            aria-pressed={walking}
            title="Walk to the centre (Space)"
          >
            {walking ? "Pause" : "Walk to the centre"}
          </ToolButton>
          <ToolbarDivider />
        </>
      }
      sidebar={
        <Outline
          levels={levels}
          sections={payload.sections}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          active={active}
          onHover={setHover}
          onSelect={(letter) => {
            setWalking(false);
            select(letter);
          }}
        />
      }
      sidebarLabel="Outline"
      inspector={
        <Inspector
          payload={payload}
          level={selectedLevel}
          tab={tab}
          onTab={setTab}
          onShowInText={showInText}
          onWalk={toggleWalk}
          onShowWelcome={() => setWelcome(true)}
        />
      }
      status={
        <>
          <StatusItem label="Levels">{levels.length}</StatusItem>
          <StatusItem label="Passages">{levels.length * 2}</StatusItem>
          <StatusItem label="Centre">Revelation 12:9–10</StatusItem>
          {walking ? <StatusItem label="Walking">level {selectedLevel?.level ?? 1} of {levels.length}</StatusItem> : null}
        </>
      }
      statusEnd={
        <>
          {selectedLevel ? (
            <StatusItem label="Selected">
              {selectedLevel.letter}, {revRef(selectedLevel.first.ref)} and {revRef(selectedLevel.second.ref)}
            </StatusItem>
          ) : null}
          <StatusItem label="Average difference">{formatNumber(payload.stats.meanAbsDelta)} verses</StatusItem>
          <StatusItem label="Text">KJV 1769</StatusItem>
        </>
      }
    >
      <div className="relative h-full">
        {canvas}
        {welcome ? (
          <section
            aria-labelledby="mirror-welcome"
            className={cn(styles.sheet, "absolute bottom-6 left-6 z-20 w-[392px] rounded-panel border border-s-line bg-s-raised p-5 shadow-float")}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="mirror-welcome" className="text-[17px] leading-snug font-semibold tracking-[-0.01em] [font-stretch:108%]">
                Revelation is built like a mirror
              </h2>
              <button
                type="button"
                onClick={dismissWelcome}
                aria-label="Close the introduction"
                className="-mt-1 -mr-2 inline-flex size-8 shrink-0 items-center justify-center rounded-control text-s-muted hover:bg-s-canvas hover:text-s-ink"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-ui leading-relaxed text-s-muted">
              Read from the first verse inward and the book repeats itself in reverse: 51 pairs of passages, nested like
              brackets, close in on one centre in chapter 12. Pick any pair to read both halves side by side.
            </p>
            <div className="mt-4 flex gap-2">
              <ToolButton
                variant="primary"
                onClick={() => {
                  dismissWelcome();
                  select("A");
                }}
              >
                Start at the first verse
              </ToolButton>
              <ToolButton
                variant="outline"
                onClick={() => {
                  dismissWelcome();
                  select(levels[levels.length - 1].letter);
                }}
              >
                Jump to the centre
              </ToolButton>
            </div>
          </section>
        ) : null}
      </div>
    </StudyShell>
  );
}
