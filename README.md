# Simple RESUME

![](public/image.png)

An online tool to create a resume — with no account, and nothing uploaded anywhere.

Online site: https://simple-resume-nu.vercel.app

## Features

- Create a resume easily.
- Pick between [four templates](#templates) and tint any of them with the colour picker.
- Export the resume as a PDF, as a [standalone HTML file](#html-export), or
  [copy it as Markdown](#markdown-for-agents) to paste into an AI agent.
- The resume data is stored in local storage — there is no account and no server to send it to.
- Build the resume by talking to a browser AI agent, via [WebMCP](#webmcp-experimental).

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Shadcn UI
- react-pdf/renderer

## Local Development

1. Download the repo git clone `gh repo clone leochiu-a/simple-resume`
2. Change the directory cd `simple-resume`
3. Install the dependency `pnpm i`
4. Start a development server `pnpm dev`
5. Open your browser and visit http://localhost:3000 — the editor itself is at
   [/resume-editor](http://localhost:3000/resume-editor)

## Look and feel

Both surfaces are the same printed page — the landing page with the argument, the editor with the
tools out. That is enforced rather than agreed: [`globals.css`](src/app/globals.css) holds one set of
`--c-*` values and everything else aliases them. shadcn's tokens (`--background`, `--border`,
`--primary`…) point at them for the editor, and the landing page points at them again under paper
names (`--paper`, `--rule`, `--graphite`). Retuning a colour moves both, and neither can drift.

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

Two things not to do to the editor's nav:

- **No `backdrop-filter`.** A backdrop-filter makes the nav a containing block for fixed positioning,
  and the colour picker's dismiss overlay is a `fixed inset-0` rendered inside the nav. Blur the bar
  and that overlay shrinks to the height of the bar, so clicking the page stops closing the picker.
- **Nothing whose accessible name contains "Simple Resume"** other than the wordmark itself. Two
  links in one bar whose names overlap are ambiguous to read out and to select.

## Templates

The button to the left of the colour picker switches between four layouts:

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

## WebMCP (experimental)

The editor registers itself as a set of AI agent tools using
[WebMCP](https://webmachinelearning.github.io/webmcp/), so a browser agent can fill in the resume
instead of the user typing into every field. WebMCP is a W3C Web Machine Learning Community Group
draft — it is not a W3C Standard and the API is still moving.

Twelve tools cover reading the resume plus writing every section — the header, the summary, skills,
social links, employment history, education, and per-section visibility.

WebMCP ships in Edge 147+, and in Chrome behind a flag: open `chrome://flags/#enable-webmcp-testing`,
set it to **Enabled**, and relaunch. The nav bar shows an **Agent ready** badge when registration
succeeded, and **Agent unavailable** when the browser has no WebMCP support. Then ask the agent
something like:

> Read my resume, then rewrite the profile summary for a staff frontend role and add my job at Vercel
> from March 2020 to now.

**[Full tool reference and conventions → docs/webmcp.md](docs/webmcp.md)**

Automated coverage lives in [`e2e/webmcp.spec.ts`](e2e/webmcp.spec.ts), which stubs
`document.modelContext` so the tools can be exercised in plain Chromium.
