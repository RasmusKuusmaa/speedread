import type { PassageWordCounts } from "./types";

export function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}'-]+/gu) ?? [];
}

export function countWords(text: string): number {
  return tokenize(text).length;
}

export function computeWordCounts(body: string[]): PassageWordCounts {
  const paragraphs = body.map((paragraph) => countWords(paragraph));
  const total = paragraphs.reduce((sum, count) => sum + count, 0);
  return { paragraphs, total };
}
