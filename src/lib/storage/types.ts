import type { Domain, QuestionTaxonomy, TextType } from "@/lib/content/types";

export type SchemaVersion = 1;

export interface PickerFilters {
  textType: TextType | "all";
  domain: Domain | "all";
}

export type RecallDepth = "full" | "brief" | "off";

export interface Settings {
  pickerFilters: PickerFilters;
  recallDepth: RecallDepth;
  comprehensionThreshold: number;
}

export type SessionMode = "self-paced" | "paced";

export type SessionContext = "practice" | "retest" | "calibration";

export type MissClassification = "forgot" | "misunderstood";

export interface SessionTimings {
  startedAtEpochMs: number;
  elapsedMs: number;
}

export interface SessionRecord {
  id: string;
  passageId: string;
  sessionContext: SessionContext;
  mode: SessionMode;
  timings: SessionTimings;
  wordCount: number;
  wpm: number;
  comprehension: number;
  taxonomyBreakdown: Partial<Record<QuestionTaxonomy, number>>;
  focusLost: boolean;
  missClassifications: Record<string, MissClassification>;
  recallText: string | null;
  recallDepth: RecallDepth;
  unfinishedPageCount: number;
}

export interface RetestRecord {
  id: string;
}

export interface CalibrationRecord {
  id: string;
}

export interface InProgressSession {
  passageId: string;
  startedAtEpochMs: number;
}

export interface Store {
  schemaVersion: SchemaVersion;
  createdAt: string;
  settings: Settings;
  sessions: SessionRecord[];
  retests: RetestRecord[];
  calibration: CalibrationRecord[];
  inProgressSession: InProgressSession | null;
}
