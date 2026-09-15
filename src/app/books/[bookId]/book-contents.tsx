"use client";

import {
  chunkProgressFor,
  completionPercent,
  nextUnreadIndex,
  sectionsReadCount,
} from "@/lib/books/progress";
import {
  MAX_SECTIONS_PER_SITTING,
  sectionsInSitting,
} from "@/lib/books/sitting";
import type { BookWithChunks } from "@/lib/content/types";
import type { BookProgress } from "@/lib/storage/types";

const SITTING_LENGTHS = Array.from(
  { length: MAX_SECTIONS_PER_SITTING },
  (_, index) => index + 1,
);

function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.round(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function BookContents({
  book,
  progress,
  sectionsPerSitting,
  onChangeSectionsPerSitting,
  onStart,
}: {
  book: BookWithChunks;
  progress: BookProgress | undefined;
  sectionsPerSitting: number;
  onChangeSectionsPerSitting: (count: number) => void;
  onStart: (fromIndex: number) => void;
}) {
  const sectionsRead = sectionsReadCount(book, progress);
  const percentRead = Math.round(completionPercent(book, progress));
  const resumeIndex = nextUnreadIndex(book, progress);
  const everySectionRead = sectionsRead === book.chunks.length;
  const totalWords = book.chunks.reduce(
    (sum, section) => sum + section.wordCounts.total,
    0,
  );

  const resumeLabel =
    sectionsRead === 0
      ? "Start reading"
      : everySectionRead
        ? "Read it again from the start"
        : `Continue from section ${resumeIndex + 1}`;

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl text-ink">{book.title}</h1>
        <p className="flex flex-wrap gap-3 font-sans text-sm text-muted">
          <span>{book.author}</span>
          <span>{book.chunks.length} sections</span>
          <span>{totalWords} words</span>
        </p>
      </header>

      <div className="flex flex-col gap-10 md:flex-row-reverse md:items-start md:gap-12">
        <aside className="flex w-full flex-col gap-8 md:sticky md:top-16 md:w-64 md:shrink-0">
          <div className="flex flex-col gap-2">
            <p className="font-serif text-2xl text-ink">{percentRead}% read</p>
            <div className="h-2 rounded bg-rule">
              <div
                className="h-2 rounded bg-signal"
                style={{ width: `${percentRead}%` }}
              />
            </div>
            <p className="font-sans text-sm text-muted">
              {sectionsRead} of {book.chunks.length} sections
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-sm text-muted">
              Sections per sitting
            </h2>
            <div className="flex flex-wrap gap-2">
              {SITTING_LENGTHS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChangeSectionsPerSitting(count)}
                  aria-pressed={count === sectionsPerSitting}
                  className={`rounded border px-3 py-1.5 font-sans text-sm text-ink ${
                    count === sectionsPerSitting
                      ? "border-signal"
                      : "border-rule"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="font-sans text-sm text-muted">
              You read{" "}
              {sectionsPerSitting === 1
                ? "one section"
                : `${sectionsPerSitting} sections`}{" "}
              without stopping, then answer ten questions drawn from{" "}
              {sectionsPerSitting === 1 ? "it" : "all of them"}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStart(resumeIndex)}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            {resumeLabel}
          </button>
        </aside>

        <ol className="flex flex-1 flex-col">
          {book.chunks.map((section, index) => {
            const stats = chunkProgressFor(progress, section.id);
            const covered = sectionsInSitting(book, index, sectionsPerSitting);
            const lastCovered = index + covered.length;
            const startLabel =
              covered.length === 1
                ? stats === undefined
                  ? "Read"
                  : "Read again"
                : `Read ${index + 1}–${lastCovered}`;

            return (
              <li
                key={section.id}
                className="flex flex-col gap-2 border-b border-rule py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-serif text-base text-ink">
                    <span className="text-muted">{index + 1}.</span>{" "}
                    {section.title}
                  </p>
                  <p className="flex flex-wrap gap-3 font-sans text-sm text-muted">
                    <span>{section.wordCounts.total} words</span>
                    {stats === undefined ? (
                      <span>Not read yet</span>
                    ) : (
                      <>
                        <span>
                          Read {stats.readCount}{" "}
                          {stats.readCount === 1 ? "time" : "times"}
                        </span>
                        <span>
                          {stats.questionsAsked > 0
                            ? `${Math.round(
                                (stats.questionsCorrect /
                                  stats.questionsAsked) *
                                  100,
                              )}% correct`
                            : "No questions yet"}
                        </span>
                        <span>{formatDuration(stats.totalElapsedMs)}</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onStart(index)}
                  className="shrink-0 self-start rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
                >
                  {startLabel}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
