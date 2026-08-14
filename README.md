# Open RESUME

![The Open Resume landing page: the headline and call to action on the left, and a template rendered live on the right under a row of colour swatches](docs/screenshot.webp)

An online tool to create a resume — with no account, and nothing uploaded anywhere.

Online site: https://simple-resume-nu.vercel.app

## Features

- Create a resume easily.
- Pick between [four templates](#templates) and tint any of them, from the
  [appearance panel](#templates).
- Export the resume as a PDF, as a [standalone HTML file](#html-export), or
  [copy it as Markdown](#markdown-for-agents) to paste into an AI agent.
- Keep the same resume in [two languages](#two-languages), translated by the model built into the
  browser and corrected by hand afterwards.
- [Rewrite the profile or a role description](#rewriting-on-device) with the browser's own language
  model, previewing the result before it replaces anything.
- The resume data is stored in local storage — there is no account and no server to send it to. The
  AI runs on the device as well, so that stays true with it switched on.
- Build the resume by talking to a browser AI agent, via [WebMCP](#webmcp-experimental).

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Shadcn UI
- react-pdf/renderer
- next-themes for light/dark
- The browser's built-in AI: the [Translator API](#two-languages) and the
  [Prompt API](#rewriting-on-device)
- Playwright for the end-to-end suite, oxlint and oxfmt for lint and format

## Local Development

1. Download the repo git clone `gh repo clone leochiu-a/open-resume`
2. Change the directory cd `open-resume`
3. Install the dependency `pnpm i`
4. Start a development server `pnpm dev`
5. Open your browser and visit http://localhost:3000 — the editor itself is at
   [/resume-editor](http://localhost:3000/resume-editor)

The project runs on Node 24 (`engines` in `package.json`). The other scripts are `pnpm lint`
(oxlint), `pnpm format` (oxfmt) and `pnpm test:e2e` for the Playwright suite in [`e2e/`](e2e) —
`pnpm test:e2e:ui` opens it in the runner. CI runs all four plus a typecheck and a build.

## Look and feel

Both surfaces are the same printed page — the landing page with the argument, the editor with the
tools out. That is enforced rather than agreed: [`globals.css`](src/app/globals.css) holds one set of
`--c-*` values and everything else aliases them. shadcn's tokens (`--background`, `--border`,
`--primary`…) point at them for the editor, and the landing page points at them again under paper
names (`--paper`, `--rule`, `--graphite`). Retuning a colour moves both, and neither can drift.

Dark mode is the same aliases over a second set of `--c-*` values under `.dark`, so nothing else in
the app knows which theme is on. Both surfaces flip the same way, too:
[`applyTheme`](src/lib/theme-transition.ts) runs the change inside a View Transition and wipes a
circle out from wherever you clicked — the editor's `…` menu and the landing page's toggle share it.
A browser without the API just gets the new theme.

Three faces, registered in [`layout.tsx`](src/app/layout.tsx) and used the same way on both surfaces:
**Fraunces** for anything display, **Archivo** for body copy, **IBM Plex Mono** for labels, eyebrows
and section numbers.

The sheet is exempt from all of it. It renders inside an iframe carrying its own document, so neither
the palette nor dark mode reaches it: it is paper-white in both themes, as the PDF will be. Do not
give it a print grain or a tint it did not ask for — the preview's whole value is that it is not lying
about the output.

### The landing page

Two things are worth knowing before editing [`src/components/landing/`](src/components/landing):

- **The hero's sheet is a real template, not a screenshot.** It renders the registry's own
  `template.render()` into an iframe carrying `SHEET_DOCUMENT`, exactly as the editor's preview and
  the picker's thumbnails do — so a template that changes shows up here without anyone remembering
  to retake a picture. The frame is never remounted: switching template or colour swaps only the
  children inside it, which is why the paper does not flash. Adding a template to
  [`registry.tsx`](src/app/resume-editor/components/template/registry.tsx) adds it to the hero's
  picker too, with no other edit.
- **The colour picked for the sheet is the whole page's accent.** `AccentProvider` publishes it as
  the CSS variable `--ink` on a `[data-ink]` wrapper, which is why every section below the hero can
  tint itself while staying a server component. Read `--ink-display` rather than `--ink` for anything
  that is not the sheet: two of the four templates default to near-black, and dark paper lifts that
  towards white so it does not disappear.

The hero's entrance is a CSS animation (`.landing-rise`) rather than a JS one. The resting state is
visible and the keyframe only supplies the `from`, so a reveal that never runs is a hero that is
simply already there — driving it from JS meant an interrupted animation could strand the whole pitch
at `opacity: 0`.

### The editor

The editor is a fixed-height column rather than a scrolling page: the shell is `h-dvh`, and the form
and the preview each own an `overflow-y-auto` region. That is what separates the two scrollbars.
While the page scrolled and the preview was `sticky`, dragging anywhere moved the form and the
preview merely held its position, which is why the two felt joined. (`h-dvh` and not `h-screen`:
`100vh` is the _largest_ viewport on mobile, so the bottom of the page would sit behind the address
bar until it retracted.)

Above them is one bar, laid out as a three-column grid — identity left, document centre, tools
right. The centre slot holds the [language tabs](#two-languages), which are the one control here
that says _which document you are looking at_; centring is what makes that read as a mode rather
than as another button. A grid rather than flex with auto margins, because the two side slots are
different widths and under flex the tabs would sit visibly off-axis.

The tools on the right are Download, the on-device AI button, and a `…` menu holding the theme and
the GitHub link. Appearance is not among them: it moved onto the preview, where you can see what it
changes — see [Templates](#templates).

The form is set as a document in parts rather than a stack of cards: each section is a hairline rule,
a number in mono and a name in Fraunces — see [`section.tsx`](src/app/resume-editor/components/form/section.tsx).
Fields are hairline boxes filled with `--card`, and focus draws the border rather than a glow. The
chrome deliberately takes no colour from the resume: the sheet is the only coloured thing on screen,
which is also why the editor sets no `--ink` of its own.

[`CropMarks`](src/components/crop-marks.tsx) is shared with the landing page's hero and is the one
piece of decoration the two surfaces have in common. Because they sit _outside_ the sheet and the
preview column scrolls, `CROP_MARK_GUTTER` is held back on each side when the scale is computed —
otherwise the marks land outside the scroll box and are clipped. They are desktop-only for the same
reason: at mobile widths the gutter costs more than the marks add.

Two things not to do to the editor:

- **Nothing in the bar whose accessible name contains "Open Resume"** other than the wordmark
  itself. Two links in one bar whose names overlap are ambiguous to read out and to select.
- **Do not give the form an action, a method or a submit handler.** Nothing here is ever submitted —
  the `<form>` groups the fields and gives react-hook-form something to own, and every change is
  saved to local storage as you type. A button inside a form with no `type` is a submit button, and
  a programmatic click on one serialises every field into the query string, where name, phone and
  profile reach the server in the request line and stay in history. For an app whose promise is that
  the resume stays in the browser, that is the one navigation that must not be possible. The buttons
  carry `type="button"`; the `preventDefault` on the form is the backstop.

## Templates

The palette button floating over the preview opens the appearance panel — six preset swatches, a
custom colour picker behind **Custom…**, and thumbnails of the four layouts rendered from your own
resume. The panel takes over the editing column rather than floating over the sheet: four
thumbnails want to be compared at a size worth judging, and a popover perched over the preview would
cover the very thing they are previews of. It is a mode, not a route — the form underneath is
hidden rather than unmounted, so nothing in it is lost, and the ✕ is the way back. On mobile the
same trigger sits in the preview dialog's toolbar, always solid, since a touch device never hovers.

The four layouts:

| Template     | Layout                                                                                              | The colour picker tints |
| ------------ | --------------------------------------------------------------------------------------------------- | ----------------------- |
| **Classic**  | Two columns, serif headings on a full-height colour sidebar                                         | the sidebar             |
| **Modern**   | Two columns, tinted contact panel on the left, uppercase headings on hairline rules                 | the panel               |
| **Formal**   | Single column, centered serif header over a dashed rule                                             | the name                |
| **Timeline** | Banded header, 70/30 columns with the rail on the **right**, dated timeline entries and pill skills | the name and job titles |

All four render the same resume to all three outputs: the live preview, the PDF, and the standalone
HTML export. Because each one tints a different area, switching template resets the colour to that
template's own default rather than carrying over a choice made for another. Modern additionally
flips its own text between ink and white depending on how dark the picked colour is, so the panel
stays readable at either end.

### Adding a template

Each template lives in its own folder — `template/classic/`, `template/modern/`, `template/formal/`,
`template/timeline/` — holding its PDF document, its HTML builder, and whatever styles and sections
it needs. What sits directly in `template/` is only what they share: font registration, the A4
dimensions, the HTML escaping helpers, the preview iframe, the picker, and the download buttons.
Templates are registered in one place,
[`registry.tsx`](src/app/resume-editor/components/template/registry.tsx), so adding one means a new
folder and a single entry. Each has its own spec under `e2e/`, and
[`e2e/template-picker.spec.ts`](e2e/template-picker.spec.ts) asserts the full set — add yours to its
`EXPECTED_TEMPLATES` or it will fail.

Only two fonts are available: **Noto Sans** (400/700) and **Noto Serif** (**bold only** — see
[`fonts.ts`](src/app/resume-editor/components/template/fonts.ts)). A serif template therefore uses
Noto Serif for bold display text and Noto Sans for body copy, as Classic and Formal both do.

### The preview is not a rasterised PDF

This is the thing to understand before writing a template, and it has cost real debugging time more
than once. The preview renders the _very same_ @react-pdf element tree into an iframe, where the
primitives land as unknown DOM elements (`<VIEW>`, `<TEXT>`) and their style objects are applied as
plain CSS. That makes it cheap and instant, but every gap between yoga and the browser becomes a
silent visual bug:

- **Sizes need explicit units**, as strings: `"11.19pt"`, never `11.19`. A bare number means points
  in the PDF and _pixels_ in the preview — the layout quietly shrinks by a quarter. Hence the `pt()`
  helper each template carries in its `units.ts`.
- **Every flex container must spell out `display: "flex"`.** It is not the CSS default.
- **`Svg`, `Path` and `Circle` draw nothing.** Build shapes from `View` with `borderRadius` and
  `borderWidth` — see
  [`contact-icons.tsx`](src/app/resume-editor/components/template/modern/contact-icons.tsx) and
  [`marker.tsx`](src/app/resume-editor/components/template/timeline/marker.tsx). The same applies to
  `Image`, which is why no template shows a photo.
- **`Link` becomes `<link>`, which the browser's own stylesheet hides.** Any link style needs
  `display: "flex"`.
- **Set `boxSizing: "border-box"` on anything bordered.** Yoga puts borders inside the box; the
  browser defaults to content-box, so a bordered dot renders at the wrong size in the preview only.
- **No CSS grid, no `calc()`, no `::before`/`::after`.** Use `flexWrap` with percentage widths,
  flex sizing, and explicit `Text` elements for bullets and separators.

Because none of this shows up in a passing test, verify a template by looking at its actual PDF.
`poppler` is not a dependency; on macOS `qlmanage -t -s 1400 -o <dir> <pdf>` rasterises a page to
PNG.

## HTML export

**Download HTML** writes the same A4 layout as the PDF — for whichever template is selected — into a
single `resume.html` file: one
document, all CSS inlined, no build step and no assets to ship alongside it. That makes it easy to
host as a personal resume page, paste into an email, or keep under version control as text.

The only external reference is the Google Fonts stylesheet for Noto Sans/Noto Serif; every family
falls back to a system stack, so the file still renders correctly offline. The layout stacks the
sidebar above the content below 700px, and `@media print` restores the A4 sheet — printing the
exported file gives back a PDF.

Each template owns its builder — for example
[`build-classic-resume-html.ts`](src/app/resume-editor/components/template/classic/build-classic-resume-html.ts)
— with coverage in [`e2e/html-export.spec.ts`](e2e/html-export.spec.ts).

## Markdown for agents

**Download → Copy as Markdown** puts the resume on the clipboard as Markdown. The PDF and the HTML export
are layouts — a model reading either has to recover the structure from position and type size —
whereas Markdown carries the same content as headings, lists and links, which is what an AI agent (or
any chat box you paste into) reads without a parser. It is the export for "here is my resume, tailor
it to this job".

It follows the preview rather than the storage shape: hidden sections are left out, empty fields
never become empty headings, dates render as `Jan 2018 — Jan 2020` (`Present` for an ongoing entry),
and job bullets become a list. Nothing lands on disk — the Markdown only ever exists on the
clipboard, which is why
[`e2e/copy-markdown.spec.ts`](e2e/copy-markdown.spec.ts) reads it back from there.

The builder is [`src/lib/resume-markdown.ts`](src/lib/resume-markdown.ts), independent of the
templates: there is one Markdown rendering, not one per template.

## Two languages

A resume can be kept in Chinese and in English at once. The tabs in the middle of the editor's bar
switch between them, and the dot marks the **original** — the one language everything else is a
translation of.

What is in local storage is a [`ResumeDoc`](src/types/resume-doc.ts): one `Resume` per language,
plus a `primaryLang` that names the source of truth. `Resume` itself is untouched by any of it, so
the templates, the PDF and the WebMCP tools keep seeing exactly the shape they always have. One
invariant holds the whole thing up, and it lives in
[`useResumeDoc`](src/app/resume-editor/hooks/useResumeDoc.ts): a write only ever lands in the locale
that was active when it was requested, and the debounced save is flushed before any switch. Text
typed in English cannot end up in the Chinese locale, and corrections made in a translation never
travel back to the original.

Only prose is translated. [`fields.ts`](src/lib/translation/fields.ts) lists the fields a translator
may touch — the wanted job, the city, the profile, job titles and descriptions, schools, degrees and
majors — and everything absent from it is copied verbatim. That is the point: names, emails, phones
and URLs are not prose, and a skill list through a translator turns TypeScript into 打字稿 and
Google into 谷歌. Company names sit just inside that line too, and are copied.

Each translated field remembers two strings: the source text it was made from, and what the
translator produced. Storing the strings rather than a hash costs a few KB and buys plain `===`
comparisons for the two states the editor has to tell apart — **stale** (the original has moved on)
and **edited** (you rewrote it) — plus a free revert. That is what lets the panel at the top of a
translated resume offer three different things:

- **Update translation**, when the original has changed. Fields you rewrote are left exactly as they
  are; only untouched ones take the new translation.
- **Re-translate**, which throws those rewrites away and starts over. It asks first, and says how
  many fields it would replace.
- **Make this the original**, which swaps the roles of the two languages. It seeds provenance for
  the demoted locale — without that every field would read stale, and the editor would offer to
  "update" hand-written text by sending it back through the translator.

The translator is the browser's own ([`translator.ts`](src/lib/translator.ts) wraps it), so the
resume is not uploaded to translate it. The model is downloaded once, on a user activation, from the
**Translation** row of the sparkles panel in the bar; after that it stays on the device. Chrome 138+
or Edge 148+ on desktop — elsewhere the second language still works, you just write it yourself.

## Rewriting on-device

The wand beside **Profile** and beside each role's description opens advice on writing that section,
and offers to do it for you.

Opening it costs nothing. The guidance is written down rather than generated, so the panel is useful
in a browser with no model at all, and a reader who only wanted to know what to write never waits on
anything. The model is reached only when one of the three actions is pressed — polish, shorten, lead
with strengths for a profile; polish, strong verbs, concise for a description. The result streams in
as a draft and the field keeps what it has until **Use this** is pressed, which is what makes trying
an action safe.

Two details in [`rewrite.ts`](src/lib/rewrite.ts) are worth knowing before editing it. Every run
clones the shared session rather than reusing it, so a rewrite never sees the earlier ones — reusing
the session directly would leave the profile in context while a job description is rewritten, and
turn a retry into "rewrite it again". And the bullet fields are stored as one string joined by
`SPLIT_TEXT`, a bare `|` that means nothing to a model: it goes in as `- ` lines and comes back
through a parser that strips every common bullet glyph, because models are inconsistent about which
one they use even when told.

The API is Chrome's Prompt API, wrapped by
[`language-model.ts`](src/lib/language-model.ts) the same way and for the same reasons the translator
is — a download has to survive the popover that started it being closed, and every wand in the form
has to show the same answer. Coverage is in [`e2e/rewrite.spec.ts`](e2e/rewrite.spec.ts).

## WebMCP (experimental)

The editor registers itself as a set of AI agent tools using
[WebMCP](https://webmachinelearning.github.io/webmcp/), so a browser agent can fill in the resume
instead of the user typing into every field. WebMCP is a W3C Web Machine Learning Community Group
draft — it is not a W3C Standard and the API is still moving.

Twelve tools cover reading the resume plus writing every section — the header, the summary, skills,
social links, employment history, education, and per-section visibility.

WebMCP ships natively in Edge 147+. In Chrome 149 it is an origin trial; locally, open
`chrome://flags/#enable-webmcp-testing`, set it to **Enabled**, and relaunch. The sparkles button in
the editor's bar reports where you stand, on its **Browser agent** row: **Ready** with the number of
tools registered, **Unavailable** when the browser has no `document.modelContext`, **Error** when
`registerTool` rejected. It is the same panel that turns on translation, since both are models built
into the browser and neither sends the resume anywhere. Then ask the agent something like:

> Read my resume, then rewrite the profile summary for a staff frontend role and add my job at Vercel
> from March 2020 to now.

**[Full tool reference and conventions → docs/webmcp.md](docs/webmcp.md)**

Automated coverage lives in [`e2e/webmcp.spec.ts`](e2e/webmcp.spec.ts), which stubs
`document.modelContext` so the tools can be exercised in plain Chromium.

## License

[MIT](LICENSE) © Leo Chiu
