# On-device AI

Three features use a model built into the browser rather than a server: translation, rewriting, and
the [WebMCP agent tools](webmcp.md). None of them sends the resume anywhere, which is the whole point
— the privacy promise has to survive the AI being switched on, or it was never a promise.

All three are turned on from the same sparkles panel in the editor's bar, because they are the same
kind of thing: a model that has to be downloaded once, on a user activation, and then stays on the
device.

## Two languages

### What is in storage

Local storage holds a [`ResumeDoc`](../src/types/resume-doc.ts): one `Resume` per language, plus a
`primaryLang` that names the source of truth. `Resume` itself is untouched by any of it, so the
templates, the PDF and the WebMCP tools keep seeing exactly the shape they always have.

One invariant holds the whole thing up, and it lives in
[`useResumeDoc`](../src/app/resume-editor/hooks/useResumeDoc.ts): **a write only ever lands in the
locale that was active when it was requested, and the debounced save is flushed before any switch.**
Text typed in English cannot end up in the Chinese locale, and corrections made in a translation
never travel back to the original.

### What gets translated

Only prose. [`fields.ts`](../src/lib/translation/fields.ts) lists the fields a translator may touch —
the wanted job, the city, the profile, job titles and descriptions, schools, degrees and majors — and
everything absent from it is copied verbatim. That is the point: names, emails, phones and URLs are
not prose, and a skill list through a translator turns TypeScript into 打字稿 and Google into 谷歌.
Company names sit just inside that line too, and are copied.

### Stale, edited, and the three buttons

Each translated field remembers two strings: the source text it was made from, and what the
translator produced. Storing the strings rather than a hash costs a few KB and buys plain `===`
comparisons for the two states the editor has to tell apart — **stale** (the original has moved on)
and **edited** (you rewrote it) — plus a free revert. That is what lets the panel at the top of a
translated resume offer three different things:

- **Update translation**, when the original has changed. Fields you rewrote are left exactly as they
  are; only untouched ones take the new translation.
- **Re-translate**, which throws those rewrites away and starts over. It asks first, and says how
  many fields it would replace.
- **Make this the original**, which swaps the roles of the two languages. It seeds provenance for the
  demoted locale — without that every field would read stale, and the editor would offer to "update"
  hand-written text by sending it back through the translator.

The translator is the browser's own; [`translator.ts`](../src/lib/translator.ts) wraps it.

## Rewriting

The wand beside **Profile** and beside each role's description opens advice on writing that section,
and offers to do it for you. The guidance is written down rather than generated, so the panel is
useful in a browser with no model at all, and a reader who only wanted to know what to write never
waits on anything. The model is reached only when one of the three actions is pressed — polish,
shorten, lead with strengths for a profile; polish, strong verbs, concise for a description.

Two details in [`rewrite.ts`](../src/lib/rewrite.ts) are worth knowing before editing it:

- **Every run clones the shared session rather than reusing it**, so a rewrite never sees the earlier
  ones. Reusing the session directly would leave the profile in context while a job description is
  rewritten, and turn a retry into "rewrite it again".
- **Bullet fields are stored as one string joined by `SPLIT_TEXT`**, a bare `|` that means nothing to
  a model. It goes in as `- ` lines and comes back through a parser that strips every common bullet
  glyph, because models are inconsistent about which one they use even when told.

The API is Chrome's Prompt API, wrapped by
[`language-model.ts`](../src/lib/language-model.ts) the same way and for the same reasons the
translator is — a download has to survive the popover that started it being closed, and every wand in
the form has to show the same answer. Coverage is in [`e2e/rewrite.spec.ts`](../e2e/rewrite.spec.ts).

## Browser support

| Feature             | Requires                              | Without it                                                 |
| ------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Translation         | Chrome 138+ or Edge 148+, desktop     | The second language still works — you write it yourself    |
| Rewriting           | Chrome's Prompt API, desktop          | The written guidance still opens; the three actions do not |
| [WebMCP](webmcp.md) | Edge 147+, or Chrome 149 origin trial | The editor works normally, with no agent tools             |
