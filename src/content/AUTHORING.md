# Question authoring rules

These rules are mechanical where possible so `npm run lint` can check them. Follow them for every passage.

## Passage independence

A question must be answerable only by someone who read the passage. If it can be answered from general knowledge, or by reasoning about the options alone without having read the passage, it does not ship. This applies to every taxonomy tag, including `vocabulary` — ask what a word means _as used in this passage_, not as a dictionary lookup.

## Pool sizes

- `first` pool: 8–10 questions.
- `retest` pool: 6–8 questions.

The two pools test the same passage but never share a question.

## Taxonomy spread

Every question carries exactly one tag: `literal`, `inference`, `main_idea`, or `vocabulary`. Each pool should include more than one tag — do not write a pool that is all `literal`. Weight the mix to the passage: technical expository prose leans on `literal` and `vocabulary`; narrative and argumentative prose leans on `inference` and `main_idea`.

## Evidence spans

Every question needs an `evidence` field: the paragraph index and the character range within that paragraph that supports the answer. The range must resolve to real text in `body` — no span that runs past the end of the paragraph or points at the wrong paragraph.

## Option hygiene

- No "all of the above", "none of the above", or options that lean on other options.
- No option that is conspicuously longer or more detailed than the others — length is not allowed to be the tell.
- Exactly one correct option per question, indexed by `answerIndex`.
