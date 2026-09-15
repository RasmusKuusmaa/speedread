import type { BookWithChunks } from "@/lib/content/types";
import type {
  BookChunkProgress,
  BookProgress,
  Store,
} from "@/lib/storage/types";
import type { SectionOutcome } from "./sitting";

export function bookProgressFor(
  store: Store,
  bookId: string,
): BookProgress | undefined {
  return store.bookProgress.find((entry) => entry.bookId === bookId);
}

export function chunkProgressFor(
  progress: BookProgress | undefined,
  passageId: string,
): BookChunkProgress | undefined {
  return progress?.chunks.find((chunk) => chunk.passageId === passageId);
}

export function sectionsReadCount(
  book: BookWithChunks,
  progress: BookProgress | undefined,
): number {
  if (progress === undefined) {
    return 0;
  }
  const read = new Set(progress.chunks.map((chunk) => chunk.passageId));
  return book.chunkPassageIds.filter((id) => read.has(id)).length;
}

export function completionPercent(
  book: BookWithChunks,
  progress: BookProgress | undefined,
): number {
  if (book.chunks.length === 0) {
    return 0;
  }
  return (sectionsReadCount(book, progress) / book.chunks.length) * 100;
}

// Where "Continue" picks up: the earliest section not yet read, or the start of
// the book once every section has been.
export function nextUnreadIndex(
  book: BookWithChunks,
  progress: BookProgress | undefined,
): number {
  const read = new Set(progress?.chunks.map((chunk) => chunk.passageId) ?? []);
  const index = book.chunks.findIndex((section) => !read.has(section.id));
  return index === -1 ? 0 : index;
}

export function applySitting(
  store: Store,
  {
    bookId,
    orderedPassageIds,
    outcomes,
    now,
  }: {
    bookId: string;
    orderedPassageIds: string[];
    outcomes: SectionOutcome[];
    now: number;
  },
): Store {
  const existing = bookProgressFor(store, bookId);
  const chunks = [...(existing?.chunks ?? [])];

  for (const outcome of outcomes) {
    const index = chunks.findIndex(
      (chunk) => chunk.passageId === outcome.passageId,
    );
    const previous = index === -1 ? undefined : chunks[index];
    const merged: BookChunkProgress = {
      passageId: outcome.passageId,
      readCount: (previous?.readCount ?? 0) + 1,
      lastReadAtEpochMs: now,
      questionsAsked: (previous?.questionsAsked ?? 0) + outcome.questionsAsked,
      questionsCorrect:
        (previous?.questionsCorrect ?? 0) + outcome.questionsCorrect,
      totalElapsedMs: (previous?.totalElapsedMs ?? 0) + outcome.elapsedMs,
    };
    if (index === -1) {
      chunks.push(merged);
    } else {
      chunks[index] = merged;
    }
  }

  const read = new Set(chunks.map((chunk) => chunk.passageId));
  const firstUnread = orderedPassageIds.findIndex((id) => !read.has(id));
  const everySectionRead = firstUnread === -1;

  const entry: BookProgress = {
    bookId,
    currentChunkIndex: everySectionRead
      ? orderedPassageIds.length
      : firstUnread,
    startedAtEpochMs: existing?.startedAtEpochMs ?? now,
    completedAtEpochMs: everySectionRead
      ? (existing?.completedAtEpochMs ?? now)
      : null,
    chunks,
  };

  return {
    ...store,
    bookProgress: [
      ...store.bookProgress.filter((item) => item.bookId !== bookId),
      entry,
    ],
  };
}
