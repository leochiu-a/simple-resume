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
A browser without the API just gets the new theme. It is one of the app's two view transitions; the
other is the editor's [appearance swap](#the-editor), and the two must not restyle each other, which
is what the transition types there are for.

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
  that is not the sheet: two of the eight templates default to near-black, and dark paper lifts that
  towards white so it does not disappear.

**The hero is never invisible, even if its entrance never runs.** `.landing-rise` is a CSS animation
whose resting state is visible and whose keyframe supplies only the `from` — do not drive it from JS.
An interrupted JS animation could strand the whole pitch at `opacity: 0`.

## The writing guide

[`/how-to-write-a-resume`](../src/app/how-to-write-a-resume/page.tsx) is six edits, each with the
change itself under it rather than a claim about it. The content is
[`EDITS`](../src/components/landing/guide/edits.ts) and each entry carries a `figure`: a `line`
rewritten, a `stack` reordered, or a list of `chips` cut.

**Do not put a rendered sheet on this page.** It was built that way first — a pinned `TemplateSheet`
repaired step by step as you scrolled — and it had to come out. A4 in a column scales to about 0.66,
which puts the template's body type on screen at **7.9px**: the one thing a reader came for, the
actual words, was the one thing they could not read. Widening the column does not fix it (13px needs
a sheet around 860px wide) and nothing fixes it on a phone. The figures are set at reading size
instead, and each shows only what it can show honestly.

The `guide-*` keyframes in [`globals.css`](../src/app/globals.css) follow `.landing-rise`'s rule
exactly: **every resting state is the finished state and every keyframe supplies only the `from`**,
so an interrupted animation leaves a figure that is already correct. They are additionally gated
behind `[data-played]`, which each figure sets on itself while it is on screen — without that they
would finish during the page load, before anyone was looking.

**When a figure plays is as important as how long it takes.** The first version fired at
`threshold: 0.25` against the bottom of the viewport, so a figure ran while it was still a quarter
visible at the very bottom of the screen and was over before the reader's eye reached it. That reads
as "the animation is too fast" and is really "the animation already happened" — the band is now inset
top and bottom and wants half the figure inside it. `data-played` is also dropped again on the way
out, so scrolling back replays it; the animation is the explanation, and an explanation you get one
chance to catch is a bad one. It is one play per arrival and not a loop, because six figures cycling
forever is motion nobody asked for and a change that keeps un-happening stops reading as a change.
The rewrite is two beats — the old line is struck, and only then is the new one written — since
running them together showed both halves at once and demonstrated neither.

[`e2e/writing-guide.spec.ts`](../e2e/writing-guide.spec.ts) asserts both. Note that a hidden page
receives no `IntersectionObserver` callbacks at all, so none of this can be checked in a preview pane
that is not actually visible.

Two details worth keeping. The struck line fades its `text-decoration-color` in rather than drawing a
rule across the box, because the old wording runs to three lines at narrow widths and a background
rule cannot cross more than one. And the rewritten line arrives a word at a time rather than a
character at a time, for the same reason: a clip travelling left to right uncovers every line of a
wrapped paragraph at once, which reads as a wipe and not as writing.

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

**Appearance takes over the editing column, and the two cross-fade rather than cut.** It is a mode,
not a route — the form stays mounted and keeps its focus, its scroll and any half-typed edit, so
`hidden` is what hides it. The animation is a React
[`<ViewTransition>`](../src/app/resume-editor/page.tsx) around the panel and nothing around the form:
a boundary animates on mount and unmount, and the form does neither, so its half of the cross-fade
comes from the root snapshot instead. Both directions run inside a Transition, which is the only
reason any of it animates — React reaches for `startViewTransition` for a Transition and not for a
plain `setState`, and losing that line is silent. Each direction is tagged with a transition type,
because root's old frame is the form on the way in and a blank column on the way out; the rules, and
why the two are not symmetric, are in
[`appearance-transition.module.css`](../src/app/resume-editor/appearance-transition.module.css).

**Every view transition in the app is silenced under `prefers-reduced-motion`,** by one rule over
`::view-transition-*(*)` in `globals.css` rather than per animation — the states then swap, which is
what a browser without the API does anyway. It is deliberately the one motion rule here that is not
opt-in: `.landing-rise` and the guide figures each gate themselves, but a transition added later
would otherwise ship without an answer. The theme wipe is the exception it cannot reach, since that
animation is driven through the Web Animations API and `animation-duration` has nothing to say about
one of those.

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
