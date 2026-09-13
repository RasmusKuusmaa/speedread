import type { Question, QuestionTaxonomy } from "@/lib/content/types";

export function scoreAnswers(questions: Question[], answers: number[]): number {
  if (questions.length === 0) {
    return 0;
  }
  const correct = questions.reduce((count, question, index) => {
    return answers[index] === question.answerIndex ? count + 1 : count;
  }, 0);
  return (correct / questions.length) * 100;
}

export type TaxonomyBreakdown = Partial<Record<QuestionTaxonomy, number>>;

export function scoreByTaxonomy(
  questions: Question[],
  answers: number[],
): TaxonomyBreakdown {
  const totals = new Map<
    QuestionTaxonomy,
    { correct: number; total: number }
  >();

  questions.forEach((question, index) => {
    const bucket = totals.get(question.taxonomy) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (answers[index] === question.answerIndex) {
      bucket.correct += 1;
    }
    totals.set(question.taxonomy, bucket);
  });

  const breakdown: TaxonomyBreakdown = {};
  for (const [taxonomy, { correct, total }] of totals) {
    breakdown[taxonomy] = (correct / total) * 100;
  }
  return breakdown;
}
