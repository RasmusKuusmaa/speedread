import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-8 py-16">
      <div>
        <h1 className="font-serif text-3xl text-ink">Reading trainer</h1>
        <p className="mt-2 font-sans text-base text-muted">
          Train reading comprehension, and let your rate follow.
        </p>
      </div>
      <nav className="flex flex-col gap-3 font-sans text-base">
        <Link href="/practice" className="text-ink underline">
          Practice
        </Link>
        <Link href="/progress" className="text-ink underline">
          Progress
        </Link>
        <Link href="/settings" className="text-ink underline">
          Settings
        </Link>
      </nav>
    </main>
  );
}
