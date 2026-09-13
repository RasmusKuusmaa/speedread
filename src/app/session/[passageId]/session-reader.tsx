"use client";

import { useEffect, useRef, useState } from "react";
import { scoreDifficulty } from "@/lib/content/difficulty";
import type { PassageWithWordCounts } from "@/lib/content/types";
import { computeWpm } from "@/lib/session/metrics";
import { useReadingTimer } from "@/lib/session/use-reading-timer";
import { useStore } from "@/lib/storage/store-provider";

type Phase = "start" | "reading" | "recall" | "finished";

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

function RecallScreen({
  depth,
  onContinue,
}: {
  depth: "full" | "brief";
  onContinue: (recallText: string) => void;
}) {
  const [recallText, setRecallText] = useState("");

  return (
    <main className="flex flex-1 flex-col gap-6 py-16">
      <p className="font-sans text-base text-ink">
        {depth === "full"
          ? "What do you remember from what you just read?"
          : "In one sentence, what was the main point?"}
      </p>
      {depth === "full" ? (
        <textarea
          value={recallText}
          onChange={(event) => setRecallText(event.target.value)}
          rows={8}
          className="mx-auto w-full max-w-[66ch] rounded border border-rule p-3 font-serif text-base text-ink"
        />
      ) : (
        <input
          type="text"
          value={recallText}
          onChange={(event) => setRecallText(event.target.value)}
          className="mx-auto w-full max-w-[66ch] rounded border border-rule p-3 font-serif text-base text-ink"
        />
      )}
      <div className="mx-auto w-full max-w-[66ch]">
        <button
          type="button"
          onClick={() => onContinue(recallText)}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Continue
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
  const { store, update } = useStore();
  const [phase, setPhase] = useState<Phase>("start");
  const [focusLost, setFocusLost] = useState(false);
  const hasCheckedResumeRef = useRef(false);
  const timer = useReadingTimer();
  const recallDepth = store?.settings.recallDepth ?? "brief";

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

  useEffect(() => {
    if (store === null || hasCheckedResumeRef.current) {
      return;
    }
    hasCheckedResumeRef.current = true;

    const inProgress = store.inProgressSession;
    if (inProgress !== null && inProgress.passageId === passage.id) {
      timer.start(Date.now() - inProgress.startedAtEpochMs);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time resume from a persisted, client-only session after mount, not a derivable value
      setFocusLost(true);
      setPhase("reading");
    }
  }, [store, passage.id, timer]);

  switch (phase) {
    case "start":
      return (
        <StartScreen
          passage={passage}
          onStart={() => {
            setFocusLost(false);
            timer.start();
            update((current) => ({
              ...current,
              inProgressSession: {
                passageId: passage.id,
                startedAtEpochMs: Date.now(),
              },
            }));
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
            update((current) => ({ ...current, inProgressSession: null }));
            setPhase(recallDepth === "off" ? "finished" : "recall");
          }}
        />
      );
    case "recall":
      return (
        <RecallScreen
          depth={recallDepth === "off" ? "brief" : recallDepth}
          onContinue={() => setPhase("finished")}
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
