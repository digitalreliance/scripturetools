import { SITE } from "./site";

/**
 * Links into the public repository: the code, new issues prefilled for a study,
 * the maker's profile. Every "Contribute" control builds its URLs here.
 */

const { owner, name, branch } = SITE.repo;

export const REPO_URL = `https://github.com/${owner}/${name}`;

export function newIssueUrl({ title, body }: { title?: string; body?: string } = {}): string {
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (body) params.set("body", body);
  const query = params.toString();
  return `${REPO_URL}/issues/new${query ? `?${query}` : ""}`;
}

/** A folder or file in the repository, on the default branch. */
export function sourceUrl(path: string): string {
  return `${REPO_URL}/tree/${branch}/${path.replace(/^\/+/, "")}`;
}

export function xProfileUrl(handle: string): string {
  return `https://x.com/${handle.replace(/^@/, "")}`;
}

export type StudyIssueKind = "mistake" | "idea";

const QUESTIONS: Record<StudyIssueKind, string> = {
  mistake: "What is wrong, and where?\n\n\nWhat should it say instead? A source helps.\n",
  idea: "What would make this study better?\n",
};

/**
 * A new issue about one study, prefilled with the study and the exact view the
 * reader was looking at (`pageUrl`, hash included).
 */
export function studyIssueUrl(
  kind: StudyIssueKind,
  study: { slug: string; title: string },
  pageUrl?: string,
): string {
  const context = [`Study: ${study.title}`, pageUrl ? `Page: ${pageUrl}` : null].filter(Boolean).join("\n");
  return newIssueUrl({
    title: `${study.title}: `,
    body: `${context}\n\n${QUESTIONS[kind]}`,
  });
}

/** Where a study's own code lives. */
export function studySourcePath(slug: string): string {
  return `src/studies/${slug}`;
}
