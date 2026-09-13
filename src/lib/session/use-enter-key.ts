"use client";

import { useEffect } from "react";

export function useEnterKey(onEnter: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        onEnter();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEnter, enabled]);
}
