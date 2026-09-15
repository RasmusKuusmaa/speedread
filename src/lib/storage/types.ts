import type { DifficultyBand } from "@/lib/content/difficulty";
import type { LengthBand } from "@/lib/content/length";
import type { Domain, QuestionTaxonomy, TextType } from "@/lib/content/types";

export type SchemaVersion = 1 | 2;

export interface PickerFilters {
  textType: TextType | "all";
  domain: Domain | "all";
  lengthBand: LengthBand | "all";
  difficultyBand: DifficultyBand | "all";
}

export type RecallDepth = "full" | "brief" | "off";

export type FontSize = "small" | "medium" | "large";

export type LineWidth = "narrow" | "medium" | "wide";

export interface Settings {
  pickerFilters: PickerFilters;
  recallDepth: RecallDepth;
  comprehensionThreshold: number;
  fontSize: FontSize;
  lineWidth: LineWidth;
}

export type SessionMode = "self-paced" | "paced";

export type SessionContext = "practice" | "retest" | "calibration" | "book";

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
  // Book sections covered by this sitting, in reading order. Empty for
  // sessions that did not come from a book.
  chunkPassageIds: string[];
}

export interface RetestRecord {
  id: string;
  passageId: string;
  sourceSessionId: string;
  dueAtEpochMs: number;
}

export interface CalibrationRecord {
  id: string;
}

export interface InProgressSession {
  passageId: string;
  startedAtEpochMs: number;
}

export interface BookChunkProgress {
  passageId: string;
  readCount: number;
  lastReadAtEpochMs: number;
  questionsAsked: number;
  questionsCorrect: number;
  totalElapsedMs: number;
}

export interface BookProgress {
  bookId: string;
  currentChunkIndex: number;
  startedAtEpochMs: number;
  completedAtEpochMs: number | null;
  chunks: BookChunkProgress[];
}

export interface Store {
  schemaVersion: SchemaVersion;
  createdAt: string;
  settings: Settings;
  sessions: SessionRecord[];
  retests: RetestRecord[];
  calibration: CalibrationRecord[];
  inProgressSession: InProgressSession | null;
  bookProgress: BookProgress[];
}
