import type { Store } from "./types";

interface Migration {
  fromVersion: number;
  migrate: (store: Store) => Store;
}

const migrations: Migration[] = [
  {
    // v2 records what a session read section by section, so a book can be
    // resumed anywhere rather than only at the next index.
    fromVersion: 1,
    migrate: (store) => ({
      ...store,
      schemaVersion: 2,
      sessions: store.sessions.map((session) => ({
        ...session,
        chunkPassageIds: Array.isArray(session.chunkPassageIds)
          ? session.chunkPassageIds
          : [],
      })),
      bookProgress: store.bookProgress.map((entry) => ({
        ...entry,
        chunks: Array.isArray(entry.chunks) ? entry.chunks : [],
      })),
    }),
  },
];

export function runMigrations(store: Store): Store {
  let current = store;
  for (const migration of migrations) {
    if (current.schemaVersion === migration.fromVersion) {
      current = migration.migrate(current);
    }
  }
  return current;
}
