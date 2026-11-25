import { describe, expect, it } from "vitest";
import { newIssueUrl, REPO_URL, sourceUrl, studyIssueUrl, studySourcePath, xProfileUrl } from "../contribute";

describe("contribute links", () => {
  it("points at the public repository", () => {
    expect(REPO_URL).toBe("https://github.com/digitalreliance/openscripture");
  });

  it("builds a bare new-issue link without an empty query", () => {
    expect(newIssueUrl()).toBe(`${REPO_URL}/issues/new`);
  });

  it("prefills a study issue with the study and the exact view", () => {
    const url = new URL(
      studyIssueUrl(
        "mistake",
        { slug: "revelation-chiasm", title: "Revelation’s mirror" },
        "https://example.org/studies/revelation-chiasm#view=arcs&level=RR",
      ),
    );
    expect(url.pathname).toBe("/digitalreliance/openscripture/issues/new");
    expect(url.searchParams.get("title")).toBe("Revelation’s mirror: ");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Study: Revelation’s mirror");
    expect(body).toContain("Page: https://example.org/studies/revelation-chiasm#view=arcs&level=RR");
    expect(body).toContain("What is wrong, and where?");
  });

  it("leaves the page line out until the view is known", () => {
    const body = new URL(studyIssueUrl("idea", { slug: "x", title: "X" })).searchParams.get("body") ?? "";
    expect(body).not.toContain("Page:");
    expect(body).toContain("What would make this study better?");
  });

  it("links a study's own folder on the default branch", () => {
    expect(sourceUrl(studySourcePath("revelation-chiasm"))).toBe(`${REPO_URL}/tree/main/src/studies/revelation-chiasm`);
  });

  it("accepts an X handle with or without the @", () => {
    expect(xProfileUrl("@someone")).toBe("https://x.com/someone");
    expect(xProfileUrl("someone")).toBe("https://x.com/someone");
  });
});
