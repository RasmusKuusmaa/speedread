import { runMigrations } from "./migrations";
import { writeStore, type StorageResult } from "./storage";
import type { Store } from "./types";

const CURRENT_SCHEMA_VERSION = 1;

function isStoreShape(value: unknown): value is Store {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.schemaVersion === "number" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.settings === "object" &&
    candidate.settings !== null &&
    Array.isArray(candidate.sessions) &&
    Array.isArray(candidate.retests) &&
    Array.isArray(candidate.calibration)
  );
}

export function importStore(json: string): StorageResult<Store> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }

  if (!isStoreShape(parsed)) {
    return {
      ok: false,
      error: "That file does not match the reading trainer data shape.",
    };
  }

  if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: "That file was exported from a newer version of the app.",
    };
  }

  const migrated = runMigrations(parsed);

  const writeResult = writeStore(migrated);
  if (!writeResult.ok) {
    return writeResult;
  }

  return { ok: true, value: migrated };
}
