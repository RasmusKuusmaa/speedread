"use client";

import { useEffect, useState } from "react";

export function PageCountdown({ durationMs }: { durationMs: number }) {
  const [depleted, setDepleted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDepleted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="h-px w-full bg-rule">
      <div
        className="h-px bg-signal"
        style={{
          width: depleted ? "0%" : "100%",
          transitionProperty: "width",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: "linear",
        }}
      />
    </div>
  );
}
