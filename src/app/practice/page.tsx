import Link from "next/link";
import { scoreDifficulty } from "@/lib/content/difficulty";
import { loadPassages } from "@/lib/content/loader";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PracticePage() {
  const passages = loadPassages();

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Practice</h1>
      <ul className="flex flex-col gap-4">
        {passages.map((passage) => {
          const difficulty = scoreDifficulty(passage.body, passage.language);
          return (
            <li key={passage.id} className="border-b border-rule pb-4">
              <Link
                href={`/session/${passage.id}`}
                className="font-serif text-lg text-ink underline"
              >
                {passage.title}
              </Link>
              <p className="mt-1 flex gap-3 font-sans text-sm text-muted">
                <span>{capitalize(passage.textType)}</span>
                <span>{capitalize(passage.domain)}</span>
                <span>{capitalize(difficulty.band)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
