"use client";

import {
  DOMAINS,
  TEXT_TYPES,
  type Domain,
  type QuestionTaxonomy,
  type TextType,
} from "@/lib/content/types";
import { loadPassages } from "@/lib/content/loader";
import { computeCumulativeWordsRead } from "@/lib/metrics/cumulative-words";
import { isEligibleSession } from "@/lib/metrics/eligibility";
import { computeGroupStats, type GroupStats } from "@/lib/metrics/group-stats";
import { getHoldingRateStatus } from "@/lib/metrics/holding-rate";
import {
  computeTaxonomyAverages,
  type TaxonomyAverages,
} from "@/lib/metrics/taxonomy-breakdown";
import { useStore } from "@/lib/storage/store-provider";
import type { SessionRecord } from "@/lib/storage/types";

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
        You haven&apos;t yet held {thresholdPercent}% comprehension at any
        speed you&apos;ve read at.
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

export default function ProgressPage() {
  const { store } = useStore();

  if (store === null) {
    return null;
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
        {computeCumulativeWordsRead(store.sessions).toLocaleString()} words
        read in total.
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
    </main>
  );
}
