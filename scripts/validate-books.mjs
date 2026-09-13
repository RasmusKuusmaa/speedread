#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const booksDir = path.join(process.cwd(), "src/content/books");
const passagesDir = path.join(process.cwd(), "src/content/passages");

const bookFiles = readdirSync(booksDir).filter((file) =>
  file.endsWith(".json"),
);
const passageFiles = readdirSync(passagesDir).filter((file) =>
  file.endsWith(".json"),
);
const passageIds = new Set(
  passageFiles.map(
    (file) => JSON.parse(readFileSync(path.join(passagesDir, file), "utf8")).id,
  ),
);

const errors = [];
const passageIdOwner = new Map();

for (const file of bookFiles) {
  const raw = readFileSync(path.join(booksDir, file), "utf8");
  const book = JSON.parse(raw);

  if (
    !Array.isArray(book.chunkPassageIds) ||
    book.chunkPassageIds.length === 0
  ) {
    errors.push(`${file}: chunkPassageIds must be a non-empty array`);
    continue;
  }

  for (const passageId of book.chunkPassageIds) {
    if (!passageIds.has(passageId)) {
      errors.push(
        `${file}: chunkPassageIds references unknown passage "${passageId}"`,
      );
      continue;
    }
    const owner = passageIdOwner.get(passageId);
    if (owner && owner !== file) {
      errors.push(
        `${file}: passage "${passageId}" also belongs to book "${owner}"`,
      );
    } else {
      passageIdOwner.set(passageId, file);
    }
  }
}

if (errors.length > 0) {
  console.error("Book validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${bookFiles.length} book file(s).`);
