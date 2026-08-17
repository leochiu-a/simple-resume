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
new folder and a single entry. Each has its own spec under [`e2e/`](../e2e), and
[`e2e/template-picker.spec.ts`](../e2e/template-picker.spec.ts) asserts the full set — add yours to
its `EXPECTED_TEMPLATES` or it will fail.

Only two fonts are available: **Noto Sans** (400/700) and **Noto Serif** (**bold only** — see
[`fonts.ts`](../src/app/resume-editor/components/template/fonts.ts)). A serif template therefore uses
Noto Serif for bold display text and Noto Sans for body copy, as Classic and Formal both do.

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
- **Set `boxSizing: "border-box"` on anything bordered.** Yoga puts borders inside the box; the
  browser defaults to content-box, so a bordered dot renders at the wrong size in the preview only.
- **No CSS grid, no `calc()`, no `::before`/`::after`.** Use `flexWrap` with percentage widths, flex
  sizing, and explicit `Text` elements for bullets and separators.

Because none of this shows up in a passing test, verify a template by looking at its actual PDF.
`poppler` is not a dependency; on macOS `qlmanage -t -s 1400 -o <dir> <pdf>` rasterises a page to
PNG.

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
falls back to a system stack, so the file still renders correctly offline. The layout stacks the
sidebar above the content below 700px, and `@media print` restores the A4 sheet — printing the
exported file gives back a PDF.
