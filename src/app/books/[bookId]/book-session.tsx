"use client";

import { useState } from "react";
import { SessionReader } from "@/app/session/[passageId]/session-reader";
import { applySitting, bookProgressFor } from "@/lib/books/progress";
import {
  composeSitting,
  splitSittingOutcome,
  type Sitting,
} from "@/lib/books/sitting";
import type { BookWithChunks } from "@/lib/content/types";
import { useStore } from "@/lib/storage/store-provider";
import { BookContents } from "./book-contents";

export function BookSession({ book }: { book: BookWithChunks }) {
  const { store, update } = useStore();
  // Composed once when reading starts, so changing the length control cannot
  // swap the text out from under a reader mid-session.
  const [sitting, setSitting] = useState<Sitting | null>(null);

  if (store === null) {
    return null;
  }

  const sectionsPerSitting = store.settings.sectionsPerSitting;

  if (sitting === null) {
    return (
      <BookContents
        book={book}
        progress={bookProgressFor(store, book.id)}
        sectionsPerSitting={sectionsPerSitting}
        onChangeSectionsPerSitting={(count) => {
          update((current) => ({
            ...current,
            settings: { ...current.settings, sectionsPerSitting: count },
          }));
        }}
        onStart={(fromIndex) => {
          setSitting(composeSitting(book, fromIndex, sectionsPerSitting));
        }}
      />
    );
  }

  return (
    <SessionReader
      key={`${sitting.passage.id}-${sitting.sections.length}`}
      passage={sitting.passage}
      sessionContext="book"
      mode="self-paced"
      retestId={null}
      chunkPassageIds={sitting.sections.map((section) => section.id)}
      onSessionComplete={({ elapsedMs, answers }) => {
        update((current) =>
          applySitting(current, {
            bookId: book.id,
            orderedPassageIds: book.chunkPassageIds,
            outcomes: splitSittingOutcome(sitting, answers, elapsedMs),
            now: Date.now(),
          }),
        );
      }}
      bookNavigation={{
        label: "Back to the contents",
        onContinue: () => setSitting(null),
      }}
    />
  );
}
