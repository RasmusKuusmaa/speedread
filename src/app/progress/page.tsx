"use client";

import type { QuestionTaxonomy } from "@/lib/content/types";
import { getHoldingRateStatus } from "@/lib/metrics/holding-rate";
import {
  computeTaxonomyAverages,
  type TaxonomyAverages,
} from "@/lib/metrics/taxonomy-breakdown";
import { useStore } from "@/lib/storage/store-provider";
import type { SessionRecord } from "@/lib/storage/types";

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

export default function ProgressPage() {
  const { store } = useStore();

  if (store === null) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Progress</h1>
      <HoldingRateHeadline
        thresholdPercent={store.settings.comprehensionThreshold}
        sessions={store.sessions}
      />
      <TaxonomyBars averages={computeTaxonomyAverages(store.sessions)} />
    </main>
  );
}
