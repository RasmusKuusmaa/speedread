"use client";

import { useCallback, useRef, useState } from "react";

export interface ReadingTimer {
  start: () => void;
  stop: () => number;
  elapsedMs: number | null;
}

export function useReadingTimer(): ReadingTimer {
  const startedAtRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const start = useCallback(() => {
    startedAtRef.current = performance.now();
    setElapsedMs(null);
  }, []);

  const stop = useCallback(() => {
    if (startedAtRef.current === null) {
      return 0;
    }
    const elapsed = performance.now() - startedAtRef.current;
    setElapsedMs(elapsed);
    return elapsed;
  }, []);

  return { start, stop, elapsedMs };
}
