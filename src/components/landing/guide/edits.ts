/**
 * The six edits the writing guide teaches, and the figure that proves each one.
 *
 * The figure is the point. An earlier version of this page argued to a live A4
 * sheet, which was the honest thing to show and unreadable at column width — the
 * body type came out at 7.9px. So the sheet is gone and each edit carries the one
 * shape that makes *it* legible at reading size: a rewritten line, a reordered
 * stack, or a list being cut. Nothing here is a screenshot and nothing here needs
 * zooming.
 *
 * Everything is invented, and the "before" side is deliberately ordinary rather
 * than a strawman: every line is one that turns up in real resumes.
 */

/** A line rewritten. `highlight` is the substring the eye should land on, and it
 *  must appear verbatim in `after` — the figure splits on it. */
interface LineFigure {
  kind: "line";
  before: string;
  after: string;
  highlight?: string;
}

/**
 * A list that moves. Rows are given in their **final** order; `from` says where
 * each one started, so the animation can supply the old position as its keyframe
 * `from` and leave the resting state correct.
 */
interface StackFigure {
  kind: "stack";
  rows: { label: string; meta: string; from: number }[];
  /** Draws the rule under the first two rows, labelled as the part that gets read. */
  topThird?: boolean;
}

/** A list that gets shorter. `dropped` renders struck through, at rest. */
interface ChipsFigure {
  kind: "chips";
  kept: string[];
  dropped: string[];
}

export type Figure = LineFigure | StackFigure | ChipsFigure;

export interface Edit {
  id: string;
  /** The heading, as an instruction rather than a topic. */
  title: string;
  body: string;
  figure: Figure;
}

export const EDITS: Edit[] = [
  {
    id: "name-the-job",
    title: "Say which job this is for.",
    body: "The line under a name is the first thing read and the cheapest to get right. “Seeking new opportunities” tells a reader only that you are available, which they had assumed. Name the role you are applying for — the same words the posting uses — and every line under it is read as evidence for that claim rather than sorted into a category first.",
    figure: {
      kind: "line",
      before: "Seeking new opportunities",
      after: "Senior Data Engineer",
    },
  },
  {
    id: "cut-the-objective",
    title: "Cut the objective. Write a summary.",
    body: "An objective describes what you want; a summary describes what you have done. The first is true of every applicant and so distinguishes none of them — hard-working, detail-oriented and passionate are not claims, they are the absence of one. Three sentences: what you are, what you work on, and the largest thing you have finished.",
    figure: {
      kind: "line",
      before:
        "A hard-working and detail-oriented team player seeking a challenging position at a forward-thinking company where I can grow professionally.",
      after:
        "Data engineer, nine years on pipelines other teams bill from. Rebuilt Halcyon’s ETL onto incremental models and took the nightly window from six hours to forty minutes.",
      highlight: "six hours to forty minutes",
    },
  },
  {
    id: "most-recent-first",
    title: "Put the most recent job first.",
    body: "A resume is read from the top and abandoned from the bottom, so the order is not a filing decision — it decides which job is the one that got read. Reverse chronology everywhere, including projects and education. What you did in 2015 is context; what you did last year is the offer.",
    figure: {
      kind: "stack",
      rows: [
        { label: "Halcyon Freight", meta: "Senior Data Engineer · 2021 — now", from: 2 },
        { label: "Marrow Foods", meta: "Data Engineer · 2018 — 2021", from: 1 },
        { label: "Kestrel Analytics", meta: "Junior Data Analyst · 2015 — 2018", from: 0 },
      ],
    },
  },
  {
    id: "verb-and-number",
    title: "Open with a verb, close with a number.",
    body: "“Responsible for the ETL platform” describes a seat, not a person: it is true of whoever holds the job and stays true if they do nothing. A bullet earns its line when it names the thing you changed and by how much. If you have been taught STAR, this is STAR with the situation and the task deleted — those two are what you say out loud in the interview, where you have a paragraph to spend them in; a bullet has one line, so it keeps the action and the result. And if the number is unflattering, use it anyway: a small measured result reads as true, and “significantly improved” reads as nothing at all.",
    figure: {
      kind: "line",
      before: "Helped to reduce infrastructure costs",
      after: "Cut warehouse spend 38% (£410k/year) by moving cold partitions to object storage",
      highlight: "38% (£410k/year)",
    },
  },
  {
    id: "cut-the-soup",
    title: "Skills are evidence, not a wishlist.",
    body: "Nobody has ever been called about “Attention to detail”, and listing Microsoft Word in 2026 costs you the two things above it that were worth reading. Keep what a job posting would actually screen for and what you would be happy to be interviewed on — then let the bullets above prove each one.",
    figure: {
      kind: "chips",
      kept: ["Python", "SQL", "Airflow", "dbt", "Snowflake", "Terraform"],
      dropped: [
        "Communication",
        "Teamwork",
        "Problem solving",
        "Attention to detail",
        "Time management",
        "Fast learner",
        "Microsoft Word",
        "Microsoft Excel",
        "PowerPoint",
      ],
    },
  },
  {
    id: "top-third",
    title: "Spend the top third on the argument.",
    body: "What survives a first pass is the top third of page one, so it has to carry the summary and the current job — not a degree from 2014 and a personal site made with HTML and CSS. Move the sections into the order the claim is made in, and delete anything that is only there because the section existed.",
    figure: {
      kind: "stack",
      topThird: true,
      rows: [
        { label: "Summary", meta: "three sentences", from: 1 },
        { label: "Experience", meta: "three roles, newest first", from: 3 },
        { label: "Projects", meta: "one, with users", from: 2 },
        { label: "Education", meta: "one line", from: 0 },
      ],
    },
  },
];
