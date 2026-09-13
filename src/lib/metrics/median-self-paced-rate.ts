import type { SessionRecord } from "@/lib/storage/types";
import { isEligibleSession } from "./eligibility";

const SESSION_WINDOW = 10;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }
  return sorted[middle]!;
}

export function computeMedianSelfPacedRate(
  sessions: SessionRecord[],
): number | null {
  const eligibleSelfPaced = sessions.filter(
    (session) => session.mode === "self-paced" && isEligibleSession(session),
  );
  const recentSessions = eligibleSelfPaced.slice(-SESSION_WINDOW);
  if (recentSessions.length === 0) {
    return null;
  }
  return median(recentSessions.map((session) => session.wpm));
}
