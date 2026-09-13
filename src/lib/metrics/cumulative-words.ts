import type { SessionRecord } from "@/lib/storage/types";

export function computeCumulativeWordsRead(sessions: SessionRecord[]): number {
  return sessions.reduce((total, session) => total + session.wordCount, 0);
}
