# Reading trainer

A frontend-only web app for training reading comprehension and, secondarily,
reading rate. Comprehension leads; speed follows. The headline metric is the
rate at which comprehension holds — phrased to the reader as "you hold 80%
comprehension up to 240 wpm" — not raw words per minute.

All progress lives in the browser's `localStorage`. There is no backend, no
accounts, and no network calls.

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

- `npm run build` / `npm run start` — production build and serve.
- `npm run lint` — ESLint plus a passage-content validation script
  (`scripts/validate-passages.mjs`).
- `npm run format` — Prettier.

## How the app is organized

- `src/app` — Next.js App Router routes: the home page, `/practice` (passage
  picker), `/session/[passageId]` (the reading, recall, question, and review
  flow), `/progress`, and `/settings`.
- `src/lib/content` — passage and question types, the passage loader and its
  runtime validation, word counting, and the difficulty scorer.
- `src/lib/storage` — the `localStorage` layer: types, read/write helpers,
  the `StoreProvider`/`useStore` React context, migrations, and export/import.
- `src/lib/session`, `src/lib/paced`, `src/lib/spaced`, `src/lib/calibration`
  — pure helpers behind the self-paced flow, timed-page ("paced") mode,
  spaced retests, and calibration baselines, respectively.
- `src/lib/metrics` — pure functions that turn stored sessions into the
  numbers shown on the progress page (holding rate, taxonomy breakdown,
  domain/text-type breakdown, cumulative words, and so on).
- `src/content/passages` — the passage library, one JSON file per passage.

## Data model

Everything is stored under a single `localStorage` key (`reading-trainer`) as
one JSON object — see `src/lib/storage/types.ts` for the full shape. The
key pieces:

- **`settings`** — recall depth, comprehension threshold, reading-surface
  preferences (font size, line width), and the practice picker's filters.
- **`sessions`** — one record per completed session (practice, retest, or
  calibration), with its timing, words-per-minute, comprehension score,
  taxonomy breakdown, and mode (`self-paced` or `paced`). This is the
  source of truth that every progress metric is computed from.
- **`retests`** — scheduled spaced-retest records (due two and seven days
  after a practice session), consumed when the retest is taken and expired
  after fourteen days if it isn't.
- **`inProgressSession`** — lets a mid-reading refresh resume the timer.

`src/lib/storage/export.ts` and `import.ts` turn this object into a
downloadable JSON file and back, so progress survives a cleared browser.

## Adding a passage

A passage is a JSON file in `src/content/passages`, registered in
`src/content/passages/index.ts`. Its shape is defined in
`src/lib/content/types.ts`:

- `id`, `title`, `language`, `source`, `attribution`, `licence`.
- `textType` (`expository` or `narrative`) and `domain` (a closed list —
  see `DOMAINS` in `types.ts`).
- `calibrationOnly` — `true` excludes it from the practice picker; it's
  only reachable through the calibration flow.
- `body` — an array of paragraph strings.
- `questions` — see below.

Before writing questions, read `src/content/AUTHORING.md` for the mechanical
rules (pool sizes, taxonomy spread, evidence spans, option hygiene) and
`src/content/SOURCES.md` for what each source's licence requires. In short:

- 8–10 questions in the `first` pool, 6–8 in the `retest` pool; the two
  pools never share a question.
- Every question has exactly one `taxonomy` tag (`literal`, `inference`,
  `main_idea`, or `vocabulary`) and must be answerable only by someone who
  read the passage — no question answerable from general knowledge alone.
- Every question needs an `evidence` span (`paragraphIndex`, `start`,
  `end`) that resolves to real text in `body`.

`npm run lint` runs `scripts/validate-passages.mjs`, which checks the
mechanical rules above against every passage file.
