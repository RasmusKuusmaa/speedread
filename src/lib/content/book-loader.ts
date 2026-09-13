import { rawBooks } from "@/content/books";
import { loadPassages } from "./loader";
import type { Book, BookWithChunks } from "./types";

function validateBook(raw: unknown, index: number): string[] {
  const path = `books[${index}]`;
  if (typeof raw !== "object" || raw === null) {
    return [`${path}: book is not an object`];
  }
  const book = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof book.id !== "string") {
    errors.push(`${path}.id must be a string`);
  }
  if (typeof book.title !== "string") {
    errors.push(`${path}.title must be a string`);
  }
  if (typeof book.author !== "string") {
    errors.push(`${path}.author must be a string`);
  }
  if (typeof book.source !== "string") {
    errors.push(`${path}.source must be a string`);
  }
  if (typeof book.attribution !== "string") {
    errors.push(`${path}.attribution must be a string`);
  }
  if (typeof book.licence !== "string") {
    errors.push(`${path}.licence must be a string`);
  }
  if (typeof book.textType !== "string") {
    errors.push(`${path}.textType must be a string`);
  }
  if (typeof book.domain !== "string") {
    errors.push(`${path}.domain must be a string`);
  }
  if (typeof book.language !== "string") {
    errors.push(`${path}.language must be a string`);
  }
  if (
    !Array.isArray(book.chunkPassageIds) ||
    book.chunkPassageIds.length === 0 ||
    !book.chunkPassageIds.every((id) => typeof id === "string")
  ) {
    errors.push(`${path}.chunkPassageIds must be a non-empty array of strings`);
  }

  return errors;
}

export function loadBooks(): BookWithChunks[] {
  const errors = rawBooks.flatMap((raw, index) => validateBook(raw, index));

  if (errors.length > 0) {
    const message = `Invalid book content:\n${errors.join("\n")}`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(message);
    }
    console.error(message);
  }

  const validBooks = rawBooks.filter(
    (raw, index) => validateBook(raw, index).length === 0,
  ) as Book[];

  const passageById = new Map(
    loadPassages().map((passage) => [passage.id, passage]),
  );

  const seenPassageIds = new Set<string>();
  const books: BookWithChunks[] = [];

  for (const book of validBooks) {
    const chunks = [];
    let bookIsValid = true;

    for (const passageId of book.chunkPassageIds) {
      const passage = passageById.get(passageId);
      if (!passage) {
        const message = `Book "${book.id}" references unknown passage id "${passageId}"`;
        if (process.env.NODE_ENV !== "production") {
          throw new Error(message);
        }
        console.error(message);
        bookIsValid = false;
        continue;
      }
      if (seenPassageIds.has(passageId)) {
        const message = `Passage "${passageId}" belongs to more than one book`;
        if (process.env.NODE_ENV !== "production") {
          throw new Error(message);
        }
        console.error(message);
        bookIsValid = false;
        continue;
      }
      seenPassageIds.add(passageId);
      chunks.push(passage);
    }

    if (bookIsValid) {
      books.push({ ...book, chunks });
    }
  }

  return books;
}
