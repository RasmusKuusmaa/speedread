import { notFound } from "next/navigation";
import { loadBooks } from "@/lib/content/book-loader";
import { BookSession } from "./book-session";

export default async function BookPage({
  params,
}: PageProps<"/books/[bookId]">) {
  const { bookId } = await params;
  const book = loadBooks().find((item) => item.id === bookId);

  if (!book) {
    notFound();
  }

  return <BookSession book={book} />;
}
