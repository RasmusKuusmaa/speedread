# Passage sourcing and licensing

Nothing enters the library without its licence recorded in the passage's `licence` field. These are the sources in use, and what each one requires.

## Project Gutenberg

Public domain. Used for literary prose. No attribution is legally required, but the passage's `attribution` field should still name the work and author, and `source` should link to the Gutenberg edition used.

## OpenStax

Licence varies per title — check the specific book before adding it. Some OpenStax textbooks are CC BY 4.0; others (including Chemistry 2e, as of this writing) are CC BY-NC-SA 4.0. Record the actual licence in the `licence` field rather than assuming CC BY. Requires attribution to OpenStax and the specific textbook (authors, title, publisher); record that in `attribution`, and the textbook URL in `source`. Under the NC-SA titles, note any adaptation in `attribution` — ShareAlike carries the same licence onto the adapted excerpt.

## Wikipedia

CC BY-SA. Attribution is shown in-app, not just recorded — the `attribution` field is rendered to the reader, not filed away. CC BY-SA also requires that any modified excerpt be marked as adapted; note in `attribution` if the passage was trimmed or edited from the source article.

## arXiv paper introductions

Licence varies per paper — arXiv hosts papers under a mix of licences (arXiv's own perpetual non-exclusive licence, CC BY, CC BY-NC-SA, and others chosen by the author). Check the specific paper's licence before adding it, and record the actual licence in the `licence` field rather than assuming CC BY. Skip papers with a licence that does not permit this use.
