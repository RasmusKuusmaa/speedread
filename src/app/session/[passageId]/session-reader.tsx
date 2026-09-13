"use client";

import { useEffect, useState } from "react";
import { scoreDifficulty } from "@/lib/content/difficulty";
import type { PassageWithWordCounts } from "@/lib/content/types";
import { computeWpm } from "@/lib/session/metrics";
import { useReadingTimer } from "@/lib/session/use-reading-timer";

type Phase = "start" | "reading" | "finished";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StartScreen({
  passage,
  onStart,
}: {
  passage: PassageWithWordCounts;
  onStart: () => void;
}) {
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
        onClick={onStart}
        className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
      >
        Start reading
      </button>
    </main>
  );
}

function ReadingScreen({
  paragraphs,
  onFinish,
}: {
  paragraphs: string[];
  onFinish: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col py-16">
      <article className="mx-auto flex max-w-[66ch] flex-col gap-6 font-serif text-[19px] leading-[1.65] text-ink">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <div className="mx-auto mt-10 w-full max-w-[66ch]">
        <button
          type="button"
          onClick={onFinish}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          I&apos;ve finished reading
        </button>
      </div>
    </main>
  );
}

function FinishedScreen({
  wpm,
  focusLost,
}: {
  wpm: number;
  focusLost: boolean;
}) {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      <p className="font-sans text-sm text-muted">
        You read at {wpm} words per minute.
      </p>
      {focusLost && (
        <p className="font-sans text-sm text-muted">
          This session may be excluded from your metrics because you left the
          tab while reading.
        </p>
      )}
    </main>
  );
}

export function SessionReader({ passage }: { passage: PassageWithWordCounts }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [focusLost, setFocusLost] = useState(false);
  const timer = useReadingTimer();

  useEffect(() => {
    if (phase !== "reading") {
      return;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        setFocusLost(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase]);

  switch (phase) {
    case "start":
      return (
        <StartScreen
          passage={passage}
          onStart={() => {
            setFocusLost(false);
            timer.start();
            setPhase("reading");
          }}
        />
      );
    case "reading":
      return (
        <ReadingScreen
          paragraphs={passage.body}
          onFinish={() => {
            timer.stop();
            setPhase("finished");
          }}
        />
      );
    case "finished":
      return (
        <FinishedScreen
          wpm={Math.round(
            computeWpm(passage.wordCounts.total, timer.elapsedMs ?? 0),
          )}
          focusLost={focusLost}
        />
      );
  }
}
