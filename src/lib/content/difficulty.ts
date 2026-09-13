import frequencyEn from "@/content/frequency/en-5000.json";
import { tokenize } from "./words";

export type DifficultyBand =
  "accessible" | "moderate" | "demanding" | "unrated";

export interface DifficultyScore {
  band: DifficultyBand;
  top2000Share: number | null;
  top5000Share: number | null;
}

const FREQUENCY_LISTS: Record<string, string[]> = {
  en: frequencyEn,
};

const ACCESSIBLE_TOP_2000_SHARE = 0.8;
const MODERATE_TOP_5000_SHARE = 0.75;

function bandFromShares(
  top2000Share: number,
  top5000Share: number,
): DifficultyBand {
  if (top2000Share >= ACCESSIBLE_TOP_2000_SHARE) {
    return "accessible";
  }
  if (top5000Share >= MODERATE_TOP_5000_SHARE) {
    return "moderate";
  }
  return "demanding";
}

export function scoreDifficulty(
  body: string[],
  language: string,
): DifficultyScore {
  const list = FREQUENCY_LISTS[language];
  if (!list) {
    return { band: "unrated", top2000Share: null, top5000Share: null };
  }

  const tokens = body
    .flatMap((paragraph) => tokenize(paragraph))
    .map((token) => token.toLowerCase());

  if (tokens.length === 0) {
    return { band: "unrated", top2000Share: null, top5000Share: null };
  }

  const top2000 = new Set(list.slice(0, 2000));
  const top5000 = new Set(list);

  const in2000 = tokens.filter((token) => top2000.has(token)).length;
  const in5000 = tokens.filter((token) => top5000.has(token)).length;

  const top2000Share = in2000 / tokens.length;
  const top5000Share = in5000 / tokens.length;

  return {
    band: bandFromShares(top2000Share, top5000Share),
    top2000Share,
    top5000Share,
  };
}
