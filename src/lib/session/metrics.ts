export function computeWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60_000;
  if (minutes <= 0) {
    return 0;
  }
  return wordCount / minutes;
}
