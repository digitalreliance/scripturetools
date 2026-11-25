import type { Metadata } from "next";
import { getStudyOrThrow } from "@/studies/registry";
import { buildMirrorPayload } from "@/studies/revelation-chiasm/payload";
import { RevelationMirror } from "@/studies/revelation-chiasm/RevelationMirror";

const study = getStudyOrThrow("revelation-chiasm");

export const metadata: Metadata = {
  title: study.title,
  description: study.summary,
};

export default function RevelationChiasmPage() {
  // Read at build time; the client receives only Revelation and the structure.
  const payload = buildMirrorPayload();
  return <RevelationMirror payload={payload} title={study.title} palette={study.palette} />;
}
