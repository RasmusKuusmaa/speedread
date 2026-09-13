import Link from "next/link";

export default function PassageNotFound() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-4 py-16">
      <h1 className="font-serif text-2xl text-ink">Passage not found</h1>
      <p className="font-sans text-base text-muted">
        There&apos;s no passage at this address. It may have been removed, or
        the link may be wrong.
      </p>
      <Link href="/practice" className="text-ink underline">
        Back to practice
      </Link>
    </main>
  );
}
