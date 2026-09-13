"use client";

import { useEffect, useRef, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function handleChange() {
      setPrefersReducedMotion(query.matches);
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

export function PageCountdown({
  durationMs,
  onExpire,
}: {
  durationMs: number;
  onExpire: () => void;
}) {
  const [depleted, setDepleted] = useState(false);
  const onExpireRef = useRef(onExpire);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timeout = setTimeout(() => onExpireRef.current(), durationMs);
    const frame = requestAnimationFrame(() => setDepleted(true));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [durationMs]);

  return (
    <div className="h-px w-full bg-rule">
      <div
        className="h-px bg-signal"
        style={
          prefersReducedMotion
            ? { width: "100%" }
            : {
                width: depleted ? "0%" : "100%",
                transitionProperty: "width",
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: "linear",
              }
        }
      />
    </div>
  );
}
