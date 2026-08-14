# Interface

How the landing page and the editor are built, and the rules that keep them one product. Read this
before changing a colour, a font, or the shape of either surface.

## One palette, two vocabularies

Both surfaces are the same printed page — the landing page with the argument, the editor with the
tools out. That is enforced rather than agreed: [`globals.css`](../src/app/globals.css) holds one set
of `--c-*` values and everything else aliases them. shadcn's tokens (`--background`, `--border`,
`--primary`…) point at them for the editor, and the landing page points at them again under paper
names (`--paper`, `--rule`, `--graphite`). Retuning a colour moves both, and neither can drift.

Dark mode is the same aliases over a second set of `--c-*` values under `.dark`, so nothing else in
the app knows which theme is on. Both surfaces flip the same way, too:
[`applyTheme`](../src/lib/theme-transition.ts) runs the change inside a View Transition and wipes a
circle out from wherever you clicked — the editor's `…` menu and the landing page's toggle share it.
A browser without the API just gets the new theme.

Three faces, registered in [`layout.tsx`](../src/app/layout.tsx) and used the same way on both
surfaces: **Fraunces** for anything display, **Archivo** for body copy, **IBM Plex Mono** for labels,
eyebrows and section numbers.

**The sheet is exempt from all of it.** It renders inside an iframe carrying its own document, so
neither the palette nor dark mode reaches it: it is paper-white in both themes, as the PDF will be.
Do not give it a print grain or a tint it did not ask for — the preview's whole value is that it is
not lying about the output.

## The landing page

Two things are worth knowing before editing [`src/components/landing/`](../src/components/landing):

- **The hero's sheet is a real template, not a screenshot.** It renders the registry's own
  `template.render()` into an iframe carrying `SHEET_DOCUMENT`, exactly as the editor's preview and
  the picker's thumbnails do — so a template that changes shows up here without anyone remembering
  to retake a picture. The frame is never remounted: switching template or colour swaps only the
  children inside it, which is why the paper does not flash. Adding a template to
  [`registry.tsx`](../src/app/resume-editor/components/template/registry.tsx) adds it to the hero's
  picker too, with no other edit.
- **The colour picked for the sheet is the whole page's accent.** `AccentProvider` publishes it as
  the CSS variable `--ink` on a `[data-ink]` wrapper, which is why every section below the hero can
  tint itself while staying a server component. Read `--ink-display` rather than `--ink` for anything
  that is not the sheet: two of the four templates default to near-black, and dark paper lifts that
  towards white so it does not disappear.

**The hero is never invisible, even if its entrance never runs.** `.landing-rise` is a CSS animation
whose resting state is visible and whose keyframe supplies only the `from` — do not drive it from JS.
An interrupted JS animation could strand the whole pitch at `opacity: 0`.

## The editor

**The form and the preview scroll independently, and neither hides under the mobile address bar.**
The shell is `h-dvh` — not `h-screen`, because `100vh` is the _largest_ viewport on mobile and the
bottom of the page would sit behind the address bar until it retracted — and the form and the preview
each own an `overflow-y-auto` region. That is what separates the two scrollbars. While the page
scrolled and the preview was `sticky`, dragging anywhere moved the form and the preview merely held
its position, which is why the two felt joined.

Above them is one bar, laid out as a three-column grid — identity left, document centre, tools
right. The centre slot holds the [language tabs](../README.md#two-languages), which are the one
control here that says _which document you are looking at_; centring is what makes that read as a
mode rather than as another button. A grid rather than flex with auto margins, because the two side
slots are different widths and under flex the tabs would sit visibly off-axis.

The tools on the right are Download, the on-device AI button, and a `…` menu holding the theme and
the GitHub link. Appearance is not among them: it moved onto the preview, where you can see what it
changes.

The form is set as a document in parts rather than a stack of cards: each section is a hairline rule,
a number in mono and a name in Fraunces — see
[`section.tsx`](../src/app/resume-editor/components/form/section.tsx). Fields are hairline boxes
filled with `--card`, and focus draws the border rather than a glow. The chrome deliberately takes no
colour from the resume: the sheet is the only coloured thing on screen, which is also why the editor
sets no `--ink` of its own.

[`CropMarks`](../src/components/crop-marks.tsx), shared with the hero, frame the sheet on desktop.
They sit _outside_ it and the preview column scrolls, so `CROP_MARK_GUTTER` is held back on each side
when the scale is computed or the marks land outside the scroll box and are clipped. Desktop-only for
the same reason: at mobile widths the gutter costs more than the marks add.

## Prohibitions

Both are in [`AGENTS.md`](../AGENTS.md) as well, because they are the two rules most likely to be
broken by someone who never opened this file.

- **Nothing in the bar whose accessible name contains "Open Resume"** other than the wordmark itself.
  Two links in one bar whose names overlap are ambiguous to read out and to select.
- **Never give the editor's form an action, a method or a submit handler.** A submit serialises every
  field into the query string, where name, phone and profile reach the server in the request line and
  stay in history — the one way the resume can leave the browser. Every button carries
  `type="button"`; the `preventDefault` on the form is the backstop.
