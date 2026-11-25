import Link from "next/link";
import { Wordmark } from "@/components/brand/BrandMark";
import { Kbd } from "@/components/primitives/Kbd";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-paper px-14 py-10 text-ink">
      <Link href="/" className="self-start">
        <Wordmark />
      </Link>
      <div className="my-auto max-w-[52ch]">
        <p className="text-[14px] text-ink-muted">Page not found</p>
        <h1 className="mt-3 text-[48px] leading-[1] font-semibold tracking-[-0.03em] [font-stretch:115%]">
          There&rsquo;s no page at this address.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-muted">
          The link may be mistyped, or the study may not be built yet. Go back to the index, or press <Kbd>⌘K</Kbd> to
          search for a study.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-control bg-ink px-5 text-[15px] font-semibold text-paper transition-colors hover:bg-black"
        >
          Go to the index
        </Link>
      </div>
    </main>
  );
}
