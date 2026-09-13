"use client";

import Link from "next/link";
import { useState } from "react";
import { loadPassages } from "@/lib/content/loader";
import { useStore } from "@/lib/storage/store-provider";

function DueRetests() {
  const { store } = useStore();
  const [now] = useState(() => Date.now());

  if (store === null) {
    return null;
  }

  const dueRetests = store.retests
    .filter((retest) => retest.dueAtEpochMs <= now)
    .sort((a, b) => a.dueAtEpochMs - b.dueAtEpochMs);

  if (dueRetests.length === 0) {
    return null;
  }

  const passageById = new Map(
    loadPassages().map((passage) => [passage.id, passage]),
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Due retests</h2>
      <ul className="flex flex-col gap-2">
        {dueRetests.map((retest) => (
          <li key={retest.id} className="font-sans text-base">
            <Link
              href={`/session/${retest.passageId}?context=retest&retestId=${retest.id}`}
              className="text-ink underline"
            >
              {passageById.get(retest.passageId)?.title ?? retest.passageId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-8 py-16">
      <div>
        <h1 className="font-serif text-3xl text-ink">Reading trainer</h1>
        <p className="mt-2 font-sans text-base text-muted">
          Train reading comprehension, and let your rate follow.
        </p>
      </div>
      <DueRetests />
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
