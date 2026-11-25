import { SITE } from "./site";

/**
 * Links into the public repository: the code, new issues prefilled for a study,
 * the maker's profile. Every "Contribute" control builds its URLs here.
 *
 * Issues open GitHub's issue forms (.github/ISSUE_TEMPLATE), whose fields are
 * prefilled from the query string by their `id`.
 */

const { owner, name, branch } = SITE.repo;

export const REPO_URL = `https://github.com/${owner}/${name}`;

/** How to contribute, and the principles every contribution starts from. */
export const CONTRIBUTING_URL = `${REPO_URL}/blob/${branch}/CONTRIBUTING.md`;

/** Issue forms by purpose, and the field ids each one accepts in the URL. */
export const ISSUE_FORMS = {
  mistake: { file: "report-a-mistake.yml", fields: ["study", "page"] },
  idea: { file: "suggest-a-study.yml", fields: ["study", "page"] },
  bug: { file: "something-is-broken.yml", fields: ["page"] },
} as const;

export type IssueForm = keyof typeof ISSUE_FORMS;

type FormFields<F extends IssueForm> = Partial<Record<(typeof ISSUE_FORMS)[F]["fields"][number] | "title", string>>;

/** A new issue on one of the forms, with any known fields filled in. */
export function newIssueUrl<F extends IssueForm>(form: F, fields: FormFields<F> = {}): string {
  const params = new URLSearchParams({ template: ISSUE_FORMS[form].file });
  for (const [key, value] of Object.entries(fields)) {
    if (value) params.set(key, value as string);
  }
  return `${REPO_URL}/issues/new?${params}`;
}

/** A folder or file in the repository, on the default branch. */
export function sourceUrl(path: string): string {
  return `${REPO_URL}/tree/${branch}/${path.replace(/^\/+/, "")}`;
}

export function xProfileUrl(handle: string): string {
  return `https://x.com/${handle.replace(/^@/, "")}`;
}

/**
 * A new issue about one study, prefilled with the study and the exact view the
 * reader was looking at (`pageUrl`, hash included).
 */
export function studyIssueUrl(
  kind: "mistake" | "idea",
  study: { slug: string; title: string },
  pageUrl?: string,
): string {
  return newIssueUrl(kind, { title: `${study.title}: `, study: study.title, page: pageUrl });
}

/** Where a study's own code lives. */
export function studySourcePath(slug: string): string {
  return `src/studies/${slug}`;
}
