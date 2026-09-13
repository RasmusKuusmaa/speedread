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
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    settings: {
      pickerFilters: { textType: "all", domain: "all" },
      recallDepth: "brief",
      comprehensionThreshold: 80,
    },
    sessions: [],
    retests: [],
    calibration: [],
    inProgressSession: null,
  };
}

export function loadStore(): StorageResult<Store> {
  const result = readStore();
  if (!result.ok) {
    return result;
  }
  if (result.value !== null) {
    return { ok: true, value: result.value };
  }

  const seeded = defaultStore();
  const writeResult = writeStore(seeded);
  if (!writeResult.ok) {
    return writeResult;
  }
  return { ok: true, value: seeded };
}
