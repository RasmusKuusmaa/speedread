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
