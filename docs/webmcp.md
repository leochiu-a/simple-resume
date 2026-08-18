# WebMCP support

The resume editor exposes itself to AI agents as a set of
[WebMCP](https://webmachinelearning.github.io/webmcp/) tools, so an agent can fill in a resume by
calling functions instead of guessing where to click. This document lists what an agent can and
cannot do, and the conventions it has to follow.

## Status

WebMCP is a **W3C Web Machine Learning Community Group draft** (latest draft 2026-07-21). It is not a
W3C Standard and is not on the Standards Track, so treat everything here as experimental — the API
can still change under us. Two changes have already landed that older tutorials get wrong:

- The getter moved off `Navigator` to `Document` on **2026-05-27**. Chrome shipped it on `navigator`
  first and only deprecated that alias in 150, so a given build may expose either surface or both.
  `getModelContext()` prefers `document.modelContext` and falls back to `navigator.modelContext`.
- There is **no `unregisterTool`**, and no way to update a registered tool. Unregistration happens by
  aborting the `AbortSignal` passed to `registerTool`.

## Browser support

| Browser    | Status                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Edge 147+  | Ships natively                                                                     |
| Chrome 149 | Origin trial; locally, enable `chrome://flags/#enable-webmcp-testing` and relaunch |
| Others     | No support — the editor falls back to being a normal form                          |

The nav bar's on-device AI button (the sparkles icon) reports which case you are in, on its **Browser
agent** row:

- **Ready** — registration succeeded, and the row says how many tools are registered
- **Unavailable** — the browser has no `document.modelContext`
- **Error** — the surface is there but `registerTool` rejected

The same panel is where on-device translation is turned on, since both are browser-built-in models
and neither sends the resume anywhere.

To call tools by hand, use the Chrome DevTools WebMCP panel or the Model Context Tool Inspector
extension.

### Checking support in the console

`document.modelContext` prints as `ModelContext {ontoolchange: null}`, which looks empty but is not —
`ontoolchange` is the only own property, and `registerTool` / `getTools` live on the prototype. To see
what you actually have:

```js
const mc = document.modelContext ?? navigator.modelContext;
({
  surface: document.modelContext ? "document" : navigator.modelContext ? "navigator" : "none",
  registerTool: typeof mc?.registerTool,
  tools: await mc?.getTools(),
});
```

### Deploying to a real origin

The `chrome://flags` switch only affects your own browser. For WebMCP to work for _other people_ on a
production origin during the Chrome origin trial, the site has to serve a registered origin-trial
token — either an `Origin-Trial` response header or a `<meta http-equiv="origin-trial">` tag. **This
app does not ship a token**, so on the deployed site the tools only appear for visitors who enabled
the flag themselves (or who are on a browser with native support).

## How it is wired

| File                                                                                                                                                | Role                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`src/types/webmcp.d.ts`](../src/types/webmcp.d.ts)                                                                                                 | Ambient types for `document.modelContext`                            |
| [`src/lib/webmcp.ts`](../src/lib/webmcp.ts)                                                                                                         | Feature detection, `defineTool`, result helpers                      |
| [`src/app/resume-editor/webmcp/resume-tools.ts`](../src/app/resume-editor/webmcp/resume-tools.ts)                                                   | The 8 tool definitions                                               |
| [`src/app/resume-editor/hooks/useResumeMcp.ts`](../src/app/resume-editor/hooks/useResumeMcp.ts)                                                     | Registers on mount, aborts on unmount, feeds in the language context |
| [`src/app/resume-editor/components/on-device-ai/on-device-ai-button.tsx`](../src/app/resume-editor/components/on-device-ai/on-device-ai-button.tsx) | The nav panel, shared with on-device translation                     |

Lifecycle: tools are registered once when the editor mounts and torn down by aborting the controller
when it unmounts, so navigating away from `/resume-editor` removes all 8 tools and coming back
re-registers them. Form state is read through a ref, so a tool always writes to the current form
without re-registering on every keystroke.

Writes go through react-hook-form's `reset` rather than `setValue`. The sections are rendered by
`useFieldArray`, which keeps its own copy of the rows and ignores a `setValue` on the whole array,
and the bullet fields are `contentEditable` divs that only read their value on mount. `reset`
re-seeds both, which is what makes agent edits actually appear in the form and the preview.

## Tool reference

### `get-resume`

Read-only (`readOnlyHint: true`). Takes no arguments. Returns the whole resume as JSON.

The returned shape is **not** the stored shape — it is flattened to match what the write tools
accept, and every list entry carries its `index`:

```json
{
  "language": {
    "active": "zh-Hant",
    "primary": "zh-Hant",
    "isTranslation": false,
    "exists": true
  },
  "name": "Leo Chiu",
  "wantedJob": "Staff Frontend Engineer",
  "city": "Taipei",
  "phone": "0912345678",
  "email": "leo@example.com",
  "profile": "Frontend engineer focused on design systems…",
  "skills": ["TypeScript", "React", "Next.js"],
  "socialLinks": [{ "name": "GitHub", "url": "https://github.com/leochiu-a" }],
  "employmentHistory": [
    {
      "index": 0,
      "company": "KKday",
      "jobTitle": "Senior Frontend Engineer",
      "from": "2021-04",
      "to": "",
      "bullets": ["Led the Next.js 16 and React 19 migration", "Built the shared design system"]
    }
  ],
  "educations": [
    {
      "index": 0,
      "school": "National Taiwan University",
      "degree": "Bachelor",
      "major": "Computer Science",
      "from": "2014-09",
      "to": "2018-06"
    }
  ],
  "visibility": {
    "profile": true,
    "employmentHistory": true,
    "projects": true,
    "educations": true,
    "skills": true,
    "socialLinks": false
  },
  "sectionOrder": [
    "profile",
    "employmentHistory",
    "projects",
    "educations",
    "skills",
    "socialLinks"
  ]
}
```

The `language` block describes the document rather than the resume, and it is the only way to tell
two locales apart — see [Languages](#languages) below.

`sectionOrder` and `visibility` are the layout, and they are the read side of `set-section-layout`:
read them before rewriting the layout, and read them back to confirm a section really is hidden.

### `score-resume`

Read-only (`readOnlyHint: true`). Takes no arguments. Grades the resume against twelve rules — eleven scored, one advisory — and
returns the score with every failing check.

This is the one tool that answers _is this resume any good_ rather than _what does it say_. Without
it an agent has no feedback signal: it writes a bullet, reads its own prose back through
`get-resume`, and has to decide from taste alone whether to keep going. Scoring closes that loop —
"keep editing until the score stops improving" becomes a condition the agent can check rather than a
feeling. Nothing is mutated, so it is safe to call between every edit.

```json
{
  "score": 62,
  "band": "fair",
  "outOf": 100,
  "findings": [
    {
      "id": "quantified",
      "title": "Quantified results",
      "status": "fail",
      "gain": 16,
      "detail": "No bullet carries a number. Numbers are what a reader remembers…",
      "locations": [
        {
          "section": "employmentHistory",
          "entryIndex": 0,
          "entryLabel": "KKday",
          "bulletIndex": 1,
          "text": "Built the shared design system"
        }
      ]
    }
  ],
  "passing": ["Contact details", "Email looks valid", "Skills listed"],
  "notes": ["The action-verb check matches a line's opening word against a fixed list…"]
}
```

| Field       | Meaning                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `score`     | 0–100, rescaled over the rules that apply — hidden sections are not counted |
| `gain`      | What bringing this check to a pass adds to the score. `0` when `advisory`   |
| `advisory`  | Reported but not scored — see below                                         |
| `locations` | Where the finding is, in the same indexes `get-resume` reports              |
| `notes`     | Caveats about a check's reliability, when it has any                        |

`locations` is the part worth using: `section`, `entryIndex` and `bulletIndex` are exactly the
arguments `update-entry` takes, so a finding carries straight into the call that fixes it without
searching for the text again. Findings about the document as a whole (overall
length, contact details) have an empty `locations`.

Three things to know before trusting the numbers:

- **`gain` is a floor, not a prediction.** The rules overlap — rewriting a bullet to add a metric
  often fixes its length at the same time, so the score can move by more than the advertised amount.
- **The score is not a ratchet.** An edit can lower it: padding a profile past 120 words trips a
  different rule than the one it was meant to fix. Re-score after each change rather than assuming
  an edit was an improvement.
- **An `advisory` finding will never move the score.** `action-verbs` is the only one today. It
  matches the opening word against a fixed list rather than deciding a part of speech, so it misses
  verbs the list has not met (Instrumented, Containerised) and in Chinese cannot separate a verb from
  a noun sharing its prefix — 管理團隊 and 管理層 both match 管理. Which list a line is judged
  against is read off that line's own opening word, not off the locale the editor is showing, so an
  English resume typed into the zh-Hant slot is measured against the English list — and a report
  where every bullet is flagged means the resume, not a mismatched word list. The finding is still worth acting
  on, because an agent can read the flagged line and judge where the list cannot; it just carries no
  points, and an agent hill-climbing on `score` should not read a stubborn advisory finding as a
  failure to make progress.

The tool reports findings and locations only. It does not name a tool to call or an order to call
them in — that keeps the scorer from breaking when a tool is renamed, and leaves the plan to the
agent, which can see the resume it is holding.

### `submit-review`

Publishes a qualitative review into the score panel, under a heading that credits it to the user's
assistant. Requires `summary`; `notes` is optional and capped at 20.

| Argument  | Type     | Required | Notes                                      |
| --------- | -------- | -------- | ------------------------------------------ |
| `summary` | string   | yes      | One or two sentences on the resume overall |
| `notes`   | object[] | no       | At most 20; anything beyond is dropped     |

Each note takes `comment` (required) plus optional `section`
(`employmentHistory` \| `projects` \| `profile` \| `skills`), `entryIndex`, `bulletIndex`, `quote`
and `suggestion`. Indexes are the ones `get-resume` reports, and the panel resolves them to a
heading — `entryIndex: 0` on `employmentHistory` renders as the company name.

This is the counterpart to [`score-resume`](#score-resume), and the division between them is the
point:

|                 | `score-resume`     | `submit-review`         |
| --------------- | ------------------ | ----------------------- |
| Direction       | Agent reads        | Agent writes            |
| Answers         | Is the shape right | Is the content any good |
| Produced by     | Twelve fixed rules | The agent's judgement   |
| Carries a score | Yes, 0–100         | **No, by design**       |

`score-resume` is exact about shape and blind to meaning — "Increased synergy by 200%" satisfies
every rule and says nothing, and no word list separates 管理團隊 from 管理層. That gap is what a
review fills.

**A review carries no score and never changes one.** The header number is a property of the resume:
the same document scores the same 55 every time, computed from fixed weights, whether or not an agent
ever visits. A model-supplied number would make it a property of one conversation instead — different
on every run, absent for the visitors who have no agent, and unable to update as the user types.
Notes compose with the rules; a second, rival score would not.

The review is held in memory for the session and is **not** persisted, unlike the resume. It comments
on one version of a document that changes every keystroke, so restoring yesterday's review beside
today's text would present stale judgement as current. The panel shows when it arrived, and the user
can dismiss it.

Submitting replaces any previous review. Applying a suggestion is a separate step — call the update
tools if the user wants one taken up.

### `update-resume`

Patches everything on the resume that is a single field rather than a list of indexed entries.
Every argument is optional, and only what you pass changes — a call with no arguments is a tool
error rather than a reported no-op.

| Argument      | Type                              | Notes                                               |
| ------------- | --------------------------------- | --------------------------------------------------- |
| `name`        | string                            | Full name                                           |
| `wantedJob`   | string                            | The job title being applied for                     |
| `city`        | string                            |                                                     |
| `phone`       | string                            |                                                     |
| `email`       | string                            |                                                     |
| `profile`     | string                            | **Replaces** the whole summary paragraph            |
| `skills`      | string[]                          | **Replaces** the whole list, in display order       |
| `socialLinks` | `{ name: string, url: string }[]` | **Replaces** the whole list; `url` needs the scheme |

The last two replace rather than append, and the result says what the list now holds, since
`Updated skills.` alone would not tell the agent what survived:

```
Updated profile, socialLinks. social links are now Bluesky.
```

### The entry tools

`employmentHistory`, `educations` and `projects` are lists edited by index, and they share one
add/update/remove trio dispatched on a `section` argument. They used to be nine tools; the three
differed only in which fields an entry carries, while the index handling, the out-of-range error and
the re-read-after-removal rule were copied three times over.

What is genuinely per-section lives in one table in `resume-tools.ts`:

| `section`           | Fields                                         | Required by `add-entry`             |
| ------------------- | ---------------------------------------------- | ----------------------------------- |
| `employmentHistory` | `company`, `jobTitle`, `from`, `to`, `bullets` | `company`, `jobTitle`, `from`       |
| `educations`        | `school`, `degree`, `major`, `from`, `to`      | `school`, `degree`, `major`, `from` |
| `projects`          | `name`, `url`, `bullets`                       | `name`                              |

The input schema is flat — every field above on one object — rather than an `anyOf` over the three
shapes. Models handle a discriminated union poorly, and the price of the flat schema is only that a
wrong field reaches `execute`, where two runtime checks catch what the schema cannot say:

- **A field from the wrong section is an error, not a silent drop.** `school` on a project would
  otherwise vanish, leaving the agent to read its entry back missing a field it just passed with no
  hint why. The message names the section the field does belong to.
- **`required` is per-section**, so `add-entry` checks it rather than the schema, which has only one
  `required` list to give.

```
"school" is not a field of projects, which takes name, url, bullets. employmentHistory takes
company, jobTitle, from, to, bullets; educations takes school, degree, major, from, to; projects
takes name, url, bullets.
```

#### `add-entry`

Appends one entry. Takes `section` plus that section's fields, and returns the index it landed at:

```
Added the job "Frontend Engineer at Vercel" (2020-03 — Present) at index 1.
```

#### `update-entry`

Patches one entry. Takes `section` and `index` plus any of that section's fields. Only what you pass
changes — except `bullets`, which replaces all of them.

#### `remove-entry`

Takes `section` and `index`. Indexes shift after a removal, so re-read before the next indexed call.

### `set-section-layout`

Sets how the sheet is laid out: the order the sections run in and which of them are shown. Pass
either argument or both — neither is a tool error.

| Argument     | Type                                  | Notes                             |
| ------------ | ------------------------------------- | --------------------------------- |
| `order`      | `SectionId[]`                         | In display order. May be partial  |
| `visibility` | `Partial<Record<SectionId, boolean>>` | Only the sections you name change |

Both take the same six ids: `profile`, `employmentHistory`, `projects`, `educations`, `skills`,
`socialLinks`. An unknown id in either one is rejected before anything is written.

One tool rather than two because reshaping the sheet is usually one decision. "Lead with education
and drop the links" was two calls that both rewrote the layout, and an agent that made only the
first left the resume in a state nobody asked for.

Partial lists are the useful way to call `order`: anything left out keeps its relative position
behind what was named, so promoting one section only needs that one section. The argument is
normalised before it is stored, so a duplicate or a missing id cannot leave the resume with a section
that no template will draw.

Hiding keeps the section's content — it is a toggle, not a delete.

Two-column templates (Classic, Modern, Timeline) lay skills and links out in a sidebar and ignore
their position in `order`. The order is still recorded, and takes effect on a single-column template.

## Languages

A resume is one document with a `Resume` per language ([`ResumeDoc`](../src/types/resume-doc.ts)).
One language is the **primary** — the source of truth — and the other is a translation of it that the
user may hand-correct; corrections never travel back. The form holds whichever locale the editor is
showing, so every tool reads and writes that one locale, and `get-resume`'s `language` block is the
only thing that says which:

| Field           | Meaning                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `active`        | The locale the tools are pointed at, `"zh-Hant"` or `"en"`                   |
| `primary`       | The source of truth                                                          |
| `isTranslation` | `active !== primary` — edits here stay in the translation                    |
| `exists`        | Whether the active locale has been created yet. **`false` means read-only.** |

Two rules follow, and both are enforced rather than documented-and-hoped-for:

**A missing locale refuses writes.** A locale is an empty slot until the user runs the translation,
and a save aimed at an empty slot is dropped. Rather than report a success that storage ignored,
every write tool fails:

```
There is no English version of this resume yet, so nothing can be written to it. Ask the user to
create it from the translation panel, or to switch the editor back to Chinese.
```

**A write into a translation says so.** It is allowed — hand-correcting a translation is what that
locale is for — but the result carries a second text block noting that the edit stayed in the
translation, and that the fields it touched are now marked hand-corrected, so the editor will no
longer overwrite them with a fresh translation.

There is no tool for switching language or for running a translation. Both stay user actions.

## Conventions an agent has to follow

**Months, not dates.** Pass `"YYYY-MM"`. Anything else is normalised by taking the leading
`YYYY-MM` and storing the 1st of that month, because the editor's picker only ever renders month +
year. Unparseable input becomes `""`.

**Empty string means Present.** `to: ""` renders as `— Present` in the resume. Omitting `to` on an
update leaves the existing value alone; passing `""` explicitly clears it.

The editor's "Present" switch stores `null` rather than `""`, so both shapes exist in `localStorage`.
The agent never sees the difference — `get-resume` reports either as `""`, and an update that omits
`to` preserves whichever was stored.

**Bullets are an array to the agent, one string in storage.** Job descriptions are stored as a single
string joined by `|` (see `SPLIT_TEXT`). The tools convert in both directions, so an agent only ever
deals with `string[]`.

**Indexes come from `get-resume` and shift after a removal.** Removing index 0 renumbers everything
after it, so re-read before the next indexed call. An out-of-range index returns a tool error rather
than throwing:

```
No job at index 9. There are 2 entries, so valid indexes are 0–1.
```

**Replace vs. patch.** `update-resume` and `update-entry` patch only the fields passed — except the
three that own a whole list and so replace it: `profile`, `skills`, `socialLinks`, and `bullets` on
an entry.

## Not exposed to agents

Deliberately left out, so an agent cannot change the document's look or push anything outward:

- **Downloading the PDF** — export stays a user action
- **Template styling** — the background-colour picker and the light/dark theme toggle are UI state,
  not resume data
- **Reordering entries** — an agent can remove and re-add, but there is no move/reorder tool
- **Anything outside the resume** — there is no storage, network, or navigation tool; every tool
  writes to the form and nothing else

Data never leaves the browser. The resume lives in `localStorage`, exactly as it does when a user
types it in, and the tools only mutate in-page form state.

## Testing

[`e2e/webmcp.spec.ts`](../e2e/webmcp.spec.ts) installs a stand-in `document.modelContext` via
Playwright's `addInitScript` — following the draft's shape, including AbortSignal unregistration and
MCP content-block results — so the tools can be driven in plain Chromium, which has no WebMCP.

```bash
pnpm test:e2e webmcp
```

It covers registering the full set, the flattened `get-resume` view, each write path reaching the
form and the preview, out-of-range and unknown-section errors, both language rules above, and
teardown on unmount. Since the entry tools share one flat schema it also covers what only a runtime
check can catch — a field passed to the wrong `section`, and a missing per-section `required` — plus
the two refusals that replaced a reported no-op: `update-resume` with no fields and
`set-section-layout` with neither argument.

The stub is not the browser. It follows the draft's shape, so it proves the tools do what they say
when called; it cannot prove a real `registerTool` accepts these schemas.

### Driving the real implementation

Verified against **Chrome 151**, which exposes the surface behind a feature flag — no origin-trial
token needed for a local run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --enable-features=WebMCP
```

Two things about Chrome's current shape that the draft does not spell out, and that cost an
afternoon to find:

- **`executeTool` takes the `RegisteredTool` object, not the name.** Pass a string and it throws
  `TypeError: The provided value is not of type 'RegisteredTool'`. Get the object from `getTools()`.
- **Arguments go in as a JSON string, and the result comes back as a JSON string** — not as the
  objects `registerTool` was given. An object argument throws `UnknownError: Failed to parse input
arguments`, and a result read as `result.content` is `undefined` until it is parsed.

```js
const mc = document.modelContext ?? navigator.modelContext;
const tool = (await mc.getTools()).find((t) => t.name === "add-entry");
const result = JSON.parse(
  await mc.executeTool(tool, JSON.stringify({ section: "projects", name: "Tideline" })),
);
result.content[0].text; // 'Added the project "Tideline" at index 1.'
```

`getTools()` also hands back each tool's `inputSchema` as a string, which is the quickest way to see
what the browser actually accepted.

## When the spec moves

Things to re-check on the next draft:

- Whether `getTools()` / `executeTool()` are specified — the explainer still lists them as TODO
- Whether a tool-update mechanism lands, which would remove the abort-and-re-register dance
- The declarative `<form>` API. Evaluated and **not adopted**: it maps one `<form>` to one tool and
  derives the schema from the form's controls, which suits a page whose agent-facing action is a
  submit. The editor has no submit — it persists on a debounce — its list sections are `useFieldArray`
  with no way to express "the entry at index 2", its bullet fields are `contentEditable` and so
  invisible to schema derivation, and the missing-locale write guard has no declarative form. Worth
  re-reading if any of those three gain a mapping
- Whether `structuredContent` joins `content` in tool results
