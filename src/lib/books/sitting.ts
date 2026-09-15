import type {
  BookWithChunks,
  PassageWithWordCounts,
  Question,
  QuestionTaxonomy,
} from "@/lib/content/types";

export const MAX_SECTIONS_PER_SITTING = 4;

// A sitting asks the same number of questions however much was read, so one
// sitting's comprehension is comparable to the next and the holding rate keeps
// its meaning.
const TARGET_QUESTION_COUNT = 10;

export interface Sitting {
  passage: PassageWithWordCounts;
  sections: PassageWithWordCounts[];
  // Source section id for each question in passage.questions, same order.
  questionSectionIds: string[];
}

export interface SectionOutcome {
  passageId: string;
  questionsAsked: number;
  questionsCorrect: number;
  elapsedMs: number;
}

function firstPoolOf(section: PassageWithWordCounts): Question[] {
  return section.questions.filter((question) => question.pool === "first");
}

const TAXONOMY_ROTATION: QuestionTaxonomy[] = [
  "literal",
  "inference",
  "main_idea",
  "vocabulary",
];

// Take one tag at a time rather than a slice of the pool. Pools are authored
// literal first and vocabulary last, so any positional pick would hand back all
// literal questions and leave the taxonomy breakdown lopsided. The rotation
// carries on from where the previous section left it, so a sitting that takes
// only two or three questions per section still spans all four tags.
function pickAcrossTaxonomies(
  questions: Question[],
  count: number,
  startTurn: number,
): Question[] {
  if (count >= questions.length) {
    return questions;
  }

  const remaining = new Map<QuestionTaxonomy, Question[]>();
  for (const question of questions) {
    const bucket = remaining.get(question.taxonomy) ?? [];
    bucket.push(question);
    remaining.set(question.taxonomy, bucket);
  }

  const picked = new Set<Question>();
  const limit = startTurn + questions.length * TAXONOMY_ROTATION.length;
  for (let turn = startTurn; picked.size < count && turn < limit; turn += 1) {
    const taxonomy = TAXONOMY_ROTATION[turn % TAXONOMY_ROTATION.length];
    const next =
      taxonomy === undefined ? undefined : remaining.get(taxonomy)?.shift();
    if (next !== undefined) {
      picked.add(next);
    }
  }

  // Hand them back in authored order so the reader meets them as written.
  return questions.filter((question) => picked.has(question));
}

function allocateQuestionCounts(
  poolSizes: number[],
  weights: number[],
  target: number,
): number[] {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const capacity = poolSizes.reduce((sum, size) => sum + size, 0);
  const wanted = Math.min(target, capacity);

  // Every section read contributes at least one question, so no section can be
  // read and then go unmeasured in the side menu.
  const counts: number[] = poolSizes.map((size) => (size > 0 ? 1 : 0));
  let assigned = counts.reduce((sum, count) => sum + count, 0);

  // Hand out what remains to whichever section is furthest below the share its
  // length earns it, so the split follows how much of the sitting it was.
  while (assigned < wanted) {
    let bestIndex = -1;
    let bestShortfall = -Infinity;
    for (let index = 0; index < counts.length; index += 1) {
      const count = counts[index] ?? 0;
      if (count >= (poolSizes[index] ?? 0)) {
        continue;
      }
      const ideal =
        totalWeight > 0 ? ((weights[index] ?? 0) / totalWeight) * wanted : 0;
      const shortfall = ideal - count;
      if (shortfall > bestShortfall) {
        bestShortfall = shortfall;
        bestIndex = index;
      }
    }
    if (bestIndex === -1) {
      break;
    }
    counts[bestIndex] = (counts[bestIndex] ?? 0) + 1;
    assigned += 1;
  }

  return counts;
}

export function sectionsInSitting(
  book: BookWithChunks,
  fromIndex: number,
  sectionCount: number,
): PassageWithWordCounts[] {
  const start = Math.max(0, Math.min(fromIndex, book.chunks.length - 1));
  const count = Math.max(1, sectionCount);
  return book.chunks.slice(start, start + count);
}

export function composeSitting(
  book: BookWithChunks,
  fromIndex: number,
  sectionCount: number,
): Sitting {
  const sections = sectionsInSitting(book, fromIndex, sectionCount);
  const first = sections[0];
  const last = sections[sections.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error(`Book "${book.id}" has no section at index ${fromIndex}`);
  }

  const pools = sections.map(firstPoolOf);
  const counts = allocateQuestionCounts(
    pools.map((pool) => pool.length),
    sections.map((section) => section.wordCounts.total),
    TARGET_QUESTION_COUNT,
  );

  const body: string[] = [];
  const paragraphWordCounts: number[] = [];
  const questions: Question[] = [];
  const questionSectionIds: string[] = [];
  let paragraphOffset = 0;

  sections.forEach((section, index) => {
    body.push(...section.body);
    paragraphWordCounts.push(...section.wordCounts.paragraphs);
    for (const question of pickAcrossTaxonomies(
      pools[index] ?? [],
      counts[index] ?? 0,
      questions.length,
    )) {
      questions.push({
        ...question,
        // Evidence is authored against its own section, so it has to move by
        // the paragraphs the earlier sections contributed.
        evidence: {
          ...question.evidence,
          paragraphIndex: question.evidence.paragraphIndex + paragraphOffset,
        },
      });
      questionSectionIds.push(section.id);
    }
    paragraphOffset += section.body.length;
  });

  const passage: PassageWithWordCounts = {
    ...first,
    // Keeping the first section's id means a sitting still resolves to a real
    // passage for the domain and text-type breakdowns on the progress page.
    id: first.id,
    title:
      sections.length === 1 ? first.title : `${first.title} to ${last.title}`,
    body,
    questions,
    wordCounts: {
      paragraphs: paragraphWordCounts,
      total: paragraphWordCounts.reduce((sum, count) => sum + count, 0),
    },
  };

  return { passage, sections, questionSectionIds };
}

export function splitSittingOutcome(
  sitting: Sitting,
  answers: number[],
  elapsedMs: number,
): SectionOutcome[] {
  const totalWords = sitting.sections.reduce(
    (sum, section) => sum + section.wordCounts.total,
    0,
  );

  return sitting.sections.map((section) => {
    let questionsAsked = 0;
    let questionsCorrect = 0;

    sitting.questionSectionIds.forEach((sectionId, index) => {
      if (sectionId !== section.id) {
        return;
      }
      questionsAsked += 1;
      if (answers[index] === sitting.passage.questions[index]?.answerIndex) {
        questionsCorrect += 1;
      }
    });

    return {
      passageId: section.id,
      questionsAsked,
      questionsCorrect,
      // One clock covers the whole sitting, so a section's share of the time is
      // its share of the words. It is an estimate, not a measurement.
      elapsedMs:
        totalWords > 0
          ? Math.round(elapsedMs * (section.wordCounts.total / totalWords))
          : 0,
    };
  });
}
