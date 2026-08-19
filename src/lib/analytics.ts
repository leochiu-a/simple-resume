/**
 * Every analytics event this app can send, and the only way to send one.
 *
 * The product's promise is that the resume never leaves the browser, so the
 * hazard here is not "too many events" — it is one careless `track("saved", {
 * title })` putting somebody's job title on a third party's server. Guarding
 * that by review would mean catching it every time, forever.
 *
 * So the shape below is the guard: `EventMap` names every event and fixes its
 * properties, and each property is a literal union, a boolean, or a bucketed
 * number. There is nowhere to put a free string, which means there is nowhere
 * to put resume content. A new event is a line in this file — a deliberate act,
 * reviewed as a change to what this app discloses, rather than a call site
 * added somewhere in a component.
 *
 * `track` is a no-op off Vercel and outside production, so a dev run sends
 * nothing and a self-hosted deployment sends nothing.
 */

import { track } from "@vercel/analytics";

import type { Resume } from "@/types/resume";
import type { RewriteSection } from "./rewrite";

/** How much of a resume there is, without saying what any of it says. */
export type Fill = "empty" | "started" | "full";

/** Where an on-device feature stands for this visitor. */
export type Capability = "ready" | "downloadable" | "downloading" | "unsupported" | "error";

interface EventMap {
  /** Once per editor mount. The single denominator every other rate is over. */
  editor_opened: { template: string; fill: Fill };
  template_selected: { template: string };
  color_changed: { template: string; source: "swatch" | "custom" };
  /** The point of the whole app: a resume actually leaving in some form. */
  resume_exported: {
    format: "pdf" | "html" | "markdown" | "share_link";
    template: string;
  };
  resume_imported: { outcome: "ok" | "invalid" };
  /** A shared link being *read*, which happens in a different tab to any editing. */
  shared_resume_viewed: { template: string };

  rewrite_run: { section: RewriteSection; action: string };
  /** Split from the run, because the gap between them is the feature's quality. */
  rewrite_applied: { section: RewriteSection; action: string };
  translate_run: { mode: "translate" | "update" | "retranslate"; outcome: "ok" | "error" };
  /**
   * How many visitors can use the on-device features at all — the number that
   * decides whether they are the product or a bonus. Sent once per feature per
   * mount, on the settled state rather than the initial "checking".
   */
  ai_capability: { feature: "language_model" | "translator" | "webmcp"; state: Capability };
  webmcp_tool_called: { tool: string };
  score_opened: { band: "weak" | "fair" | "strong"; score: number };
}

export const trackEvent = <Name extends keyof EventMap>(name: Name, properties: EventMap[Name]) =>
  track(name, properties);

/**
 * The first settled answer for one on-device feature, once per page load.
 *
 * The capability hooks are backed by module stores that every consumer
 * subscribes to — one per rewrite wand, one per translation panel — so tracking
 * from the hook itself would send an event per component instead of per visitor.
 * The set lives at module scope for the same reason the stores do.
 *
 * "checking" is skipped rather than reported: it is the state every visit starts
 * in and says nothing about the device.
 */
const reportedCapabilities = new Set<string>();

export const trackCapability = (
  feature: EventMap["ai_capability"]["feature"],
  state: Capability | "checking",
) => {
  if (state === "checking" || reportedCapabilities.has(feature)) return;

  reportedCapabilities.add(feature);
  trackEvent("ai_capability", { feature, state });
};

/*
   Read defensively, because the argument is typed `Resume` and is not one.

   It comes from the `resume-doc` key, which `useResumeDoc` pulls out of local
   storage with no validation at all, and a pre-v2 document reaches it having
   passed only `"name" in value && "employmentHistory" in value` — so `profile`,
   `educations` and `skills` may simply not be there. A bare `.trim()` on that
   throws inside the editor's effect, React unmounts the tree, and the editor
   goes blank because of a number nobody asked for.

   That is the general rule for this file: nothing here may throw into a render
   or an effect. Whatever is being measured matters more than the measurement. */
const text = (value: string | undefined) => !!value?.trim();
const count = (list: readonly unknown[] | undefined) => list?.length ?? 0;

/**
 * How far along a resume is, in three buckets.
 *
 * The bucketing is the disclosure: "started" is one bit about a stranger,
 * whereas a section count paired with a template and a repeat visit starts to
 * describe a particular document. What the number is for is the drop-off — how
 * many people open the editor, and how many of them get as far as a resume
 * worth exporting.
 */
export const resumeFill = (resume: Resume): Fill => {
  const written =
    text(resume.name) ||
    text(resume.profile) ||
    count(resume.employmentHistory) > 0 ||
    count(resume.educations) > 0 ||
    count(resume.skills) > 0;

  if (!written) return "empty";

  const complete =
    text(resume.name) &&
    text(resume.profile) &&
    (count(resume.employmentHistory) > 0 || count(resume.educations) > 0);

  return complete ? "full" : "started";
};
