import type { QuestionTaxonomy } from "@/lib/content/types";
import type { SessionRecord } from "@/lib/storage/types";
import { isEligibleSession } from "./eligibility";

export type TaxonomyAverages = Partial<Record<QuestionTaxonomy, number>>;

export function computeTaxonomyAverages(
  sessions: SessionRecord[],
): TaxonomyAverages {
  const totals = new Map<QuestionTaxonomy, { sum: number; count: number }>();

  for (const session of sessions) {
    if (!isEligibleSession(session)) {
      continue;
    }
    for (const [taxonomy, value] of Object.entries(
      session.taxonomyBreakdown,
    ) as [QuestionTaxonomy, number][]) {
      const bucket = totals.get(taxonomy) ?? { sum: 0, count: 0 };
      bucket.sum += value;
      bucket.count += 1;
      totals.set(taxonomy, bucket);
    }
  }

  const averages: TaxonomyAverages = {};
  for (const [taxonomy, { sum, count }] of totals) {
    averages[taxonomy] = sum / count;
  }
  return averages;
}
