import type { Domain, TextType } from "@/lib/content/types";

export type SchemaVersion = 1;

export interface PickerFilters {
  textType: TextType | "all";
  domain: Domain | "all";
}

export interface Settings {
  pickerFilters: PickerFilters;
}

export interface SessionRecord {
  id: string;
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
