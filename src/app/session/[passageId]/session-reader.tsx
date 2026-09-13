"use client";

import { useState } from "react";
import { scoreDifficulty } from "@/lib/content/difficulty";
import type { PassageWithWordCounts } from "@/lib/content/types";
import { useReadingTimer } from "@/lib/session/use-reading-timer";

type Phase = "start" | "reading";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SessionReader({ passage }: { passage: PassageWithWordCounts }) {
  const [phase, setPhase] = useState<Phase>("start");
  const timer = useReadingTimer();

  if (phase === "start") {
    const difficulty = scoreDifficulty(passage.body, passage.language);

    return (
      <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
        <h1 className="font-serif text-2xl text-ink">{passage.title}</h1>
        <p className="flex gap-3 font-sans text-sm text-muted">
          <span>{passage.wordCounts.total} words</span>
          <span>{capitalize(difficulty.band)}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            timer.start();
            setPhase("reading");
          }}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Start reading
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col py-16">
      <article className="mx-auto flex max-w-[66ch] flex-col gap-6 font-serif text-[19px] leading-[1.65] text-ink">
        {passage.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}
