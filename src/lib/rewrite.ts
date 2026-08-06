/**
 * What the rewrite popover offers, and how a rewrite is actually run.
 *
 * The two halves are here together because they answer the same question from
 * different ends: the guidance tells a writer what a good version of this
 * section looks like, and the actions ask the model for one. Splitting them
 * would let the advice and the prompts drift apart.
 */

import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { ensureLanguageModel } from "./language-model";

/** The two places a rewrite can be started from. Each gets its own advice. */
export type RewriteSection = "profile" | "description";

export interface RewriteAction {
  id: string;
  label: string;
  /** Appended to the section's prompt as the instruction for this run. */
  instruction: string;
}

/**
 * The bullet-list fields are stored as one string joined by `SPLIT_TEXT`, a bare
 * `|` that means nothing to a model. Both directions of that swap live here so
 * the separator never reaches the model and never leaks into visible text.
 */
const toModelText = (value: string, section: RewriteSection) =>
  section === "description"
    ? toLines(value)
        .map((line) => `- ${line}`)
        .join("\n")
    : value.trim();

const toLines = (value: string) =>
  value
    .split(SPLIT_TEXT)
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Turns the model's reply back into the field's storage shape.
 *
 * Models are inconsistent about bullet glyphs even when told which to use, so
 * every common marker is stripped rather than only the one that was asked for.
 * A reply that came back as prose despite the instruction still yields one
 * bullet per line, which is the right answer for a field that is a list.
 */
const fromModelText = (value: string, section: RewriteSection) => {
  const text = value.trim();
  if (section !== "description") return text;

  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .join(SPLIT_TEXT);
};

/** Renders a stored value for reading: the separator is never shown as itself. */
export const toPreviewText = (value: string, section: RewriteSection) =>
  section === "description"
    ? toLines(value)
        .map((line) => `• ${line}`)
        .join("\n")
    : value.trim();

interface SectionGuide {
  title: string;
  /** Shown as a list in the popover before anything is sent to the model. */
  tips: string[];
  /** Describes the field so the model knows what it is rewriting. */
  context: string;
  actions: RewriteAction[];
}

export const SECTION_GUIDES: Record<RewriteSection, SectionGuide> = {
  profile: {
    title: "Writing a profile",
    tips: [
      "Three or four sentences — a recruiter reads this in about ten seconds.",
      "Open with your role and years of experience, not with “I am a passionate…”.",
      "Name the two or three things you are actually known for.",
      "Say what you are looking for next, once.",
    ],
    context:
      "The text is the profile summary at the top of a résumé: a short paragraph introducing the candidate.",
    actions: [
      {
        id: "polish",
        label: "Polish the wording",
        instruction:
          "Rewrite it so it reads clearly and professionally. Fix any awkward phrasing and grammar. Keep every fact and keep roughly the same length.",
      },
      {
        id: "shorten",
        label: "Make it shorter",
        instruction:
          "Tighten it to three or four sentences. Cut filler and repetition, and keep the strongest points.",
      },
      {
        id: "impact",
        label: "Lead with strengths",
        instruction:
          "Restructure it to open with the candidate's role and strongest areas of expertise, then what they are looking for next. Use only the facts already present.",
      },
    ],
  },
  description: {
    title: "Writing a role description",
    tips: [
      "One bullet per achievement — three to five is usually enough.",
      "Start each line with a verb: built, led, migrated, reduced.",
      "Say what changed, and by how much, when you have the number.",
      "Describe what you did, not what the team was responsible for.",
    ],
    context:
      "The text is the bullet list under one job in a résumé's employment history, describing what the candidate did in that role.",
    actions: [
      {
        id: "polish",
        label: "Polish the wording",
        instruction:
          "Rewrite each bullet so it reads clearly and professionally. Fix awkward phrasing and grammar. Keep the same number of bullets and every fact.",
      },
      {
        id: "action-verbs",
        label: "Start with strong verbs",
        instruction:
          "Rewrite each bullet to begin with a strong past-tense action verb and to state what the candidate did. Keep the same number of bullets and every fact.",
      },
      {
        id: "concise",
        label: "Make it concise",
        instruction:
          "Tighten each bullet to a single line. Cut filler words while keeping the achievement intact. Keep the same number of bullets.",
      },
    ],
  },
};

/** Long enough to be worth rewriting; below this the model has nothing to work with. */
export const MIN_REWRITE_LENGTH = 12;

/**
 * Streams a rewrite of one field.
 *
 * Reached straight from the click that asked for it, because the first call may
 * have to download the model and that needs the user activation — see
 * `ensureLanguageModel`. `onChunk` receives the text so far, not the delta, so a
 * caller can render it directly.
 */
export const rewriteText = async ({
  section,
  action,
  text,
  signal,
  onChunk,
}: {
  section: RewriteSection;
  action: RewriteAction;
  text: string;
  signal?: AbortSignal;
  onChunk: (soFar: string) => void;
}): Promise<string> => {
  const root = await ensureLanguageModel();
  const guide = SECTION_GUIDES[section];

  /*
    Every rewrite runs on its own clone of the shared session.

    The session carries its conversation forward, so reusing one directly would
    make each rewrite see all the earlier ones: the profile would still be in
    context while a job description is being rewritten, and a retry would be
    answering "rewrite it again" rather than the original request. Cloning
    branches from the system prompt and nothing else, so every run is
    independent — and the clone is discarded below rather than growing a context
    nobody reads again.
  */
  const session = await root.clone({ signal });

  try {
    const prompt = [
      guide.context,
      `Task: ${action.instruction}`,
      section === "description"
        ? 'Return the result as a bullet list, one "- " per line, and nothing else.'
        : "Return the result as a single paragraph and nothing else.",
      "",
      "Text to rewrite:",
      toModelText(text, section),
    ].join("\n");

    /*
      Read through a reader rather than `for await`.

      Chrome's ReadableStream is async-iterable, but TypeScript's DOM lib does
      not declare `[Symbol.asyncIterator]` on it, so the loop does not typecheck
      against the stream this API actually returns. The reader is the same
      protocol spelled out, and `releaseLock` in the `finally` keeps a stream
      abandoned mid-read from holding its lock.
    */
    const reader = session.promptStreaming(prompt, { signal }).getReader();

    let soFar = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        soFar += value;
        // Streamed through in the model's own shape. Normalising each partial
        // would make bullet markers appear and re-flow as they arrive, so the
        // tidy-up waits for the end and the reader watches one steady draft.
        onChunk(soFar);
      }
    } finally {
      reader.releaseLock();
    }

    const result = fromModelText(soFar, section);
    if (!result) throw new Error("The model returned nothing. Try again.");

    return result;
  } finally {
    session.destroy();
  }
};
