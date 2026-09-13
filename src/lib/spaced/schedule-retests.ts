import type { RetestRecord } from "@/lib/storage/types";

const RETEST_INTERVALS_DAYS = [2, 7];
const DAY_MS = 24 * 60 * 60 * 1000;

export function scheduleRetests(
  sourceSessionId: string,
  passageId: string,
  completedAtEpochMs: number,
): RetestRecord[] {
  return RETEST_INTERVALS_DAYS.map((days) => ({
    id: crypto.randomUUID(),
    passageId,
    sourceSessionId,
    dueAtEpochMs: completedAtEpochMs + days * DAY_MS,
  }));
}
