"use client";

import { useEffect, useRef, useState } from "react";

export function PageCountdown({
  durationMs,
  onExpire,
}: {
  durationMs: number;
  onExpire: () => void;
}) {
  const [depleted, setDepleted] = useState(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDepleted(true));
    const timeout = setTimeout(() => onExpireRef.current(), durationMs);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [durationMs]);

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
