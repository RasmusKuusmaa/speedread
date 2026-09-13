# Passage sourcing and licensing

Nothing enters the library without its licence recorded in the passage's `licence` field. These are the sources in use, and what each one requires.

## Project Gutenberg

Public domain. Used for literary prose. No attribution is legally required, but the passage's `attribution` field should still name the work and author, and `source` should link to the Gutenberg edition used.

## OpenStax

CC BY. Used for technical expository prose. Requires attribution to OpenStax and the specific textbook. Record both in `attribution`, and the textbook URL in `source`.

## Wikipedia

CC BY-SA. Attribution is shown in-app, not just recorded — the `attribution` field is rendered to the reader, not filed away. CC BY-SA also requires that any modified excerpt be marked as adapted; note in `attribution` if the passage was trimmed or edited from the source article.

## arXiv paper introductions

Licence varies per paper — arXiv hosts papers under a mix of licences (arXiv's own perpetual non-exclusive licence, CC BY, CC BY-NC-SA, and others chosen by the author). Check the specific paper's licence before adding it, and record the actual licence in the `licence` field rather than assuming CC BY. Skip papers with a licence that does not permit this use.
