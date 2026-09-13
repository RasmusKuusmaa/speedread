import { rawPassages } from "@/content/passages";
import type {
  Domain,
  Passage,
  QuestionPool,
  QuestionTaxonomy,
  TextType,
} from "./types";

const TEXT_TYPES: TextType[] = ["expository", "narrative"];
const DOMAINS: Domain[] = [
  "physics",
  "chemistry",
  "materials",
  "biology",
  "history",
  "economics",
  "philosophy",
  "literature",
];
const TAXONOMIES: QuestionTaxonomy[] = [
  "literal",
  "inference",
  "main_idea",
  "vocabulary",
];
const POOLS: QuestionPool[] = ["first", "retest"];

function validateQuestion(raw: unknown, path: string): string[] {
  if (typeof raw !== "object" || raw === null) {
    return [`${path}: question is not an object`];
  }
  const question = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof question.id !== "string") {
    errors.push(`${path}.id must be a string`);
  }
  if (!TAXONOMIES.includes(question.taxonomy as QuestionTaxonomy)) {
    errors.push(`${path}.taxonomy must be one of ${TAXONOMIES.join(", ")}`);
  }
  if (typeof question.prompt !== "string") {
    errors.push(`${path}.prompt must be a string`);
  }
  if (
    !Array.isArray(question.options) ||
    question.options.length === 0 ||
    !question.options.every((option) => typeof option === "string")
  ) {
    errors.push(`${path}.options must be a non-empty array of strings`);
  }
  if (typeof question.answerIndex !== "number") {
    errors.push(`${path}.answerIndex must be a number`);
  } else if (
    Array.isArray(question.options) &&
    (question.answerIndex < 0 ||
      question.answerIndex >= question.options.length)
  ) {
    errors.push(`${path}.answerIndex is out of range`);
  }
  if (typeof question.evidence !== "object" || question.evidence === null) {
    errors.push(`${path}.evidence must be an object`);
  } else {
    const evidence = question.evidence as Record<string, unknown>;
    if (typeof evidence.paragraphIndex !== "number") {
      errors.push(`${path}.evidence.paragraphIndex must be a number`);
    }
    if (typeof evidence.start !== "number") {
      errors.push(`${path}.evidence.start must be a number`);
    }
    if (typeof evidence.end !== "number") {
      errors.push(`${path}.evidence.end must be a number`);
    }
  }
  if (!POOLS.includes(question.pool as QuestionPool)) {
    errors.push(`${path}.pool must be one of ${POOLS.join(", ")}`);
  }

  return errors;
}

function validatePassage(raw: unknown, index: number): string[] {
  const path = `passages[${index}]`;
  if (typeof raw !== "object" || raw === null) {
    return [`${path}: passage is not an object`];
  }
  const passage = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof passage.id !== "string") {
    errors.push(`${path}.id must be a string`);
  }
  if (typeof passage.title !== "string") {
    errors.push(`${path}.title must be a string`);
  }
  if (typeof passage.language !== "string") {
    errors.push(`${path}.language must be a string`);
  }
  if (typeof passage.source !== "string") {
    errors.push(`${path}.source must be a string`);
  }
  if (typeof passage.attribution !== "string") {
    errors.push(`${path}.attribution must be a string`);
  }
  if (typeof passage.licence !== "string") {
    errors.push(`${path}.licence must be a string`);
  }
  if (!TEXT_TYPES.includes(passage.textType as TextType)) {
    errors.push(`${path}.textType must be one of ${TEXT_TYPES.join(", ")}`);
  }
  if (!DOMAINS.includes(passage.domain as Domain)) {
    errors.push(`${path}.domain must be one of ${DOMAINS.join(", ")}`);
  }
  if (
    !Array.isArray(passage.body) ||
    passage.body.length === 0 ||
    !passage.body.every((paragraph) => typeof paragraph === "string")
  ) {
    errors.push(`${path}.body must be a non-empty array of strings`);
  }
  if (typeof passage.calibrationOnly !== "boolean") {
    errors.push(`${path}.calibrationOnly must be a boolean`);
  }
  if (!Array.isArray(passage.questions)) {
    errors.push(`${path}.questions must be an array`);
  } else {
    passage.questions.forEach((question, questionIndex) => {
      errors.push(
        ...validateQuestion(question, `${path}.questions[${questionIndex}]`),
      );
    });
  }

  return errors;
}

export function loadPassages(): Passage[] {
  const errors = rawPassages.flatMap((raw, index) =>
    validatePassage(raw, index),
  );

  if (errors.length > 0) {
    const message = `Invalid passage content:\n${errors.join("\n")}`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(message);
    }
    console.error(message);
  }

  return rawPassages.filter(
    (raw, index) => validatePassage(raw, index).length === 0,
  ) as Passage[];
}
