"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { scoreDifficulty } from "@/lib/content/difficulty";
import type {
  PassageWithWordCounts,
  Question,
  QuestionTaxonomy,
} from "@/lib/content/types";
import { lastComprehensionForSpeed } from "@/lib/metrics/comprehension-for-speed";
import { computeMedianSelfPacedRate } from "@/lib/metrics/median-self-paced-rate";
import { paginatePassage, type Page } from "@/lib/paced/paginate";
import { computeWpm } from "@/lib/session/metrics";
import {
  FONT_SIZE_CLASSES,
  LINE_WIDTH_CLASSES,
} from "@/lib/session/reading-surface";
import { useEnterKey } from "@/lib/session/use-enter-key";
import { scheduleRetests } from "@/lib/spaced/schedule-retests";
import { PageCountdown } from "./page-countdown";
import { speedOptionsFor, SpeedPicker } from "./speed-picker";
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
import type {
  FontSize,
  LineWidth,
  MissClassification,
  RecallDepth,
  SessionContext,
  SessionMode,
  SessionRecord,
} from "@/lib/storage/types";
import { QuestionCard } from "./question-card";

type Phase =
  "start" | "reading" | "recall" | "questions" | "finished" | "review";

interface BookNavigation {
  isLastChunk: boolean;
  onContinue: () => void;
}

// Defensive fallback; paced mode always sets a target wpm before reading starts.
const FALLBACK_PACED_WPM = 300;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StartScreen({
  passage,
  mode,
  medianWpm,
  sessions,
  sessionContext,
  onStart,
}: {
  passage: PassageWithWordCounts;
  mode: SessionMode;
  medianWpm: number | null;
  sessions: SessionRecord[];
  sessionContext: SessionContext;
  onStart: (targetWpm: number | null) => void;
}) {
  const difficulty = scoreDifficulty(passage.body, passage.language);
  const speedOptions = useMemo(() => speedOptionsFor(medianWpm), [medianWpm]);
  const [selectedWpm, setSelectedWpm] = useState(speedOptions[0]!.wpm);
  const [customValue, setCustomValue] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const targetWpm = isCustom ? Number(customValue) : selectedWpm;
  const hasValidTarget =
    mode !== "paced" || (Number.isFinite(targetWpm) && targetWpm > 0);
  const pastComprehension =
    mode === "paced" && hasValidTarget
      ? lastComprehensionForSpeed(sessions, targetWpm)
      : null;

  useEnterKey(
    () => onStart(mode === "paced" ? targetWpm : null),
    hasValidTarget,
  );

  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      <h1 className="font-serif text-2xl text-ink">{passage.title}</h1>
      <p className="flex gap-3 font-sans text-sm text-muted">
        <span>{passage.wordCounts.total} words</span>
        <span>{capitalize(difficulty.band)}</span>
      </p>
      {mode === "paced" && (
        <SpeedPicker
          options={speedOptions}
          selectedWpm={selectedWpm}
          isCustom={isCustom}
          customValue={customValue}
          onSelectOption={(wpm) => {
            setIsCustom(false);
            setSelectedWpm(wpm);
          }}
          onCustomChange={(value) => {
            setIsCustom(true);
            setCustomValue(value);
          }}
        />
      )}
      {pastComprehension !== null && (
        <p className="font-sans text-sm text-muted">
          You held {Math.round(pastComprehension)}% comprehension the last
          time you read near this speed.
        </p>
      )}
      <button
        type="button"
        disabled={!hasValidTarget}
        onClick={() => onStart(mode === "paced" ? targetWpm : null)}
        className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink disabled:opacity-40"
      >
        {sessionContext === "retest" ? "Begin retest" : "Start reading"}
      </button>
    </main>
  );
}

function ReadingScreen({
  paragraphs,
  fontSize,
  lineWidth,
  onFinish,
}: {
  paragraphs: string[];
  fontSize: FontSize;
  lineWidth: LineWidth;
  onFinish: () => void;
}) {
  useEnterKey(onFinish);
  const measureClass = LINE_WIDTH_CLASSES[lineWidth];

  return (
    <main className="flex flex-1 flex-col py-16">
      <article
        className={`mx-auto flex ${measureClass} flex-col gap-6 font-serif ${FONT_SIZE_CLASSES[fontSize]} leading-[1.65] text-ink`}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <div className={`mx-auto mt-10 w-full ${measureClass}`}>
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

function PacedReadingScreen({
  page,
  pageDurationMs,
  isLastPage,
  fontSize,
  lineWidth,
  onNextPage,
  onFinish,
  onFlagUnfinished,
}: {
  page: Page;
  pageDurationMs: number;
  isLastPage: boolean;
  fontSize: FontSize;
  lineWidth: LineWidth;
  onNextPage: () => void;
  onFinish: () => void;
  onFlagUnfinished: () => void;
}) {
  useEnterKey(isLastPage ? onFinish : onNextPage);
  const measureClass = LINE_WIDTH_CLASSES[lineWidth];

  return (
    <main className="flex flex-1 flex-col py-16">
      <div className={`mx-auto w-full ${measureClass}`}>
        <PageCountdown
          durationMs={pageDurationMs}
          onExpire={isLastPage ? onFinish : onNextPage}
        />
      </div>
      <article
        className={`mx-auto mt-10 flex ${measureClass} flex-col gap-6 font-serif ${FONT_SIZE_CLASSES[fontSize]} leading-[1.65] text-ink`}
      >
        {page.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <div className={`mx-auto mt-10 flex w-full ${measureClass} gap-3`}>
        <button
          type="button"
          onClick={isLastPage ? onFinish : onNextPage}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          {isLastPage ? "I've finished reading" : "Next page"}
        </button>
        <button
          type="button"
          onClick={onFlagUnfinished}
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-muted"
        >
          I didn&apos;t finish this page
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

  useEnterKey(() => onContinue(recallText), depth === "brief");

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

  function handleContinue() {
    if (selectedOptionIndex !== null && !locked) {
      setLocked(true);
      onAnswer(selectedOptionIndex);
    }
  }

  useEnterKey(handleContinue, selectedOptionIndex !== null && !locked);

  useEffect(() => {
    if (locked) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const position = Number(event.key) - 1;
      if (
        Number.isInteger(position) &&
        position >= 0 &&
        position < optionOrder.length
      ) {
        setSelectedOptionIndex(optionOrder[position]!);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [locked, optionOrder]);

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
          onClick={handleContinue}
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
  isRetest,
  originalComprehension,
  bookNavigation,
  onReview,
}: {
  wpm: number;
  comprehension: number | null;
  taxonomyBreakdown: TaxonomyBreakdown;
  focusLost: boolean;
  hasQuestions: boolean;
  isRetest: boolean;
  originalComprehension: number | null;
  bookNavigation: BookNavigation | null;
  onReview: () => void;
}) {
  useEnterKey(onReview, hasQuestions);

  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
      {comprehension !== null && (
        <p className="font-sans text-base text-ink">
          You held {Math.round(comprehension)}% comprehension.
        </p>
      )}
      {isRetest && comprehension !== null && originalComprehension !== null && (
        <p className="font-sans text-sm text-muted">
          {Math.round(comprehension) >= Math.round(originalComprehension)
            ? `You held that steady since your original ${Math.round(originalComprehension)}% score.`
            : `That's down from your original ${Math.round(originalComprehension)}% score, a retention of ${Math.round((comprehension / originalComprehension) * 100)}%.`}
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
      {!isRetest && (
        <p className="font-sans text-sm text-muted">
          You read at {wpm} words per minute.
        </p>
      )}
      {focusLost && (
        <p className="font-sans text-sm text-muted">
          This session may be excluded from your metrics because you left the
          tab while reading.
        </p>
      )}
      <div className="flex gap-3">
        {hasQuestions && (
          <button
            type="button"
            onClick={onReview}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            Show me what I missed
          </button>
        )}
        {bookNavigation !== null && (
          <button
            type="button"
            onClick={bookNavigation.onContinue}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            {bookNavigation.isLastChunk
              ? "Finish book"
              : "Continue to next section"}
          </button>
        )}
        <Link
          href="/practice"
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Back to practice
        </Link>
        <Link href="/" className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink">
          Home
        </Link>
      </div>
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
  recallText,
  missClassifications,
  fontSize,
  lineWidth,
  bookNavigation,
  onClassifyMiss,
}: {
  paragraphs: string[];
  questions: Question[];
  answers: number[];
  recallText: string | null;
  missClassifications: Record<string, MissClassification>;
  fontSize: FontSize;
  lineWidth: LineWidth;
  bookNavigation: BookNavigation | null;
  onClassifyMiss: (
    questionId: string,
    classification: MissClassification,
  ) => void;
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
          const classification = missClassifications[question.id];
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
              {!isCorrect && (
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => onClassifyMiss(question.id, "forgot")}
                    aria-pressed={classification === "forgot"}
                    className={`rounded border px-3 py-1.5 font-sans text-sm text-ink ${
                      classification === "forgot"
                        ? "border-signal"
                        : "border-rule"
                    }`}
                  >
                    I knew it, I forgot it
                  </button>
                  <button
                    type="button"
                    onClick={() => onClassifyMiss(question.id, "misunderstood")}
                    aria-pressed={classification === "misunderstood"}
                    className={`rounded border px-3 py-1.5 font-sans text-sm text-ink ${
                      classification === "misunderstood"
                        ? "border-signal"
                        : "border-rule"
                    }`}
                  >
                    I didn&apos;t understand it
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {selectedQuestion && (
        <article
          className={`mx-auto flex ${LINE_WIDTH_CLASSES[lineWidth]} flex-col gap-6 border-t border-rule pt-8 font-serif ${FONT_SIZE_CLASSES[fontSize]} leading-[1.65] text-ink`}
        >
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
      {recallText !== null && (
        <div
          className={`mx-auto flex w-full ${LINE_WIDTH_CLASSES[lineWidth]} flex-col gap-2 border-t border-rule pt-8`}
        >
          <h2 className="font-sans text-sm text-muted">
            What you wrote before answering
          </h2>
          <p className="font-serif text-base text-ink">{recallText}</p>
        </div>
      )}
      <div className="flex gap-3 border-t border-rule pt-8">
        {bookNavigation !== null && (
          <button
            type="button"
            onClick={bookNavigation.onContinue}
            className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
          >
            {bookNavigation.isLastChunk
              ? "Finish book"
              : "Continue to next section"}
          </button>
        )}
        <Link
          href="/practice"
          className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink"
        >
          Back to practice
        </Link>
        <Link href="/" className="rounded border border-rule px-4 py-2 font-sans text-sm text-ink">
          Home
        </Link>
      </div>
    </main>
  );
}

export function SessionReader({
  passage,
  sessionContext,
  mode,
  retestId,
  bookNavigation = null,
  chunkPassageIds = [],
  onSessionComplete,
}: {
  passage: PassageWithWordCounts;
  sessionContext: SessionContext;
  mode: SessionMode;
  retestId: string | null;
  bookNavigation?: BookNavigation | null;
  chunkPassageIds?: string[];
  // Lets a book attribute one sitting's answers back to the sections it covered.
  onSessionComplete?: (outcome: {
    elapsedMs: number;
    answers: number[];
  }) => void;
}) {
  const { store, update } = useStore();
  const [phase, setPhase] = useState<Phase>("start");
  const [focusLost, setFocusLost] = useState(false);
  const [recall, setRecall] = useState<{
    text: string;
    depth: RecallDepth;
  } | null>(null);
  const hasCheckedResumeRef = useRef(false);
  const timer = useReadingTimer();
  const pages = useMemo(
    () => paginatePassage(passage.body, passage.wordCounts.paragraphs),
    [passage],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [targetWpm, setTargetWpm] = useState<number | null>(null);
  const [unfinishedPageCount, setUnfinishedPageCount] = useState(0);
  const medianSelfPacedWpm = computeMedianSelfPacedRate(store?.sessions ?? []);
  const fontSize = store?.settings.fontSize ?? "medium";
  const lineWidth = store?.settings.lineWidth ?? "medium";
  const recallDepth =
    sessionContext === "book"
      ? "off"
      : sessionContext === "practice"
        ? (store?.settings.recallDepth ?? "brief")
        : "full";

  const questionPool = sessionContext === "retest" ? "retest" : "first";
  const questions = passage.questions.filter(
    (question) => question.pool === questionPool,
  );
  const retestRecord =
    retestId !== null
      ? (store?.retests.find((retest) => retest.id === retestId) ?? null)
      : null;
  const originalComprehension =
    retestRecord !== null
      ? (store?.sessions.find(
          (session) => session.id === retestRecord.sourceSessionId,
        )?.comprehension ?? null)
      : null;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed] = useState(() => createSeed());
  const [comprehension, setComprehension] = useState<number | null>(null);
  const [taxonomyBreakdown, setTaxonomyBreakdown] = useState<TaxonomyBreakdown>(
    {},
  );
  const [answers, setAnswers] = useState<number[]>([]);
  const [missClassifications, setMissClassifications] = useState<
    Record<string, MissClassification>
  >({});
  const answersRef = useRef<number[]>([]);
  const [sessionRecordId] = useState(() => crypto.randomUUID());

  function finishSession({
    elapsedMs,
    comprehensionValue,
    taxonomyBreakdownValue,
    recallValue,
  }: {
    elapsedMs: number;
    comprehensionValue: number;
    taxonomyBreakdownValue: TaxonomyBreakdown;
    recallValue: { text: string; depth: RecallDepth } | null;
  }) {
    const record: SessionRecord = {
      id: sessionRecordId,
      passageId: passage.id,
      sessionContext,
      mode,
      timings: {
        startedAtEpochMs: Date.now() - elapsedMs,
        elapsedMs,
      },
      wordCount: passage.wordCounts.total,
      wpm: computeWpm(passage.wordCounts.total, elapsedMs),
      comprehension: comprehensionValue,
      taxonomyBreakdown: taxonomyBreakdownValue,
      focusLost,
      missClassifications: {},
      recallText: recallValue?.text ?? null,
      recallDepth: recallValue?.depth ?? recallDepth,
      unfinishedPageCount,
      chunkPassageIds,
    };
    const newRetests =
      sessionContext === "practice" || sessionContext === "book"
        ? scheduleRetests(record.id, passage.id, Date.now())
        : [];
    update((current) => ({
      ...current,
      sessions: [...current.sessions, record],
      retests:
        sessionContext === "retest" && retestId !== null
          ? current.retests.filter((retest) => retest.id !== retestId)
          : [...current.retests, ...newRetests],
    }));
    onSessionComplete?.({ elapsedMs, answers: answersRef.current });
  }

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
    if (mode !== "paced" || phase !== "reading") {
      return;
    }

    // Paced pages are one-way: trap the browser back button so a reader
    // can't navigate away to revisit a page already shown.
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mode, phase, pageIndex]);

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

  function handleFinishReading() {
    const elapsedMs = timer.stop();
    update((current) => ({ ...current, inProgressSession: null }));
    if (recallDepth === "off" && questions.length === 0) {
      finishSession({
        elapsedMs,
        comprehensionValue: 0,
        taxonomyBreakdownValue: {},
        recallValue: null,
      });
    }
    setPhase(
      recallDepth === "off"
        ? questions.length > 0
          ? "questions"
          : "finished"
        : "recall",
    );
  }

  switch (phase) {
    case "start":
      return (
        <StartScreen
          passage={passage}
          mode={mode}
          medianWpm={medianSelfPacedWpm}
          sessions={store?.sessions ?? []}
          sessionContext={sessionContext}
          onStart={(selectedTargetWpm) => {
            setFocusLost(false);
            setPageIndex(0);
            setTargetWpm(selectedTargetWpm);
            setUnfinishedPageCount(0);
            if (sessionContext === "retest") {
              setPhase("recall");
              return;
            }
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
      if (mode === "paced") {
        const page = pages[pageIndex];
        if (!page) {
          return null;
        }
        return (
          <PacedReadingScreen
            key={pageIndex}
            page={page}
            pageDurationMs={
              (page.wordCount / (targetWpm ?? FALLBACK_PACED_WPM)) * 60_000
            }
            isLastPage={pageIndex === pages.length - 1}
            fontSize={fontSize}
            lineWidth={lineWidth}
            onNextPage={() => setPageIndex((index) => index + 1)}
            onFinish={handleFinishReading}
            onFlagUnfinished={() =>
              setUnfinishedPageCount((count) => count + 1)
            }
          />
        );
      }
      return (
        <ReadingScreen
          paragraphs={passage.body}
          fontSize={fontSize}
          lineWidth={lineWidth}
          onFinish={handleFinishReading}
        />
      );
    case "recall": {
      const depth = recallDepth === "off" ? "brief" : recallDepth;
      return (
        <RecallScreen
          depth={depth}
          onContinue={(text) => {
            setRecall({ text, depth });
            if (questions.length === 0) {
              finishSession({
                elapsedMs: timer.elapsedMs ?? 0,
                comprehensionValue: 0,
                taxonomyBreakdownValue: {},
                recallValue: { text, depth },
              });
            }
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
              const finalAnswers = answersRef.current;
              const comprehensionValue = scoreAnswers(questions, finalAnswers);
              const taxonomyBreakdownValue = scoreByTaxonomy(
                questions,
                finalAnswers,
              );
              setAnswers(finalAnswers);
              setComprehension(comprehensionValue);
              setTaxonomyBreakdown(taxonomyBreakdownValue);
              finishSession({
                elapsedMs: timer.elapsedMs ?? 0,
                comprehensionValue,
                taxonomyBreakdownValue,
                recallValue: recall,
              });
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
          isRetest={sessionContext === "retest"}
          originalComprehension={originalComprehension}
          bookNavigation={bookNavigation}
          onReview={() => setPhase("review")}
        />
      );
    case "review":
      return (
        <ReviewScreen
          paragraphs={passage.body}
          questions={questions}
          answers={answers}
          recallText={recall?.text ?? null}
          missClassifications={missClassifications}
          fontSize={fontSize}
          lineWidth={lineWidth}
          bookNavigation={bookNavigation}
          onClassifyMiss={(questionId, classification) => {
            setMissClassifications((current) => ({
              ...current,
              [questionId]: classification,
            }));
            update((current) => ({
              ...current,
              sessions: current.sessions.map((session) =>
                session.id === sessionRecordId
                  ? {
                      ...session,
                      missClassifications: {
                        ...session.missClassifications,
                        [questionId]: classification,
                      },
                    }
                  : session,
              ),
            }));
          }}
        />
      );
  }
}
