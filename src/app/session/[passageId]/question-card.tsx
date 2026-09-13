import type { Question } from "@/lib/content/types";

export function QuestionCard({
  question,
  optionOrder,
  selectedOptionIndex,
  onSelect,
}: {
  question: Question;
  optionOrder: number[];
  selectedOptionIndex: number | null;
  onSelect: (optionIndex: number) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[66ch] flex-col gap-4">
      <p className="font-serif text-lg text-ink">{question.prompt}</p>
      <div className="flex flex-col gap-2">
        {optionOrder.map((optionIndex) => (
          <button
            key={optionIndex}
            type="button"
            onClick={() => onSelect(optionIndex)}
            aria-pressed={selectedOptionIndex === optionIndex}
            className={`rounded border px-4 py-3 text-left font-sans text-sm text-ink ${
              selectedOptionIndex === optionIndex
                ? "border-signal"
                : "border-rule"
            }`}
          >
            {question.options[optionIndex]}
          </button>
        ))}
      </div>
    </div>
  );
}
