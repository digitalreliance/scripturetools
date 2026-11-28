"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowUpRight, BookOpenText, Code, Flag, Lightbulb } from "lucide-react";
import { GitHubMark } from "@/components/brand/SocialMarks";
import { CONTRIBUTING_URL, newIssueUrl, REPO_URL, sourceUrl, studyIssueUrl, studySourcePath } from "@/lib/contribute";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { ToolButton } from "./parts";
import styles from "./ContributeMenu.module.css";

/**
 * The ways in for contributors, as one menu wherever it appears: in every
 * study's top bar (about that study) and in the hub's navigation (about the
 * project). Both end on the project itself, on GitHub.
 *
 * The menu renders in place rather than in a portal, so it takes its colours
 * from the --s-* variables around it: a study's palette, or the hub's tones.
 */

/** A study's Contribute menu, rendered by StudyShell from the study's slug. */
export function ContributeMenu({ slug, title }: { slug: string; title: string }) {
  // Captured when the menu opens, so the issue links carry the current view.
  const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);
  const study = { slug, title };

  return (
    <MenuFrame
      onOpen={() => setPageUrl(window.location.href)}
      trigger={
        <ToolButton icon={<GitHubMark />} title="Help improve this study">
          Contribute
        </ToolButton>
      }
      header={
        <DropdownMenu.Label className="px-2.5 pt-1.5 pb-2 text-[12px] text-s-muted">Help improve {title}</DropdownMenu.Label>
      }
    >
      <MenuLink
        href={studyIssueUrl("mistake", study, pageUrl)}
        icon={<Flag aria-hidden />}
        label="Report a mistake"
        hint="A wrong verse, reference or label"
      />
      <MenuLink
        href={studyIssueUrl("idea", study, pageUrl)}
        icon={<Lightbulb aria-hidden />}
        label="Suggest an improvement"
        hint="An idea for this study"
      />
      <MenuLink
        href={sourceUrl(studySourcePath(slug))}
        icon={<Code aria-hidden />}
        label="Read the code"
        hint={studySourcePath(slug)}
      />
    </MenuFrame>
  );
}

/**
 * The hub's colours for the menu, as the --s-* variables a study's palette
 * would set: the dark cover, or the paper pages.
 */
const TONES = {
  cover: {
    "--s-raised": "var(--color-cover-raised)",
    "--s-canvas": "rgb(242 238 230 / 0.07)",
    "--s-line": "var(--color-cover-line)",
    "--s-ink": "var(--color-cover-ink)",
    "--s-muted": "var(--color-cover-muted)",
  },
  paper: {
    "--s-raised": "var(--color-paper-raised)",
    "--s-canvas": "var(--color-paper-sunk)",
    "--s-line": "var(--color-paper-line)",
    "--s-ink": "var(--color-ink)",
    "--s-muted": "var(--color-ink-muted)",
  },
} as const satisfies Record<string, Record<`--s-${string}`, string>>;

const siteTriggerTones = {
  cover:
    "text-cover-muted hover:bg-cover-ink/[0.06] hover:text-cover-ink data-[state=open]:bg-cover-ink/[0.08] data-[state=open]:text-cover-ink",
  paper: "text-ink-muted hover:bg-paper-sunk hover:text-ink data-[state=open]:bg-paper-sunk data-[state=open]:text-ink",
};

/**
 * The project's Contribute menu, for the hub's navigation: what it means that
 * the project is open source, then the same ways in a study offers, for the
 * whole project. Styled for the cover or for paper, like SearchButton.
 */
export function SiteContributeMenu({ tone = "paper", className }: { tone?: "cover" | "paper"; className?: string }) {
  const page = `${SITE.url}/`;
  return (
    <MenuFrame
      style={TONES[tone] as CSSProperties}
      width={320}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-control px-3 text-[14px] transition-colors duration-120",
            siteTriggerTones[tone],
            className,
          )}
        >
          <GitHubMark className="size-[15px]" />
          Contribute
        </button>
      }
      header={
        <DropdownMenu.Label className="px-2.5 pt-2 pb-2.5">
          <span className="block text-ui font-medium text-s-ink">{SITE.name} is free and open source</span>
          <span className="mt-1 block text-[12px] leading-[1.45] text-s-muted">
            Its code and data are public, so anyone can check the work or help build it.
          </span>
        </DropdownMenu.Label>
      }
      headerRule
    >
      <MenuLink
        href={newIssueUrl("mistake", { page })}
        icon={<Flag aria-hidden />}
        label="Report a mistake"
        hint="A wrong verse, reference or label"
      />
      <MenuLink
        href={newIssueUrl("idea", { page })}
        icon={<Lightbulb aria-hidden />}
        label="Suggest a study"
        hint="An idea for something to draw"
      />
      <MenuLink
        href={CONTRIBUTING_URL}
        icon={<BookOpenText aria-hidden />}
        label="Read the contributing guide"
        hint="What we accept, and how to start"
      />
    </MenuFrame>
  );
}

/** Trigger, header, the menu's own links, then the project on GitHub. */
function MenuFrame({
  trigger,
  header,
  headerRule = false,
  onOpen,
  style,
  width = 296,
  children,
}: {
  trigger: ReactNode;
  header: ReactNode;
  /** A hairline under the header, when it says more than a label. */
  headerRule?: boolean;
  onOpen?: () => void;
  style?: CSSProperties;
  width?: number;
  children: ReactNode;
}) {
  return (
    <span className="contents" style={style}>
      <DropdownMenu.Root
        modal={false}
        onOpenChange={(open) => {
          if (open) onOpen?.();
        }}
      >
        <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          style={{ width }}
          className={cn(
            styles.content,
            "z-50 rounded-panel border border-s-line bg-s-raised p-1.5 text-s-ink shadow-float",
          )}
        >
          {header}
          {headerRule ? <DropdownMenu.Separator className="mx-1 mb-1.5 h-px bg-s-line" /> : null}
          {children}
          <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-s-line" />
          <MenuLink
            href={REPO_URL}
            icon={<GitHubMark />}
            label="Open the project on GitHub"
            hint={`${SITE.repo.owner}/${SITE.repo.name}`}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </span>
  );
}

function MenuLink({ href, icon, label, hint }: { href: string; icon: ReactNode; label: string; hint?: string }) {
  return (
    <DropdownMenu.Item asChild>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex cursor-pointer items-start gap-2.5 rounded-control px-2.5 py-2 text-ui outline-none data-[highlighted]:bg-s-canvas [&_svg]:size-4"
      >
        <span className="mt-px shrink-0 text-s-muted group-data-[highlighted]:text-s-ink">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          {hint ? <span className="mt-0.5 block truncate text-[12px] text-s-muted">{hint}</span> : null}
        </span>
        <ArrowUpRight aria-hidden className="mt-px shrink-0 text-s-muted opacity-0 group-data-[highlighted]:opacity-100" />
        <span className="sr-only">(opens GitHub in a new tab)</span>
      </a>
    </DropdownMenu.Item>
  );
}
