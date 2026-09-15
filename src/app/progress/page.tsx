"use client";

import Link from "next/link";
import {
  DOMAINS,
  TEXT_TYPES,
  type Domain,
  type QuestionTaxonomy,
  type TextType,
} from "@/lib/content/types";
import { loadBooks } from "@/lib/content/book-loader";
import { completionPercent } from "@/lib/books/progress";
import { loadPassages } from "@/lib/content/loader";
import type { BookWithChunks } from "@/lib/content/types";
import { computeCumulativeWordsRead } from "@/lib/metrics/cumulative-words";
import { isEligibleSession } from "@/lib/metrics/eligibility";
import { computeGroupStats, type GroupStats } from "@/lib/metrics/group-stats";
import { getHoldingRateStatus } from "@/lib/metrics/holding-rate";
import {
  computeTaxonomyAverages,
  type TaxonomyAverages,
} from "@/lib/metrics/taxonomy-breakdown";
import { useStore } from "@/lib/storage/store-provider";
import type { BookProgress, SessionRecord } from "@/lib/storage/types";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const TAXONOMY_ORDER: QuestionTaxonomy[] = [
  "literal",
  "inference",
  "main_idea",
  "vocabulary",
];

const TAXONOMY_LABELS: Record<QuestionTaxonomy, string> = {
  literal: "Literal detail",
  inference: "Inference",
  main_idea: "Main idea",
  vocabulary: "Vocabulary",
};

function TaxonomyBars({ averages }: { averages: TaxonomyAverages }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">
        Comprehension by question type
      </h2>
      <ul className="flex flex-col gap-2">
        {TAXONOMY_ORDER.map((taxonomy) => {
          const value = averages[taxonomy];
          return (
            <li key={taxonomy} className="flex items-center gap-3">
              <span className="w-28 shrink-0 font-sans text-sm text-ink">
                {TAXONOMY_LABELS[taxonomy]}
              </span>
              <div className="h-2 flex-1 rounded bg-rule">
                <div
                  className="h-2 rounded bg-signal"
                  style={{ width: `${value ?? 0}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-sans text-sm text-muted">
                {value !== undefined ? `${Math.round(value)}%` : "No data"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HoldingRateHeadline({
  thresholdPercent,
  sessions,
}: {
  thresholdPercent: number;
  sessions: SessionRecord[];
}) {
  const status = getHoldingRateStatus(sessions, thresholdPercent);

  if (status.state === "insufficient-data") {
    return (
      <p className="font-serif text-2xl text-ink">
        Keep practicing. Your holding rate will show once you have completed{" "}
        {10 - status.eligibleCount} more eligible session
        {10 - status.eligibleCount === 1 ? "" : "s"}.
      </p>
    );
  }

  if (status.upperBoundWpm === null) {
    return (
      <p className="font-serif text-2xl text-ink">
        You haven&apos;t yet held {thresholdPercent}% comprehension at any speed
        you&apos;ve read at.
      </p>
    );
  }

  return (
    <p className="font-serif text-2xl text-ink">
      You hold {thresholdPercent}% comprehension up to {status.upperBoundWpm}{" "}
      words per minute.
    </p>
  );
}

function GroupBreakdown<Key extends string>({
  title,
  keys,
  stats,
}: {
  title: string;
  keys: Key[];
  stats: Partial<Record<Key, GroupStats>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">{title}</h2>
      <ul className="flex flex-col gap-2">
        {keys.map((key) => {
          const group = stats[key];
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 font-sans text-sm"
            >
              <span className="text-ink">{capitalize(key)}</span>
              <span className="text-muted">
                {group === undefined
                  ? "No data"
                  : `${Math.round(group.medianWpm)} wpm, ${Math.round(group.averageComprehension)}% comprehension`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const RECENT_SESSION_COUNT = 20;

function RecentSessions({
  sessions,
  passageById,
}: {
  sessions: SessionRecord[];
  passageById: Map<string, { title: string }>;
}) {
  const recent = [...sessions].reverse().slice(0, RECENT_SESSION_COUNT);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Recent sessions</h2>
      <ul className="flex flex-col gap-2">
        {recent.map((session) => (
          <li
            key={session.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule pb-2 font-sans text-sm"
          >
            <span className="text-ink">
              {passageById.get(session.passageId)?.title ?? session.passageId}
            </span>
            <span className="flex gap-3 text-muted">
              <span>
                {new Date(
                  session.timings.startedAtEpochMs,
                ).toLocaleDateString()}
              </span>
              <span>{capitalize(session.mode)}</span>
              <span>{Math.round(session.wpm)} wpm</span>
              <span>{Math.round(session.comprehension)}% comprehension</span>
              {!isEligibleSession(session) && (
                <span className="text-signal">Excluded</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CALIBRATION_CHART_WIDTH = 300;
const CALIBRATION_CHART_HEIGHT = 80;
const CALIBRATION_CHART_PADDING = 8;

function CalibrationChart({ sessions }: { sessions: SessionRecord[] }) {
  const calibrationSessions = sessions
    .filter((session) => session.sessionContext === "calibration")
    .sort((a, b) => a.timings.startedAtEpochMs - b.timings.startedAtEpochMs);

  if (calibrationSessions.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-sans text-sm text-muted">
          Calibration baseline over time
        </h2>
        <p className="font-sans text-sm text-muted">
          No calibration sessions yet.
        </p>
      </div>
    );
  }

  const wpmValues = calibrationSessions.map((session) => session.wpm);
  const minWpm = Math.min(...wpmValues);
  const maxWpm = Math.max(...wpmValues);
  const wpmRange = maxWpm - minWpm || 1;
  const innerWidth = CALIBRATION_CHART_WIDTH - CALIBRATION_CHART_PADDING * 2;
  const innerHeight = CALIBRATION_CHART_HEIGHT - CALIBRATION_CHART_PADDING * 2;

  const points = calibrationSessions.map((session, index) => {
    const x =
      calibrationSessions.length === 1
        ? CALIBRATION_CHART_WIDTH / 2
        : CALIBRATION_CHART_PADDING +
          (index / (calibrationSessions.length - 1)) * innerWidth;
    const y =
      CALIBRATION_CHART_HEIGHT -
      CALIBRATION_CHART_PADDING -
      ((session.wpm - minWpm) / wpmRange) * innerHeight;
    return { x, y };
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">
        Calibration baseline over time
      </h2>
      <svg
        viewBox={`0 0 ${CALIBRATION_CHART_WIDTH} ${CALIBRATION_CHART_HEIGHT}`}
        className="h-20 w-full max-w-sm"
        aria-hidden="true"
      >
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth={1.5}
        />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill="var(--color-signal)"
          />
        ))}
      </svg>
      <ul className="flex flex-col gap-2">
        {calibrationSessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between gap-3 font-sans text-sm"
          >
            <span className="text-ink">
              {new Date(session.timings.startedAtEpochMs).toLocaleDateString()}
            </span>
            <span className="text-muted">
              {Math.round(session.wpm)} wpm, {Math.round(session.comprehension)}
              % comprehension
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookProgressSection({
  books,
  bookProgress,
  sessions,
}: {
  books: BookWithChunks[];
  bookProgress: BookProgress[];
  sessions: SessionRecord[];
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-sm text-muted">Books</h2>
      <ul className="flex flex-col gap-2">
        {books.map((book) => {
          const progress = bookProgress.find(
            (entry) => entry.bookId === book.id,
          );
          const chunkIds = new Set(book.chunkPassageIds);
          // A sitting can cover several sections at once, so match on
          // everything it read rather than the section it started at.
          const bookSessions = sessions.filter(
            (session) =>
              chunkIds.has(session.passageId) ||
              session.chunkPassageIds.some((id) => chunkIds.has(id)),
          );
          const percentRead = Math.round(completionPercent(book, progress));
          const averageComprehension =
            bookSessions.length > 0
              ? bookSessions.reduce(
                  (sum, session) => sum + session.comprehension,
                  0,
                ) / bookSessions.length
              : null;

          const status =
            percentRead === 0
              ? "Not started"
              : percentRead === 100
                ? "Finished"
                : `${percentRead}% read`;

          return (
            <li
              key={book.id}
              className="flex items-center justify-between gap-3 font-sans text-sm"
            >
              <span className="text-ink">{book.title}</span>
              <span className="text-muted">
                {status}
                {averageComprehension !== null &&
                  `, ${Math.round(averageComprehension)}% comprehension`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ProgressPage() {
  const { store } = useStore();

  if (store === null) {
    return null;
  }

  if (store.sessions.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-8 py-16">
        <h1 className="font-serif text-2xl text-ink">Progress</h1>
        <p className="font-sans text-base text-muted">
          You haven&apos;t completed a session yet.{" "}
          <Link href="/practice" className="text-ink underline">
            Read your first passage
          </Link>{" "}
          to start building your progress.
        </p>
      </main>
    );
  }

  const passageById = new Map(
    loadPassages().map((passage) => [passage.id, passage]),
  );
  const domainStats = computeGroupStats<Domain>(
    store.sessions,
    (session) => passageById.get(session.passageId)?.domain ?? null,
  );
  const textTypeStats = computeGroupStats<TextType>(
    store.sessions,
    (session) => passageById.get(session.passageId)?.textType ?? null,
  );

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Progress</h1>
      <HoldingRateHeadline
        thresholdPercent={store.settings.comprehensionThreshold}
        sessions={store.sessions}
      />
      <p className="font-sans text-sm text-muted">
        {computeCumulativeWordsRead(store.sessions).toLocaleString()} words read
        in total.
      </p>
      <TaxonomyBars averages={computeTaxonomyAverages(store.sessions)} />
      <GroupBreakdown title="By domain" keys={DOMAINS} stats={domainStats} />
      <p className="font-sans text-sm text-muted">
        Reading rate varies by domain more than most readability measures
        predict, so comparing across domains is not meaningful.
      </p>
      <GroupBreakdown
        title="By text type"
        keys={TEXT_TYPES}
        stats={textTypeStats}
      />
      <RecentSessions sessions={store.sessions} passageById={passageById} />
      <CalibrationChart sessions={store.sessions} />
      <BookProgressSection
        books={loadBooks()}
        bookProgress={store.bookProgress}
        sessions={store.sessions}
      />
    </main>
  );
}
