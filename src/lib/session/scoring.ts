import type { Question } from "@/lib/content/types";

export function scoreAnswers(questions: Question[], answers: number[]): number {
  if (questions.length === 0) {
    return 0;
  }
  const correct = questions.reduce((count, question, index) => {
    return answers[index] === question.answerIndex ? count + 1 : count;
  }, 0);
  return (correct / questions.length) * 100;
}
