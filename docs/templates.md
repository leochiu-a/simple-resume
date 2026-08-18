# Templates

How the eight layouts are built, how to add a ninth, and the one thing about the preview that has cost
real debugging time more than once.

## Adding a template

Each template lives in its own folder — `template/classic/`, `template/modern/`, `template/formal/`,
`template/timeline/`, `template/ledger/`, `template/banner/`, `template/compact/`, `template/dated/`
— holding its PDF document, its HTML builder, and whatever styles and sections it needs. What sits
directly in `template/` is only what they share: font registration, the A4 dimensions, the HTML
escaping helpers, the preview iframe, the picker, and the download buttons.

A folder owns its own look, duplication included. Every template carries its own `units.ts` with the
same `pt()` in it, and Modern and Banner each have their own copy of the WCAG contrast test that
decides whether their tint takes white text or ink. Hoisting either would tie one template's
thresholds and reference width to another's, and those are exactly the numbers a new design needs to
be free to change.

Templates are registered in one place,
[`registry.tsx`](../src/app/resume-editor/components/template/registry.tsx), so adding one means a
new folder and a single entry. That entry includes `atsSafe`, and it is the one field you cannot
answer by looking at the design — see [Whether it survives a parser](#whether-it-survives-a-parser). Each has its own spec under [`e2e/`](../e2e), and
[`e2e/template-picker.spec.ts`](../e2e/template-picker.spec.ts) asserts the full set — add yours to
its `EXPECTED_TEMPLATES` or it will fail.

Only two fonts are available: **Noto Sans** (400/700) and **Noto Serif** (**bold only** — see
[`fonts.ts`](../src/app/resume-editor/components/template/fonts.ts)). A serif template therefore uses
Noto Serif for bold display text and Noto Sans for body copy, as Classic and Formal both do.

Name them through `SANS` and `SERIF` rather than as the strings `"Noto Sans"` / `"Noto Serif"`. They
are _stacks_, and what the second entry carries is Chinese — see below. A template that spells the
family out gets a resume that renders in the editor and downloads with no Chinese in it at all, which
is how Classic shipped for a while.

Because each template tints a different area, switching template resets the colour to that template's
own default rather than carrying over a choice made for another. Modern and Banner additionally flip
their own text between ink and white depending on how dark the picked colour is, so the panel and the
band stay readable at either end.

The templates with no area to fill put the colour on type instead — Formal on the name, Compact and
Dated on their section titles — and there the flip is not available: a near-white pick makes that
type near-invisible. That is the user's choice to make, and the rule those templates keep is only
that the colour never reaches the body copy, so what it can spoil is a heading rather than the
resume.

Banner is also the one template whose colour reaches the paper's edge. It gets there by keeping the
padding on the `Page` and cancelling it with a matching negative margin, rather than by dropping the
padding and letting each block pad itself: @react-pdf reapplies a page's padding to every page it
spills onto, and a `View`'s padding is not reapplied where it wraps, so the second route costs page
two its top margin. [`e2e/page-margins.spec.ts`](../e2e/page-margins.spec.ts) is what holds that.

## Chinese

The two faces above are Noto's _latin_ subsets: about 3,000 characters, not one of them Han. A
Chinese resume used to download as a PDF with every character missing, and missing in the way that
does not look like missing — @react-pdf draws an absent glyph with a zero advance, so a whole word
piled onto one x and the line ran straight through the wreckage.

**Noto Sans TC** is the third face, and it is loaded only by the resumes that need it. That is not an
optimisation to trade away: @react-pdf fetches _every_ family a style names before it can lay out a
page, and the file is 5.7MB against the Latin subset's 0.6MB. `applyResumeFonts` reads the resume for
Han before a template builds its tree and appends the face to both stacks the first time it finds
any; the registry runs it inside every template's `render`, which is the one thing all four rendering
paths go through. It is a script test rather than a language check on purpose — an English resume
with one Chinese company name in it needs the face for exactly that name, which is the case any
document-level answer gets wrong.

The serif stack falls back to the same sans face. A second CJK file is another 8MB for what is only
ever bold display type, and Chinese set in the sans beside serif Latin reads as a deliberate pair.

Two more things follow from CJK that do not from Latin:

- **Lines break between characters, not between words**, so `fonts.ts` owns a hyphenation callback
  rather than the one-liner that used to disable hyphenation. It offers a break either side of every
  Han character — minus a closing bracket or comma, which may not open a line, and an opening
  bracket, which may not end one — and it offers them as _empty_ syllables. @react-pdf reads a gap
  between two non-empty syllables as a hyphenation point and draws a hyphen at whichever one it
  breaks on, so 「介面規-範」 is what the obvious version produces. An empty one is a zero-width break,
  and it adds nothing to the string a parser extracts.
- **A mixed Chinese/English paragraph comes out ragged** in the PDF, more so than in the preview. A
  break between two Han characters has no elasticity, so @react-pdf's line breaker prefers any space
  it can reach and ends the line early on the way to the next Latin word. The browser fills those
  lines. It is a difference in the last inch of a line, not in where the pages break, which is what
  `page-margins.spec.ts` holds the two renderings to.

The preview loads the same five files from `public/fonts`, through `@font-face` rules in
[`sheet-document.ts`](../src/app/resume-editor/components/template/sheet-document.ts) — the CJK ones
carrying a `unicode-range`, which is what keeps them off a page that has no Chinese on it.

## Whether it survives a parser

An applicant tracking system never sees the page. It sees the string a text extractor pulls out of
the PDF, and a template can lose that while looking perfect on paper. `atsSafe` in the registry says
which ones hold up, and the picker puts an ATS-safe pill on every card that carries it — both in the
editor's appearance panel and in the landing page's gallery.

Two things are known to break it, and both are silent:

- **Wide `letterSpacing`.** Past roughly 1.5pt the gaps read as spaces rather than kerns, and every
  glyph comes out as its own word — a job title extracts as `S e n i o r j o b` and matches no
  opening. Classic is the template this disqualifies: its `subText` tracks at 1.5pt, which costs it
  the job title, every date range and the project URL.
- **A link whose URL exists only in the annotation.** `<Link src>` with a label like "Github" draws
  the label and nothing else into the text; most parsers never open annotations, so the profile is
  simply not there. Put a readable URL in the text.

Two columns are _not_ a problem, which is worth knowing before redesigning around it: the sidebar
extracts as one block ahead of the main column rather than interleaving line by line.

To answer the field for a new template, extract its text rather than judging the layout — download
its PDF and check that the job title, the dates, the skills and every URL survive as searchable
strings. `e2e/template-picker.spec.ts` asserts the marked set, so a template that loses the parse
cannot keep the badge.

## The preview is not a rasterised PDF

This is the thing to understand before writing a template. The preview renders the _very same_
@react-pdf element tree into an iframe, where the primitives land as unknown DOM elements (`<VIEW>`,
`<TEXT>`) and their style objects are applied as plain CSS. That makes it cheap and instant, but
every gap between yoga and the browser becomes a silent visual bug:

- **Sizes need explicit units**, as strings: `"11.19pt"`, never `11.19`. A bare number means points
  in the PDF and _pixels_ in the preview — the layout quietly shrinks by a quarter. Hence the `pt()`
  helper each template carries in its `units.ts`.
- **Every flex container must spell out `display: "flex"`.** It is not the CSS default.
- **`Svg`, `Path` and `Circle` draw nothing.** Build shapes from `View` with `borderRadius` and
  `borderWidth` — see
  [`contact-icons.tsx`](../src/app/resume-editor/components/template/modern/contact-icons.tsx) and
  [`marker.tsx`](../src/app/resume-editor/components/template/timeline/marker.tsx). The same applies
  to `Image`, which is why no template shows a photo.
- **`Link` becomes `<link>`, which the browser's own stylesheet hides.** Any link style needs
  `display: "flex"`.
- **Set `boxSizing: "border-box"` on anything bordered or padded whose width you set.** Yoga puts
  borders and padding inside the box; the browser defaults to content-box. A bordered dot renders at
  the wrong size in the preview, and a `width: "50%"` item with padding comes out wider than half —
  which turned two columns of skills into a single stack, in the preview only.
- **@react-pdf's own shorthands are not CSS.** `paddingHorizontal`, `paddingVertical`,
  `marginHorizontal` and friends are understood by yoga and silently dropped by the browser, so the
  PDF gets the spacing and the preview gets none. Write `paddingLeft`/`paddingRight` instead.
- **A `Link` inside a run of text has to be its own flex item.** `display: "flex"` is what makes a
  link visible at all, and inside a `Text` it also makes it a block — so a line of links renders as
  a stack with the separators stranded on lines of their own. Put each one in its own `Text` inside
  a `flexDirection: "row"` container, as `compact/links.tsx` does.
- **No CSS grid, no `calc()`, no `::before`/`::after`.** Use `flexWrap` with percentage widths, flex
  sizing, and explicit `Text` elements for bullets and separators.

Because none of this shows up in a passing test, verify a template by looking at it — and at _both_
renderings, not one. Every trap above is a place where the two disagree, so a correct PDF is not
evidence about the preview and vice versa. Three of them shipped in one round of new templates
because only the PDFs were checked.

On macOS `qlmanage -t -s 1400 -o <dir> <pdf>` rasterises a page to PNG (`poppler` is not a
dependency). For the preview, screenshot `iframe[title="Resume preview"]` from a Playwright run.

## The appearance panel

The panel takes over the editing column rather than floating over the sheet: the thumbnails want to
be compared at a size worth judging, and a popover perched over the preview would cover the very
thing they are previews of. It is a mode, not a route — the form underneath is hidden rather than
unmounted, so nothing in it is lost, and the ✕ is the way back. On mobile the same trigger sits in
the preview dialog's toolbar, always solid, since a touch device never hovers.

## HTML export

Each template owns its builder — for example
[`build-classic-resume-html.ts`](../src/app/resume-editor/components/template/classic/build-classic-resume-html.ts)
— with coverage in [`e2e/html-export.spec.ts`](../e2e/html-export.spec.ts).

The only external reference is the Google Fonts stylesheet for Noto Sans/Noto Serif; every family
falls back to a system stack, so the file still renders correctly offline. Chinese in an exported
file is set by whatever the reader's system has — the 5.7MB face the PDF embeds is not something to
put behind a link in a file meant to be opened from disk. The layout stacks the
sidebar above the content below 700px, and `@media print` restores the A4 sheet — printing the
exported file gives back a PDF.
