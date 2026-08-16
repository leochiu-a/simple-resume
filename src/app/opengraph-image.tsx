import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "Open Resume — a resume builder that never uploads your resume";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The hero's headline, verbatim, so the card and the page a click lands on say the
 *  same sentence. */
const Image = () =>
  renderOgCard({
    lead: "A resume builder that",
    highlight: "never uploads",
    tail: "your resume.",
    eyebrow: "Local-first · Free · No account",
  });

export default Image;
