#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const passagesDir = path.join(process.cwd(), "src/content/passages");
const files = readdirSync(passagesDir).filter((file) => file.endsWith(".json"));

const errors = [];

for (const file of files) {
  const raw = readFileSync(path.join(passagesDir, file), "utf8");
  const passage = JSON.parse(raw);
  const questions = Array.isArray(passage.questions) ? passage.questions : [];

  const firstPool = questions.filter((question) => question.pool === "first");
  const retestPool = questions.filter((question) => question.pool === "retest");

  if (firstPool.length < 8 || firstPool.length > 10) {
    errors.push(
      `${file}: first pool has ${firstPool.length} questions, expected 8-10`,
    );
  }
  if (retestPool.length < 6 || retestPool.length > 8) {
    errors.push(
      `${file}: retest pool has ${retestPool.length} questions, expected 6-8`,
    );
  }

  for (const [poolName, poolQuestions] of [
    ["first", firstPool],
    ["retest", retestPool],
  ]) {
    const taxonomies = new Set(
      poolQuestions.map((question) => question.taxonomy),
    );
    if (taxonomies.size < 2) {
      errors.push(
        `${file}: ${poolName} pool covers only ${
          [...taxonomies].join(", ") || "no"
        } taxonomy tag(s), expected more than one`,
      );
    }
  }

  const optionCounts = new Set(
    questions.map((question) =>
      Array.isArray(question.options) ? question.options.length : -1,
    ),
  );
  if (optionCounts.size > 1) {
    errors.push(
      `${file}: option counts are inconsistent across questions (${[
        ...optionCounts,
      ].join(", ")})`,
    );
  }

  questions.forEach((question, index) => {
    const evidence = question.evidence;
    if (!evidence || typeof evidence.paragraphIndex !== "number") {
      errors.push(`${file}: question[${index}] is missing an evidence span`);
      return;
    }
    const paragraph = passage.body?.[evidence.paragraphIndex];
    if (typeof paragraph !== "string") {
      errors.push(
        `${file}: question[${index}] evidence points at a paragraph that does not exist`,
      );
      return;
    }
    if (
      typeof evidence.start !== "number" ||
      typeof evidence.end !== "number" ||
      evidence.start < 0 ||
      evidence.end > paragraph.length ||
      evidence.start >= evidence.end
    ) {
      errors.push(
        `${file}: question[${index}] evidence span does not resolve to real text`,
      );
    }
  });
}

if (errors.length > 0) {
  console.error("Passage validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${files.length} passage file(s).`);
