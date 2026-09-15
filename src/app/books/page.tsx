"use client";

import Link from "next/link";
import { bookProgressFor, completionPercent } from "@/lib/books/progress";
import { loadBooks } from "@/lib/content/book-loader";
import { useStore } from "@/lib/storage/store-provider";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function BooksPage() {
  const { store } = useStore();
  const books = loadBooks();

  if (store === null) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Books</h1>

      {books.length === 0 ? (
        <p className="font-sans text-base text-muted">
          No books are available yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {books.map((book) => {
            const progress = bookProgressFor(store, book.id);
            const percentRead = Math.round(completionPercent(book, progress));
            const status =
              percentRead === 0
                ? "Not started"
                : percentRead === 100
                  ? "Finished"
                  : `${percentRead}% read`;

            return (
              <li
                key={book.id}
                className="flex flex-col gap-2 border-b border-rule pb-4"
              >
                <Link
                  href={`/books/${book.id}`}
                  className="font-serif text-lg text-ink underline"
                >
                  {book.title}
                </Link>
                <p className="flex gap-3 font-sans text-sm text-muted">
                  <span>{book.author}</span>
                  <span>{capitalize(book.textType)}</span>
                  <span>{capitalize(book.domain)}</span>
                  <span>{status}</span>
                </p>
                <div className="h-1 rounded bg-rule">
                  <div
                    className="h-1 rounded bg-signal"
                    style={{ width: `${percentRead}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
