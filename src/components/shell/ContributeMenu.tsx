"use client";

import { useState, type ReactNode } from "react";
import { DropdownMenu } from "radix-ui";
import { ArrowUpRight, Code, Flag, Lightbulb } from "lucide-react";
import { GitHubMark } from "@/components/brand/SocialMarks";
import { REPO_URL, sourceUrl, studyIssueUrl, studySourcePath } from "@/lib/contribute";
import { cn } from "@/lib/cn";
import { ToolButton } from "./parts";
import styles from "./ContributeMenu.module.css";

/**
 * Every study's way in for contributors: report a mistake or suggest an
 * improvement (a GitHub issue prefilled with the study and the exact view),
 * or read the study's code. Rendered by StudyShell, so each study has one.
 *
 * The menu renders inside the shell rather than in a portal, so it inherits
 * the study's palette variables.
 */
export function ContributeMenu({ slug, title }: { slug: string; title: string }) {
  // Captured when the menu opens, so the issue links carry the current view.
  const [pageUrl, setPageUrl] = useState<string | undefined>(undefined);
  const study = { slug, title };

  return (
    <DropdownMenu.Root
      modal={false}
      onOpenChange={(open) => {
        if (open) setPageUrl(window.location.href);
      }}
    >
      <DropdownMenu.Trigger asChild>
        <ToolButton icon={<GitHubMark />} title="Help improve this study">
          Contribute
        </ToolButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          styles.content,
          "z-50 w-[296px] rounded-panel border border-s-line bg-s-raised p-1.5 text-s-ink shadow-float",
        )}
      >
        <DropdownMenu.Label className="px-2.5 pt-1.5 pb-2 text-[12px] text-s-muted">
          Help improve {title}
        </DropdownMenu.Label>
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
        <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-s-line" />
        <MenuLink href={REPO_URL} icon={<GitHubMark />} label="Open the project on GitHub" />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
