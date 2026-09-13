"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  const [store, setStore] = useState<Store | null>(() => {
    const result = loadStore();
    return result.ok ? result.value : null;
  });

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
