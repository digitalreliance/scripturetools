import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTRIBUTING_URL,
  ISSUE_FORMS,
  newIssueUrl,
  REPO_URL,
  sourceUrl,
  studyIssueUrl,
  studySourcePath,
  xProfileUrl,
} from "../contribute";
import { SITE } from "../site";

describe("contribute links", () => {
  it("points at the public repository", () => {
    expect(REPO_URL).toBe(`https://github.com/${SITE.repo.owner}/${SITE.repo.name}`);
    expect(CONTRIBUTING_URL).toBe(`${REPO_URL}/blob/main/CONTRIBUTING.md`);
  });

  it("opens an issue form with only the fields it knows", () => {
    const url = new URL(newIssueUrl("bug"));
    expect(url.pathname).toBe(`/${SITE.repo.owner}/${SITE.repo.name}/issues/new`);
    expect([...url.searchParams.keys()]).toEqual(["template"]);
    expect(url.searchParams.get("template")).toBe("something-is-broken.yml");
  });

  it("prefills a study issue with the study and the exact view", () => {
    const url = new URL(
      studyIssueUrl(
        "mistake",
        { slug: "revelation-chiasm", title: "Revelation’s mirror" },
        "https://example.org/studies/revelation-chiasm#view=arcs&level=RR",
      ),
    );
    expect(url.searchParams.get("template")).toBe("report-a-mistake.yml");
    expect(url.searchParams.get("title")).toBe("Revelation’s mirror: ");
    expect(url.searchParams.get("study")).toBe("Revelation’s mirror");
    expect(url.searchParams.get("page")).toBe("https://example.org/studies/revelation-chiasm#view=arcs&level=RR");
  });

  it("leaves the page out until the view is known", () => {
    const url = new URL(studyIssueUrl("idea", { slug: "x", title: "X" }));
    expect(url.searchParams.get("template")).toBe("suggest-a-study.yml");
    expect(url.searchParams.has("page")).toBe(false);
  });

  it("links a study's own folder on the default branch", () => {
    expect(sourceUrl(studySourcePath("revelation-chiasm"))).toBe(`${REPO_URL}/tree/main/src/studies/revelation-chiasm`);
  });

  it("accepts an X handle with or without the @", () => {
    expect(xProfileUrl("@someone")).toBe("https://x.com/someone");
    expect(xProfileUrl("someone")).toBe("https://x.com/someone");
  });
});

describe("issue forms", () => {
  // GitHub prefills a form field only when the query key matches its id, so a
  // renamed form or field would silently drop the study and the view.
  for (const [kind, form] of Object.entries(ISSUE_FORMS)) {
    it(`${kind}: ${form.file} exists and has every prefilled field`, () => {
      const yaml = readFileSync(join(process.cwd(), ".github/ISSUE_TEMPLATE", form.file), "utf8");
      for (const field of form.fields) {
        expect(yaml, `${form.file} has no field with id "${field}"`).toMatch(new RegExp(`^\\s+id: ${field}$`, "m"));
      }
    });
  }
});
