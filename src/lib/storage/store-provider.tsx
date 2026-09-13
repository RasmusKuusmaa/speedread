"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { pruneStaleRetests } from "@/lib/spaced/expire-retests";
import { defaultStore, loadStore, writeStore } from "./storage";
import type { Store } from "./types";

interface StoreContextValue {
  store: Store | null;
  storageError: string | null;
  update: (updater: (store: Store) => Store) => void;
  resetStore: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Server-rendered markup always sees a null store (no localStorage), so the
  // real value is loaded after mount rather than in the initial render — doing
  // it synchronously would render different content on the client's hydration
  // pass than what the server sent, and React would flag the mismatch.
  useEffect(() => {
    const result = loadStore();
    if (!result.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, not a derivable value
      setStorageError(result.error);
      return;
    }
    const prunedRetests = pruneStaleRetests(result.value.retests, Date.now());
    const value =
      prunedRetests.length === result.value.retests.length
        ? result.value
        : { ...result.value, retests: prunedRetests };
    if (value !== result.value) {
      writeStore(value);
    }
    setStore(value);
  }, []);

  const update = useCallback((updater: (store: Store) => Store) => {
    setStore((current) => {
      if (current === null) {
        return current;
      }
      const next = updater(current);
      const writeResult = writeStore(next);
      if (!writeResult.ok) {
        setStorageError(writeResult.error);
      }
      return next;
    });
  }, []);

  const resetStore = useCallback(() => {
    const fresh = defaultStore();
    writeStore(fresh);
    setStorageError(null);
    setStore(fresh);
  }, []);

  return (
    <StoreContext.Provider value={{ store, storageError, update, resetStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
