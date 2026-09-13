"use client";

import { SessionReader } from "@/app/session/[passageId]/session-reader";
import type { BookWithChunks } from "@/lib/content/types";
import { useStore } from "@/lib/storage/store-provider";

export function BookSession({ book }: { book: BookWithChunks }) {
  const { store, update } = useStore();

  if (store === null) {
    return null;
  }

  const progress = store.bookProgress.find(
    (entry) => entry.bookId === book.id,
  );
  const currentChunkIndex = progress?.currentChunkIndex ?? 0;

  if (currentChunkIndex >= book.chunks.length) {
    return (
      <main className="flex flex-1 flex-col items-start justify-center gap-4 py-16">
        <h1 className="font-serif text-2xl text-ink">{book.title}</h1>
        <p className="font-sans text-base text-muted">
          You&apos;ve finished this book.
        </p>
      </main>
    );
  }

  const currentChunk = book.chunks[currentChunkIndex]!;
  const isLastChunk = currentChunkIndex === book.chunks.length - 1;

  function handleContinue() {
    const nextIndex = currentChunkIndex + 1;
    update((current) => {
      const existing = current.bookProgress.find(
        (entry) => entry.bookId === book.id,
      );
      return {
        ...current,
        bookProgress: [
          ...current.bookProgress.filter((entry) => entry.bookId !== book.id),
          {
            bookId: book.id,
            currentChunkIndex: nextIndex,
            startedAtEpochMs: existing?.startedAtEpochMs ?? Date.now(),
            completedAtEpochMs:
              nextIndex >= book.chunks.length ? Date.now() : null,
          },
        ],
      };
    });
  }

  return (
    <SessionReader
      key={currentChunk.id}
      passage={currentChunk}
      sessionContext="book"
      mode="self-paced"
      retestId={null}
      bookNavigation={{ isLastChunk, onContinue: handleContinue }}
    />
  );
}
