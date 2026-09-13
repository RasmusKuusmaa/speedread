import type { Store } from "./types";

interface Migration {
  fromVersion: number;
  migrate: (store: Store) => Store;
}

const migrations: Migration[] = [];

export function runMigrations(store: Store): Store {
  let current = store;
  for (const migration of migrations) {
    if (current.schemaVersion === migration.fromVersion) {
      current = migration.migrate(current);
    }
  }
  return current;
}
