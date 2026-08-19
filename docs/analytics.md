# Analytics

What this app measures about its own use, and the rule that decides what it is allowed to measure.

The product's promise is that the resume never leaves the browser. Analytics is the one part of the
codebase whose whole job is to send something to a server, so it is also the only part that can break
that promise by accident — not through a bad decision, but through an ordinary-looking
`track("saved", { jobTitle })` in a component nobody re-read.

## The rule

**An event may carry the shape of a resume. It may never carry its content.**

Content is anything the user typed: names, job titles, descriptions, the profile, company names,
emails, URLs, skills, the custom tint. Shape is everything the app itself decides or derives — which
template is selected, which of the four export formats was used, whether the device has a model,
which of a fixed list of rewrite actions was pressed, a count reduced to a bucket.

Applied, that means a resume 70% full sends `fill: "started"`, not a section count; a custom colour
sends `source: "custom"`, not the hex; and a rewrite sends `action: "shorten"`, not the paragraph
being shortened.

## How the rule is enforced

Not by review. [`src/lib/analytics.ts`](../src/lib/analytics.ts) declares an `EventMap` naming every
event and fixing its properties, and `trackEvent` is generic over it. Every property is a literal
union, a boolean, or a derived number — there is no property anywhere in the map that accepts a free
string, so there is nowhere for typed text to go. `track` from `@vercel/analytics` is not imported
anywhere else.

Adding an event is therefore a change to this file, reviewed as a change to what the app discloses,
rather than a call site added in a component.

## The URL is the other half

[`src/lib/share-link.ts`](../src/lib/share-link.ts) puts an entire resume in a URL fragment, which is
private because browsers never send a fragment. An analytics script is not the browser — it is
JavaScript in the page, where `location.href` includes the fragment, and it reports the URL it finds.

So [`src/components/analytics.tsx`](../src/components/analytics.tsx) passes `beforeSend` and cuts
every reported URL back to origin plus pathname. The query goes with it. **Nothing may be added that
sends a URL without going through that function.**

## The events

| Event                  | Sent when                                    | Carries                                     |
| ---------------------- | -------------------------------------------- | ------------------------------------------- |
| `editor_opened`        | The editor mounts, once per visit            | template, `fill` (empty/started/full)       |
| `template_selected`    | A template is chosen in the appearance panel | template                                    |
| `color_changed`        | A swatch or the picker sets a tint           | template, swatch vs custom                  |
| `resume_exported`      | PDF, HTML, Markdown copy, or share link      | format, template                            |
| `resume_imported`      | A share link is pasted into the import box   | ok / invalid                                |
| `shared_resume_viewed` | A share link is opened on `/r`               | template                                    |
| `rewrite_run`          | A rewrite action is pressed                  | section, action id                          |
| `rewrite_applied`      | "Use this" replaces the field                | section, action id                          |
| `translate_run`        | A translation finishes or fails              | translate/update/retranslate, ok / error    |
| `ai_capability`        | A capability settles, once per feature       | language model / translator / webmcp, state |
| `webmcp_tool_called`   | An agent invokes a tool                      | tool name                                   |
| `score_opened`         | The score drawer opens                       | band, score                                 |

Two of these are pairs on purpose. `rewrite_run` against `rewrite_applied` is the only honest read on
whether the rewrites are good — a run that is never applied is a draft somebody looked at and
rejected. And `ai_capability` against everything else answers the question the on-device features
stand or fall on: how many visitors can run them at all.

## Where events are not sent from

Two shapes were rejected rather than debounced into place:

- **Per keystroke, or per frame.** The colour picker fires on every frame of a drag, so
  `color_changed` is capped at one per visit to the picker. Nothing is tracked from the form itself.
- **Per component.** The capability hooks are backed by module stores that every rewrite wand
  subscribes to. `trackCapability` dedupes at module scope so the event counts visitors, not mounts.

## Off Vercel, and in development

`track` is a no-op outside production and off Vercel, so a local run and a self-hosted deployment
send nothing at all.
