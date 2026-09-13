import type { SessionRecord } from "@/lib/storage/types";
import { isEligibleSession } from "./eligibility";

const BAND_WIDTH_WPM = 25;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }
  return sorted[middle]!;
}

export function computeHoldingRate(
  sessions: SessionRecord[],
  thresholdPercent: number,
): number | null {
  const eligibleSessions = sessions.filter(isEligibleSession);
  if (eligibleSessions.length === 0) {
    return null;
  }

  const comprehensionByBand = new Map<number, number[]>();
  for (const session of eligibleSessions) {
    const bandIndex = Math.floor(session.wpm / BAND_WIDTH_WPM);
    const comprehensions = comprehensionByBand.get(bandIndex) ?? [];
    comprehensions.push(session.comprehension);
    comprehensionByBand.set(bandIndex, comprehensions);
  }

  let highestQualifyingUpperBound: number | null = null;
  for (const [bandIndex, comprehensions] of comprehensionByBand) {
    if (median(comprehensions) < thresholdPercent) {
      continue;
    }
    const upperBound = (bandIndex + 1) * BAND_WIDTH_WPM;
    if (
      highestQualifyingUpperBound === null ||
      upperBound > highestQualifyingUpperBound
    ) {
      highestQualifyingUpperBound = upperBound;
    }
  }

  return highestQualifyingUpperBound;
}
