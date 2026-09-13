import type { SessionRecord } from "@/lib/storage/types";

export const MAX_PLAUSIBLE_WPM = 600;

export function isEligibleSession(session: SessionRecord): boolean {
  return session.wpm <= MAX_PLAUSIBLE_WPM && !session.focusLost;
}
