"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadStore, writeStore } from "./storage";
import type { Store } from "./types";

interface StoreContextValue {
  store: Store | null;
  update: (updater: (store: Store) => Store) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);

  // Server-rendered markup always sees a null store (no localStorage), so the
  // real value is loaded after mount rather than in the initial render — doing
  // it synchronously would render different content on the client's hydration
  // pass than what the server sent, and React would flag the mismatch.
  useEffect(() => {
    const result = loadStore();
    if (result.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, not a derivable value
      setStore(result.value);
    }
  }, []);

  const update = useCallback((updater: (store: Store) => Store) => {
    setStore((current) => {
      if (current === null) {
        return current;
      }
      const next = updater(current);
      writeStore(next);
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{ store, update }}>
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
