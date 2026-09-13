import type { RetestRecord } from "@/lib/storage/types";

const EXPIRY_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function pruneStaleRetests(
  retests: RetestRecord[],
  now: number,
): RetestRecord[] {
  return retests.filter(
    (retest) => now - retest.dueAtEpochMs < EXPIRY_DAYS * DAY_MS,
  );
}
