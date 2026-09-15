import { runMigrations } from "./migrations";
import type { Store } from "./types";

export const STORAGE_KEY = "reading-trainer";

export type StorageResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

export function readStore(): StorageResult<Store | null> {
  if (typeof window === "undefined") {
    return { ok: false, error: "localStorage is not available on the server" };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { ok: true, value: null };
    }
    return { ok: true, value: JSON.parse(raw) as Store };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to read store",
    };
  }
}

export function readRawStore(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export function writeStore(store: Store): StorageResult<void> {
  if (typeof window === "undefined") {
    return { ok: false, error: "localStorage is not available on the server" };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return { ok: true, value: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to write store",
    };
  }
}

export function defaultStore(): Store {
  return {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    settings: {
      pickerFilters: {
        textType: "all",
        domain: "all",
        lengthBand: "all",
        difficultyBand: "all",
      },
      sectionsPerSitting: 1,
      recallDepth: "brief",
      comprehensionThreshold: 80,
      fontSize: "medium",
      lineWidth: "medium",
    },
    sessions: [],
    retests: [],
    calibration: [],
    inProgressSession: null,
    bookProgress: [],
  };
}

// A store written by an older build can be missing fields that were added to the
// schema afterwards without a version bump, so every read backfills the defaults
// instead of trusting the parsed JSON to carry the full shape.
export function normalizeStore(store: Store): Store {
  const defaults = defaultStore();
  const candidate = store as Partial<Store>;
  return {
    // A store with no version at all predates versioning, so it enters the
    // migration chain at the bottom rather than being taken for a current one.
    schemaVersion: candidate.schemaVersion ?? 1,
    createdAt: candidate.createdAt ?? defaults.createdAt,
    settings: {
      ...defaults.settings,
      ...candidate.settings,
      pickerFilters: {
        ...defaults.settings.pickerFilters,
        ...candidate.settings?.pickerFilters,
      },
    },
    sessions: candidate.sessions ?? defaults.sessions,
    retests: candidate.retests ?? defaults.retests,
    calibration: candidate.calibration ?? defaults.calibration,
    inProgressSession:
      candidate.inProgressSession ?? defaults.inProgressSession,
    bookProgress: candidate.bookProgress ?? defaults.bookProgress,
  };
}

export function loadStore(): StorageResult<Store> {
  const result = readStore();
  if (!result.ok) {
    return result;
  }
  if (result.value !== null) {
    return { ok: true, value: runMigrations(normalizeStore(result.value)) };
  }

  const seeded = defaultStore();
  const writeResult = writeStore(seeded);
  if (!writeResult.ok) {
    return writeResult;
  }
  return { ok: true, value: seeded };
}
