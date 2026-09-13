import type { SessionRecord } from "@/lib/storage/types";
import { isEligibleSession } from "./eligibility";

export interface GroupStats {
  medianWpm: number;
  averageComprehension: number;
  sessionCount: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }
  return sorted[middle]!;
}

export function computeGroupStats<Key extends string>(
  sessions: SessionRecord[],
  keyForSession: (session: SessionRecord) => Key | null,
): Partial<Record<Key, GroupStats>> {
  const grouped = new Map<Key, SessionRecord[]>();
  for (const session of sessions) {
    if (!isEligibleSession(session)) {
      continue;
    }
    const key = keyForSession(session);
    if (key === null) {
      continue;
    }
    const group = grouped.get(key) ?? [];
    group.push(session);
    grouped.set(key, group);
  }

  const result: Partial<Record<Key, GroupStats>> = {};
  for (const [key, group] of grouped) {
    result[key] = {
      medianWpm: median(group.map((session) => session.wpm)),
      averageComprehension:
        group.reduce((sum, session) => sum + session.comprehension, 0) /
        group.length,
      sessionCount: group.length,
    };
  }
  return result;
}
