export type LengthBand = "short" | "medium" | "long";

export const LENGTH_BANDS: LengthBand[] = ["short", "medium", "long"];

const SHORT_MAX_WORDS = 350;
const MEDIUM_MAX_WORDS = 600;

export function scoreLength(wordCount: number): LengthBand {
  if (wordCount < SHORT_MAX_WORDS) {
    return "short";
  }
  if (wordCount <= MEDIUM_MAX_WORDS) {
    return "medium";
  }
  return "long";
}
