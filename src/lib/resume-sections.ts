import { Resume, SECTION_IDS, SectionId } from "@/types/resume";

/**
 * The one place that knows what order the sections go in.
 *
 * Every template used to hardcode its own sequence — six visibility-guarded lines
 * in the @react-pdf document and the same six in the HTML builder beside it. That
 * was ten copies of one decision, and none of them was the user's. They now all ask
 * `sectionsToRender` instead, which is also what makes the order a single stored
 * value rather than something a template could disagree with.
 */

/** What a resume starts with: the shape of a conventional CV, top to bottom. */
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "profile",
  "employmentHistory",
  "projects",
  "educations",
  "skills",
  "socialLinks",
];

/**
 * Which sections a template lays out in the flow this order governs.
 *
 * A single-column template puts all six on one run. A two-column one draws skills
 * and links in its sidebar instead, where the arrangement belongs to the design
 * rather than to the user — Modern puts links above skills and Timeline the other
 * way round, and neither is a choice anyone made in the form.
 *
 * Those two are still arrangeable in the form and their position is still stored;
 * the heading just says the current template does not use it. Hiding them would
 * make the list disagree with the form it is part of, and quietly dropping their
 * position would lose it the moment someone tried a single-column template.
 */
export const ALL_SECTIONS = SECTION_IDS;

export const MAIN_COLUMN_SECTIONS = [
  "profile",
  "employmentHistory",
  "projects",
  "educations",
] as const;

/** Narrower than `SectionId`, so a two-column template's map of renderers has to
 *  hold exactly the four it is responsible for — no stale key for a section that
 *  moved to the sidebar, and no missing one. */
export type MainColumnSection = (typeof MAIN_COLUMN_SECTIONS)[number];

/**
 * What each section is called *in the form*, which is where the drag handles live.
 *
 * Deliberately the form's wording and not the sheet's. The templates title the same
 * sections "Summary" and "Links", but the handle sits inside a heading that reads
 * "Profile" and "Website & Social links" — and an accessible name that disagrees
 * with the visible label beside it is the one thing a label must not do.
 */
export const SECTION_LABELS: Record<SectionId, string> = {
  profile: "Profile",
  employmentHistory: "Employment History",
  projects: "Projects",
  educations: "Educations",
  skills: "Skills",
  socialLinks: "Website & Social links",
};

const isSectionId = (value: unknown): value is SectionId =>
  SECTION_IDS.includes(value as SectionId);

/**
 * Turns whatever was stored into an order that names every section exactly once.
 *
 * Not a migration — this runs on every read, because none of the three sources is
 * trustworthy. Local storage was written by an older release or hand-edited in
 * devtools; a share link is a URL a stranger sent you; and a resume the agent wrote
 * went through a tool whose argument is a plain array of strings.
 *
 * Unknown ids are dropped, duplicates keep their first position, and anything the
 * caller left out is appended in the default order — so a section added to the
 * product after an order was saved appears at the bottom rather than vanishing from
 * the sheet, which is the failure that actually matters here.
 */
export const normaliseSectionOrder = (value: unknown): SectionId[] => {
  const listed = Array.isArray(value) ? value.filter(isSectionId) : [];
  const seen = new Set(listed);

  return [...new Set(listed), ...DEFAULT_SECTION_ORDER.filter((id) => !seen.has(id))];
};

/**
 * The sections a template should render, in the order the user put them.
 *
 * `owned` is the subset that template lays out in its main flow — all six for a
 * single-column template, the four main-column ones for a two-column template,
 * which draws its own sidebar. Visibility is applied here too, so a caller maps
 * over the result without a guard of its own.
 */
export const sectionsToRender = <T extends SectionId>(resume: Resume, owned: readonly T[]): T[] =>
  normaliseSectionOrder(resume.sectionOrder).filter(
    (id): id is T => (owned as readonly SectionId[]).includes(id) && resume.visibility[id],
  );

/**
 * The same thing for the HTML exports, which build strings rather than elements.
 *
 * The set a template owns is taken from the keys of the record it passes, so the
 * builder states it once — as the sections it can actually produce — instead of
 * keeping a list beside a switch that has to agree with it.
 */
export const sectionsHtml = <T extends SectionId>(
  resume: Resume,
  builders: Record<T, () => string>,
): string =>
  sectionsToRender(resume, Object.keys(builders) as T[])
    .map((id) => builders[id]())
    .join("\n");

/**
 * Writes a rearranged subset back into the full order.
 *
 * The stored order always names all six sections, but on a two-column template only
 * four of them are on offer — the reorder popover leaves out the ones that template
 * draws in its sidebar, where the order has nothing to say. Rather than rebuild the
 * array from the subset, which would have to invent somewhere to put the two it
 * never saw, the sections that were on screen are written back into the slots they
 * already occupied.
 *
 * So the sidebar's two keep their positions, and switching to a single-column
 * template afterwards finds them where they were left rather than pushed to the end.
 */
export const applySubsetOrder = (full: SectionId[], subset: SectionId[]): SectionId[] => {
  const next = [...full];
  const slots = full.flatMap((id, index) => (subset.includes(id) ? [index] : []));

  slots.forEach((slot, index) => {
    next[slot] = subset[index];
  });

  return next;
};

/** Moves one section to a new index, for both the drag and the keyboard shortcut. */
export const moveSection = (order: SectionId[], from: number, to: number): SectionId[] => {
  if (to < 0 || to >= order.length || from === to) return order;

  const next = [...order];
  next.splice(to, 0, ...next.splice(from, 1));

  return next;
};
