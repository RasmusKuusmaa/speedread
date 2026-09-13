export type TextType = "expository" | "narrative";

export const TEXT_TYPES: TextType[] = ["expository", "narrative"];

export type Domain =
  | "physics"
  | "chemistry"
  | "materials"
  | "biology"
  | "history"
  | "economics"
  | "philosophy"
  | "literature"
  | "engineering";

export const DOMAINS: Domain[] = [
  "physics",
  "chemistry",
  "materials",
  "biology",
  "history",
  "economics",
  "philosophy",
  "literature",
  "engineering",
];

export type QuestionTaxonomy =
  "literal" | "inference" | "main_idea" | "vocabulary";

export type QuestionPool = "first" | "retest";

export interface EvidenceSpan {
  paragraphIndex: number;
  start: number;
  end: number;
}

export interface Question {
  id: string;
  taxonomy: QuestionTaxonomy;
  prompt: string;
  options: string[];
  answerIndex: number;
  evidence: EvidenceSpan;
  pool: QuestionPool;
}

export interface Passage {
  id: string;
  title: string;
  language: string;
  source: string;
  attribution: string;
  licence: string;
  textType: TextType;
  domain: Domain;
  body: string[];
  questions: Question[];
  calibrationOnly: boolean;
}

export interface PassageWordCounts {
  paragraphs: number[];
  total: number;
}

export interface PassageWithWordCounts extends Passage {
  wordCounts: PassageWordCounts;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  source: string;
  attribution: string;
  licence: string;
  textType: TextType;
  domain: Domain;
  language: string;
  chunkPassageIds: string[];
}

export interface BookWithChunks extends Book {
  chunks: PassageWithWordCounts[];
}
