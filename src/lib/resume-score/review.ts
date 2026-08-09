/**
 * A qualitative review submitted by an agent.
 *
 * This is the half of the panel the rules cannot do. `scoreResume` checks shape
 * — is there a number in this bullet, does it open with a listed verb, is it too
 * long — and it is exact about all of it. What it cannot check is meaning:
 * "Increased synergy by 200%" passes every rule and says nothing, and no word
 * list will ever separate 管理團隊 (a verb) from 管理層 (a noun).
 *
 * So an agent reviews the content and reports here. Deliberately carrying **no
 * score**: the header number stays a property of the resume, computed the same
 * way every time from fixed weights, and a second number arriving from a model
 * would put two irreconcilable figures in one panel. Findings compose with the
 * rules; a rival score does not.
 */
export interface ReviewNote {
  /** What is wrong or worth changing, in the reviewer's words. */
  comment: string;
  /**
   * Where it applies, in the indexes `get-resume` reports. Omitted for a note
   * about the document as a whole.
   */
  section?: "employmentHistory" | "projects" | "profile" | "skills";
  entryIndex?: number;
  bulletIndex?: number;
  /** The text being commented on, so the panel can show it without re-deriving. */
  quote?: string;
  /** A concrete replacement, when the reviewer has one. */
  suggestion?: string;
}

export interface AgentReview {
  /**
   * A sentence or two on the resume overall. The one place a reviewer gets to
   * generalise; everything else has to point at something.
   */
  summary: string;
  notes: ReviewNote[];
  /** When it was submitted, for the "reviewed N ago" line. */
  submittedAt: number;
}

/** The cap on a single submission — see `MAX_NOTES` at the tool. */
export const MAX_REVIEW_NOTES = 20;
