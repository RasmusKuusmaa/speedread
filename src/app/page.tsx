"use client";

import Link from "next/link";
import { useState } from "react";
import { pickCalibrationPassageId } from "@/lib/calibration/pick-passage";
import { loadPassages } from "@/lib/content/loader";
import { useStore } from "@/lib/storage/store-provider";
import type { SessionRecord } from "@/lib/storage/types";

const RECALIBRATION_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;

function mostRecentCalibration(
  sessions: SessionRecord[],
): SessionRecord | null {
  let mostRecent: SessionRecord | null = null;
  for (const session of sessions) {
    if (session.sessionContext !== "calibration") {
      continue;
    }
    if (
      mostRecent === null ||
      session.timings.startedAtEpochMs > mostRecent.timings.startedAtEpochMs
    ) {
      mostRecent = session;
    }
  }
  return mostRecent;
}

function CalibrationPrompt() {
  const { store } = useStore();
  const [now] = useState(() => Date.now());

  if (store === null) {
    return null;
  }

  const lastCalibration = mostRecentCalibration(store.sessions);
  const isDue =
    lastCalibration === null ||
    now - lastCalibration.timings.startedAtEpochMs >= RECALIBRATION_INTERVAL_MS;
  if (!isDue) {
    return null;
  }

  const passageId = pickCalibrationPassageId(store.sessions);
  if (passageId === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Baseline</h2>
      <p className="font-sans text-base text-ink">
        {lastCalibration === null
          ? "Before you start practicing, read one short passage so your training has a fixed point to measure from. It's a baseline, not a test."
          : "It's been a couple of weeks since your last baseline. Read one short passage to keep it current."}
      </p>
      <Link
        href={`/session/${passageId}?context=calibration`}
        className="text-ink underline"
      >
        {lastCalibration === null
          ? "Start your baseline"
          : "Recheck your baseline"}
      </Link>
    </div>
  );
}

function DueRetests() {
  const { store } = useStore();
  const [now] = useState(() => Date.now());

  if (store === null) {
    return null;
  }

  const dueRetests = store.retests
    .filter((retest) => retest.dueAtEpochMs <= now)
    .sort((a, b) => a.dueAtEpochMs - b.dueAtEpochMs);

  if (dueRetests.length === 0) {
    return null;
  }

  const passageById = new Map(
    loadPassages().map((passage) => [passage.id, passage]),
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Due retests</h2>
      <ul className="flex flex-col gap-2">
        {dueRetests.map((retest) => (
          <li key={retest.id} className="font-sans text-base">
            <Link
              href={`/session/${retest.passageId}?context=retest&retestId=${retest.id}`}
              className="text-ink underline"
            >
              {passageById.get(retest.passageId)?.title ?? retest.passageId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-8 py-16">
      <div>
        <h1 className="font-serif text-3xl text-ink">Reading trainer</h1>
        <p className="mt-2 font-sans text-base text-muted">
          Train reading comprehension, and let your rate follow.
        </p>
      </div>
      <CalibrationPrompt />
      <DueRetests />
      <nav className="flex flex-col gap-3 font-sans text-base">
        <Link href="/practice" className="text-ink underline">
          Practice
        </Link>
        <Link href="/books" className="text-ink underline">
          Books
        </Link>
        <Link href="/progress" className="text-ink underline">
          Progress
        </Link>
        <Link href="/settings" className="text-ink underline">
          Settings
        </Link>
      </nav>
    </main>
  );
}
