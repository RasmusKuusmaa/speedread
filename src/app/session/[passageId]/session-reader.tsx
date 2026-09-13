"use client";

import { useEffect, useRef, useState } from "react";
import { scoreDifficulty } from "@/lib/content/difficulty";
import type {
  PassageWithWordCounts,
  Question,
  QuestionTaxonomy,
} from "@/lib/content/types";
import { computeWpm } from "@/lib/session/metrics";
import {
  scoreAnswers,
  scoreByTaxonomy,
  type TaxonomyBreakdown,
} from "@/lib/session/scoring";
import {
  createSeed,
  seedForQuestion,
  shuffledOrder,
} from "@/lib/session/shuffle";
import { useReadingTimer } from "@/lib/session/use-reading-timer";
import { useStore } from "@/lib/storage/store-provider";
import type { RecallDepth } from "@/lib/storage/types";
import { QuestionCard } from "./question-card";
import type { SessionContext } from "./types";

type Phase =
  "start" | "reading" | "recall" | "questions" | "finished" | "review";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StartScreen({
  passage,
  onStart,
}: {
  passage: PassageWithWordCounts;
  onStart: () => void;
}) {
  const difficulty = scoreDifficulty(passage.body, passage.language);

  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      <h1 className="font-serif text-2xl text-ink">{passage.title}</h1>
      <p className="flex gap-3 font-sans text-sm text-muted">
        <span>{passage.wordCounts.total} words</span>
        <span>{capitalize(difficulty.band)}</span>
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
      >
        Start reading
      </button>
    </main>
  );
}

function ReadingScreen({
  paragraphs,
  onFinish,
}: {
  paragraphs: string[];
  onFinish: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col py-16">
      <article className="mx-auto flex max-w-[66ch] flex-col gap-6 font-serif text-[19px] leading-[1.65] text-ink">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <div className="mx-auto mt-10 w-full max-w-[66ch]">
        <button
          type="button"
          onClick={onFinish}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          I&apos;ve finished reading
        </button>
      </div>
    </main>
  );
}

function RecallScreen({
  depth,
  onContinue,
}: {
  depth: "full" | "brief";
  onContinue: (recallText: string) => void;
}) {
  const [recallText, setRecallText] = useState("");

  return (
    <main className="flex flex-1 flex-col gap-6 py-16">
      <p className="font-sans text-base text-ink">
        {depth === "full"
          ? "What do you remember from what you just read?"
          : "In one sentence, what was the main point?"}
      </p>
      {depth === "full" ? (
        <textarea
          value={recallText}
          onChange={(event) => setRecallText(event.target.value)}
          rows={8}
          className="mx-auto w-full max-w-[66ch] rounded border border-rule p-3 font-serif text-base text-ink"
        />
      ) : (
        <input
          type="text"
          value={recallText}
          onChange={(event) => setRecallText(event.target.value)}
          className="mx-auto w-full max-w-[66ch] rounded border border-rule p-3 font-serif text-base text-ink"
        />
      )}
      <div className="mx-auto w-full max-w-[66ch]">
        <button
          type="button"
          onClick={() => onContinue(recallText)}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Continue
        </button>
      </div>
    </main>
  );
}

function QuestionScreen({
  question,
  sessionSeed,
  onAnswer,
}: {
  question: Question;
  sessionSeed: number;
  onAnswer: (optionIndex: number) => void;
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  );
  const [locked, setLocked] = useState(false);
  const optionOrder = shuffledOrder(
    question.options.length,
    seedForQuestion(sessionSeed, question.id),
  );

  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      <QuestionCard
        question={question}
        optionOrder={optionOrder}
        selectedOptionIndex={selectedOptionIndex}
        locked={locked}
        onSelect={setSelectedOptionIndex}
      />
      <div className="mx-auto w-full max-w-[66ch]">
        <button
          type="button"
          disabled={selectedOptionIndex === null || locked}
          onClick={() => {
            if (selectedOptionIndex !== null && !locked) {
              setLocked(true);
              onAnswer(selectedOptionIndex);
            }
          }}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </main>
  );
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

function FinishedScreen({
  wpm,
  comprehension,
  taxonomyBreakdown,
  focusLost,
  hasQuestions,
  onReview,
}: {
  wpm: number;
  comprehension: number | null;
  taxonomyBreakdown: TaxonomyBreakdown;
  focusLost: boolean;
  hasQuestions: boolean;
  onReview: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      {comprehension !== null && (
        <p className="font-sans text-base text-ink">
          You held {Math.round(comprehension)}% comprehension.
        </p>
      )}
      {TAXONOMY_ORDER.some(
        (taxonomy) => taxonomyBreakdown[taxonomy] !== undefined,
      ) && (
        <ul className="flex flex-col gap-1 font-sans text-sm text-muted">
          {TAXONOMY_ORDER.filter(
            (taxonomy) => taxonomyBreakdown[taxonomy] !== undefined,
          ).map((taxonomy) => (
            <li key={taxonomy}>
              {TAXONOMY_LABELS[taxonomy]}:{" "}
              {Math.round(taxonomyBreakdown[taxonomy]!)}%
            </li>
          ))}
        </ul>
      )}
      <p className="font-sans text-sm text-muted">
        You read at {wpm} words per minute.
      </p>
      {focusLost && (
        <p className="font-sans text-sm text-muted">
          This session may be excluded from your metrics because you left the
          tab while reading.
        </p>
      )}
      {hasQuestions && (
        <button
          type="button"
          onClick={onReview}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Show me what I missed
        </button>
      )}
    </main>
  );
}

function EvidenceParagraph({
  text,
  range,
}: {
  text: string;
  range: { start: number; end: number } | null;
}) {
  if (range === null) {
    return <p>{text}</p>;
  }
  return (
    <p>
      {text.slice(0, range.start)}
      <mark className="bg-signal/20 text-ink">
        {text.slice(range.start, range.end)}
      </mark>
      {text.slice(range.end)}
    </p>
  );
}

function ReviewScreen({
  paragraphs,
  questions,
  answers,
}: {
  paragraphs: string[];
  questions: Question[];
  answers: number[];
}) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const selectedQuestion = questions[selectedQuestionIndex];

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Review</h1>
      <ol className="flex flex-col gap-6">
        {questions.map((question, index) => {
          const chosenIndex = answers[index];
          const isCorrect = chosenIndex === question.answerIndex;
          return (
            <li key={question.id} className="border-b border-rule pb-6">
              <button
                type="button"
                onClick={() => setSelectedQuestionIndex(index)}
                aria-pressed={index === selectedQuestionIndex}
                className={`flex w-full flex-col gap-2 text-left ${
                  index === selectedQuestionIndex ? "text-ink" : ""
                }`}
              >
                <p className="font-serif text-base text-ink">
                  {question.prompt}
                </p>
                <p className="font-sans text-sm text-muted">
                  Your answer:{" "}
                  {chosenIndex !== undefined
                    ? question.options[chosenIndex]
                    : "—"}
                </p>
                {!isCorrect && (
                  <p className="font-sans text-sm text-muted">
                    Correct answer: {question.options[question.answerIndex]}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {selectedQuestion && (
        <article className="mx-auto flex max-w-[66ch] flex-col gap-6 border-t border-rule pt-8 font-serif text-[19px] leading-[1.65] text-ink">
          {paragraphs.map((paragraph, index) => (
            <EvidenceParagraph
              key={index}
              text={paragraph}
              range={
                index === selectedQuestion.evidence.paragraphIndex
                  ? {
                      start: selectedQuestion.evidence.start,
                      end: selectedQuestion.evidence.end,
                    }
                  : null
              }
            />
          ))}
        </article>
      )}
    </main>
  );
}

export function SessionReader({
  passage,
  sessionContext,
}: {
  passage: PassageWithWordCounts;
  sessionContext: SessionContext;
}) {
  const { store, update } = useStore();
  const [phase, setPhase] = useState<Phase>("start");
  const [focusLost, setFocusLost] = useState(false);
  const recallRef = useRef<{ text: string; depth: RecallDepth } | null>(null);
  const hasCheckedResumeRef = useRef(false);
  const timer = useReadingTimer();
  const recallDepth =
    sessionContext === "practice"
      ? (store?.settings.recallDepth ?? "brief")
      : "full";

  const questionPool = sessionContext === "retest" ? "retest" : "first";
  const questions = passage.questions.filter(
    (question) => question.pool === questionPool,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed] = useState(() => createSeed());
  const [comprehension, setComprehension] = useState<number | null>(null);
  const [taxonomyBreakdown, setTaxonomyBreakdown] = useState<TaxonomyBreakdown>(
    {},
  );
  const [answers, setAnswers] = useState<number[]>([]);
  const answersRef = useRef<number[]>([]);

  useEffect(() => {
    if (phase !== "reading") {
      return;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        setFocusLost(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase]);

  useEffect(() => {
    if (store === null || hasCheckedResumeRef.current) {
      return;
    }
    hasCheckedResumeRef.current = true;

    const inProgress = store.inProgressSession;
    if (inProgress !== null && inProgress.passageId === passage.id) {
      timer.start(Date.now() - inProgress.startedAtEpochMs);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time resume from a persisted, client-only session after mount, not a derivable value
      setFocusLost(true);
      setPhase("reading");
    }
  }, [store, passage.id, timer]);

  switch (phase) {
    case "start":
      return (
        <StartScreen
          passage={passage}
          onStart={() => {
            setFocusLost(false);
            timer.start();
            update((current) => ({
              ...current,
              inProgressSession: {
                passageId: passage.id,
                startedAtEpochMs: Date.now(),
              },
            }));
            setPhase("reading");
          }}
        />
      );
    case "reading":
      return (
        <ReadingScreen
          paragraphs={passage.body}
          onFinish={() => {
            timer.stop();
            update((current) => ({ ...current, inProgressSession: null }));
            setPhase(
              recallDepth === "off"
                ? questions.length > 0
                  ? "questions"
                  : "finished"
                : "recall",
            );
          }}
        />
      );
    case "recall": {
      const depth = recallDepth === "off" ? "brief" : recallDepth;
      return (
        <RecallScreen
          depth={depth}
          onContinue={(text) => {
            recallRef.current = { text, depth };
            setPhase(questions.length > 0 ? "questions" : "finished");
          }}
        />
      );
    }
    case "questions": {
      const question = questions[questionIndex];
      if (!question) {
        return null;
      }
      return (
        <QuestionScreen
          key={question.id}
          question={question}
          sessionSeed={sessionSeed}
          onAnswer={(optionIndex) => {
            answersRef.current.push(optionIndex);
            if (questionIndex + 1 < questions.length) {
              setQuestionIndex((index) => index + 1);
            } else {
              setAnswers(answersRef.current);
              setComprehension(scoreAnswers(questions, answersRef.current));
              setTaxonomyBreakdown(
                scoreByTaxonomy(questions, answersRef.current),
              );
              setPhase("finished");
            }
          }}
        />
      );
    }
    case "finished":
      return (
        <FinishedScreen
          wpm={Math.round(
            computeWpm(passage.wordCounts.total, timer.elapsedMs ?? 0),
          )}
          comprehension={comprehension}
          taxonomyBreakdown={taxonomyBreakdown}
          focusLost={focusLost}
          hasQuestions={questions.length > 0}
          onReview={() => setPhase("review")}
        />
      );
    case "review":
      return (
        <ReviewScreen
          paragraphs={passage.body}
          questions={questions}
          answers={answers}
        />
      );
  }
}
