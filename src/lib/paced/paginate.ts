export interface Page {
  paragraphs: string[];
  wordCount: number;
}

export const TARGET_WORDS_PER_PAGE = 150;

export function paginatePassage(
  body: string[],
  paragraphWordCounts: number[],
  targetWordsPerPage: number = TARGET_WORDS_PER_PAGE,
): Page[] {
  const totalWords = paragraphWordCounts.reduce((sum, count) => sum + count, 0);
  const pageCount = Math.max(1, Math.round(totalWords / targetWordsPerPage));
  const idealWordsPerPage = totalWords / pageCount;

  const pages: Page[] = [];
  let currentParagraphs: string[] = [];
  let currentWordCount = 0;
  let wordsSoFar = 0;
  let nextBoundary = idealWordsPerPage;

  body.forEach((paragraph, index) => {
    const wordCount = paragraphWordCounts[index] ?? 0;
    currentParagraphs.push(paragraph);
    currentWordCount += wordCount;
    wordsSoFar += wordCount;

    const isLastParagraph = index === body.length - 1;
    if (!isLastParagraph && pages.length < pageCount - 1 && wordsSoFar >= nextBoundary) {
      pages.push({ paragraphs: currentParagraphs, wordCount: currentWordCount });
      currentParagraphs = [];
      currentWordCount = 0;
      nextBoundary += idealWordsPerPage;
    }
  });

  if (currentParagraphs.length > 0) {
    pages.push({ paragraphs: currentParagraphs, wordCount: currentWordCount });
  }

  return pages;
}
