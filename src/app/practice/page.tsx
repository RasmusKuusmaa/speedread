"use client";

import Link from "next/link";
import { DOMAINS, TEXT_TYPES } from "@/lib/content/types";
import { loadBooks } from "@/lib/content/book-loader";
import { DIFFICULTY_BANDS, scoreDifficulty } from "@/lib/content/difficulty";
import { LENGTH_BANDS, scoreLength } from "@/lib/content/length";
import { loadPassages } from "@/lib/content/loader";
import { useStore } from "@/lib/storage/store-provider";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PracticePage() {
  const { store, update } = useStore();
  const passages = loadPassages();

  if (store === null) {
    return null;
  }

  const { textType, domain, lengthBand, difficultyBand } =
    store.settings.pickerFilters;

  const bookPassageIds = new Set(
    loadBooks().flatMap((book) => book.chunkPassageIds),
  );

  const withMeta = passages
    .filter(
      (passage) =>
        !passage.calibrationOnly && !bookPassageIds.has(passage.id),
    )
    .map((passage) => ({
      passage,
      length: scoreLength(passage.wordCounts.total),
      difficulty: scoreDifficulty(passage.body, passage.language),
    }));

  const filtered = withMeta.filter(
    ({ passage, length, difficulty }) =>
      (textType === "all" || passage.textType === textType) &&
      (domain === "all" || passage.domain === domain) &&
      (lengthBand === "all" || length === lengthBand) &&
      (difficultyBand === "all" || difficulty.band === difficultyBand),
  );

  return (
    <main className="flex flex-1 flex-col gap-8 py-16">
      <h1 className="font-serif text-2xl text-ink">Practice</h1>

      <div className="flex gap-4 font-sans text-sm">
        <select
          value={textType}
          onChange={(event) => {
            const value = event.target.value as typeof textType;
            update((current) => ({
              ...current,
              settings: {
                ...current.settings,
                pickerFilters: {
                  ...current.settings.pickerFilters,
                  textType: value,
                },
              },
            }));
          }}
          className="rounded border border-rule px-3 py-2 text-ink"
        >
          <option value="all">All text types</option>
          {TEXT_TYPES.map((option) => (
            <option key={option} value={option}>
              {capitalize(option)}
            </option>
          ))}
        </select>

        <select
          value={domain}
          onChange={(event) => {
            const value = event.target.value as typeof domain;
            update((current) => ({
              ...current,
              settings: {
                ...current.settings,
                pickerFilters: {
                  ...current.settings.pickerFilters,
                  domain: value,
                },
              },
            }));
          }}
          className="rounded border border-rule px-3 py-2 text-ink"
        >
          <option value="all">All domains</option>
          {DOMAINS.map((option) => (
            <option key={option} value={option}>
              {capitalize(option)}
            </option>
          ))}
        </select>

        <select
          value={lengthBand}
          onChange={(event) => {
            const value = event.target.value as typeof lengthBand;
            update((current) => ({
              ...current,
              settings: {
                ...current.settings,
                pickerFilters: {
                  ...current.settings.pickerFilters,
                  lengthBand: value,
                },
              },
            }));
          }}
          className="rounded border border-rule px-3 py-2 text-ink"
        >
          <option value="all">All lengths</option>
          {LENGTH_BANDS.map((option) => (
            <option key={option} value={option}>
              {capitalize(option)}
            </option>
          ))}
        </select>

        <select
          value={difficultyBand}
          onChange={(event) => {
            const value = event.target.value as typeof difficultyBand;
            update((current) => ({
              ...current,
              settings: {
                ...current.settings,
                pickerFilters: {
                  ...current.settings.pickerFilters,
                  difficultyBand: value,
                },
              },
            }));
          }}
          className="rounded border border-rule px-3 py-2 text-ink"
        >
          <option value="all">All difficulties</option>
          {DIFFICULTY_BANDS.map((option) => (
            <option key={option} value={option}>
              {capitalize(option)}
            </option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col gap-4">
        {filtered.map(({ passage, length, difficulty }) => (
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
              <span>{passage.wordCounts.total} words</span>
              <span>{capitalize(length)}</span>
              <span>{capitalize(difficulty.band)}</span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
