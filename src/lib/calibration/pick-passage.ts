import { loadPassages } from "@/lib/content/loader";
import type { SessionRecord } from "@/lib/storage/types";

export function pickCalibrationPassageId(
  sessions: SessionRecord[],
): string | null {
  const calibrationPassages = loadPassages().filter(
    (passage) => passage.calibrationOnly,
  );
  if (calibrationPassages.length === 0) {
    return null;
  }

  const completedCount = sessions.filter(
    (session) => session.sessionContext === "calibration",
  ).length;
  return calibrationPassages[completedCount % calibrationPassages.length]!.id;
}
