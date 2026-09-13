import type { SessionRecord } from "@/lib/storage/types";
import { isEligibleSession } from "./eligibility";

const BAND_WIDTH_WPM = 25;

function bandIndexFor(wpm: number): number {
  return Math.floor(wpm / BAND_WIDTH_WPM);
}

export function lastComprehensionForSpeed(
  sessions: SessionRecord[],
  targetWpm: number,
): number | null {
  const targetBand = bandIndexFor(targetWpm);
  const matches = sessions.filter(
    (session) =>
      session.mode === "paced" &&
      isEligibleSession(session) &&
      bandIndexFor(session.wpm) === targetBand,
  );
  if (matches.length === 0) {
    return null;
  }
  return matches[matches.length - 1]!.comprehension;
}
