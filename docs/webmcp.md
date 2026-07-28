# WebMCP support

The resume editor exposes itself to AI agents as a set of
[WebMCP](https://webmachinelearning.github.io/webmcp/) tools, so an agent can fill in a resume by
calling functions instead of guessing where to click. This document lists what an agent can and
cannot do, and the conventions it has to follow.

## Status

WebMCP is a **W3C Web Machine Learning Community Group draft** (latest draft 2026-07-21). It is not a
W3C Standard and is not on the Standards Track, so treat everything here as experimental — the API
can still change under us. Two changes have already landed that older tutorials get wrong:

- The getter moved off `Navigator` to `Document` on **2026-05-27**. This app uses
  `document.modelContext`. `navigator.modelContext` is only a deprecated alias where it still exists
  at all, and Chrome marked it deprecated in 150.
- There is **no `unregisterTool`**, and no way to update a registered tool. Unregistration happens by
  aborting the `AbortSignal` passed to `registerTool`.

## Browser support

| Browser    | Status                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Edge 147+  | Ships natively                                                                     |
| Chrome 149 | Origin trial; locally, enable `chrome://flags/#enable-webmcp-testing` and relaunch |
| Others     | No support — the editor falls back to being a normal form                          |

The nav bar reports which case you are in:

- **Agent ready · 12 tools** — registration succeeded
- **Agent unavailable** — the browser has no `document.modelContext`, or registration failed

To call tools by hand, use the Chrome DevTools WebMCP panel or the Model Context Tool Inspector
extension.

## How it is wired

| File                                                                                                          | Role                                            |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`src/types/webmcp.d.ts`](../src/types/webmcp.d.ts)                                                           | Ambient types for `document.modelContext`       |
| [`src/lib/webmcp.ts`](../src/lib/webmcp.ts)                                                                   | Feature detection, `defineTool`, result helpers |
| [`src/app/resume-editor/webmcp/resume-tools.ts`](../src/app/resume-editor/webmcp/resume-tools.ts)             | The 12 tool definitions                         |
| [`src/app/resume-editor/hooks/useResumeMcp.ts`](../src/app/resume-editor/hooks/useResumeMcp.ts)               | Registers on mount, aborts on unmount           |
| [`src/app/resume-editor/components/webmcp-status.tsx`](../src/app/resume-editor/components/webmcp-status.tsx) | The nav badge                                   |

Lifecycle: tools are registered once when the editor mounts and torn down by aborting the controller
when it unmounts, so navigating away from `/resume-editor` removes all 12 tools and coming back
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
    "socialLinks": false,
    "skills": true,
    "educations": true,
    "employmentHistory": true
  }
}
```

### `update-basic-info`

Patches the resume header. Every field is optional; only what you pass changes.

| Argument    | Type   | Notes                           |
| ----------- | ------ | ------------------------------- |
| `name`      | string | Full name                       |
| `wantedJob` | string | The job title being applied for |
| `city`      | string |                                 |
| `phone`     | string |                                 |
| `email`     | string |                                 |

### `update-profile`

| Argument  | Type   | Required | Notes                                |
| --------- | ------ | -------- | ------------------------------------ |
| `profile` | string | yes      | Replaces the whole summary paragraph |

### `set-skills`

**Replaces** the entire list — pass every skill that should appear, in display order.

| Argument | Type     | Required | Notes                          |
| -------- | -------- | -------- | ------------------------------ |
| `skills` | string[] | yes      | e.g. `["TypeScript", "React"]` |

### `set-social-links`

**Replaces** the entire list.

| Argument      | Type                              | Required | Notes                  |
| ------------- | --------------------------------- | -------- | ---------------------- |
| `socialLinks` | `{ name: string, url: string }[]` | yes      | `url` needs the scheme |

### `add-employment`

Appends one job.

| Argument   | Type     | Required | Notes                                              |
| ---------- | -------- | -------- | -------------------------------------------------- |
| `company`  | string   | yes      |                                                    |
| `jobTitle` | string   | yes      |                                                    |
| `from`     | string   | yes      | `"YYYY-MM"`                                        |
| `to`       | string   | no       | `"YYYY-MM"`, or `""` for a current job             |
| `bullets`  | string[] | no       | One achievement per item; each renders as a bullet |

Returns the index it was added at, e.g. `Added "Senior Frontend Engineer at KKday" (2021-04 — Present) at index 0.`

### `update-employment`

Patches one job. Only what you pass changes — except `bullets`, which replaces all of them.

| Argument                                       | Type   | Required |
| ---------------------------------------------- | ------ | -------- |
| `index`                                        | number | yes      |
| `company`, `jobTitle`, `from`, `to`, `bullets` | —      | no       |

### `remove-employment`

| Argument | Type   | Required |
| -------- | ------ | -------- |
| `index`  | number | yes      |

### `add-education`

| Argument | Type   | Required | Notes                         |
| -------- | ------ | -------- | ----------------------------- |
| `school` | string | yes      |                               |
| `degree` | string | yes      | e.g. `"Bachelor"`, `"Master"` |
| `major`  | string | yes      |                               |
| `from`   | string | yes      | `"YYYY-MM"`                   |
| `to`     | string | no       | `"YYYY-MM"`                   |

### `update-education`

| Argument                                  | Type   | Required |
| ----------------------------------------- | ------ | -------- |
| `index`                                   | number | yes      |
| `school`, `degree`, `major`, `from`, `to` | —      | no       |

### `remove-education`

| Argument | Type   | Required |
| -------- | ------ | -------- |
| `index`  | number | yes      |

### `set-section-visibility`

Shows or hides a whole section in the preview and the exported PDF. The content is kept either way,
so this is a toggle, not a delete.

| Argument  | Type    | Required | Notes                                                                         |
| --------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `section` | string  | yes      | `profile` \| `socialLinks` \| `skills` \| `educations` \| `employmentHistory` |
| `visible` | boolean | yes      |                                                                               |

## Conventions an agent has to follow

**Months, not dates.** Pass `"YYYY-MM"`. Anything else is normalised by taking the leading
`YYYY-MM` and storing the 1st of that month, because the editor's picker only ever renders month +
year. Unparseable input becomes `""`.

**Empty string means Present.** `to: ""` renders as `PRESENT` in the resume. Omitting `to` on an
update leaves the existing value alone; passing `""` explicitly clears it.

**Bullets are an array to the agent, one string in storage.** Job descriptions are stored as a single
string joined by `|` (see `SPLIT_TEXT`). The tools convert in both directions, so an agent only ever
deals with `string[]`.

**Indexes come from `get-resume` and shift after a removal.** Removing index 0 renumbers everything
after it, so re-read before the next indexed call. An out-of-range index returns a tool error rather
than throwing:

```
No job at index 9. There are 2 entries, so valid indexes are 0–1.
```

**Replace vs. patch.** `set-skills` and `set-social-links` replace the whole list. `update-basic-info`,
`update-employment`, and `update-education` patch only the fields passed.

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
form and the preview, out-of-range and unknown-section errors, and teardown on unmount.

## When the spec moves

Things to re-check on the next draft:

- Whether `getTools()` / `executeTool()` are specified — the explainer still lists them as TODO
- Whether a tool-update mechanism lands, which would remove the abort-and-re-register dance
- The declarative `<form>` API, which could replace some of these hand-written tools
- Whether `structuredContent` joins `content` in tool results
