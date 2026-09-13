export type SchemaVersion = 1;

export type Settings = Record<string, never>;

export interface SessionRecord {
  id: string;
}

export interface RetestRecord {
  id: string;
}

export interface CalibrationRecord {
  id: string;
}

export interface Store {
  schemaVersion: SchemaVersion;
  createdAt: string;
  settings: Settings;
  sessions: SessionRecord[];
  retests: RetestRecord[];
  calibration: CalibrationRecord[];
}
