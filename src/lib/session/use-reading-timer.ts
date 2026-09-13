"use client";

import { useCallback, useRef, useState } from "react";

export interface ReadingTimer {
  start: (resumeElapsedMs?: number) => void;
  stop: () => number;
  elapsedMs: number | null;
}

export function useReadingTimer(): ReadingTimer {
  const startedAtRef = useRef<number | null>(null);
  const baselineMsRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const start = useCallback((resumeElapsedMs = 0) => {
    baselineMsRef.current = resumeElapsedMs;
    startedAtRef.current = performance.now();
    setElapsedMs(null);
  }, []);

  const stop = useCallback(() => {
    if (startedAtRef.current === null) {
      return 0;
    }
    const elapsed =
      baselineMsRef.current + (performance.now() - startedAtRef.current);
    setElapsedMs(elapsed);
    return elapsed;
  }, []);

  return { start, stop, elapsedMs };
}
