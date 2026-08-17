import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "How to write a resume — a good resume is six edits from a bad one";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The guide's own headline, verbatim, on the same card the other two pages use — a
 *  share of this page should promise the six edits rather than the product. */
const Image = () =>
  renderOgCard({
    lead: "A good resume is",
    highlight: "six edits",
    tail: "from a bad one.",
    eyebrow: "Writing guide · Six edits · Each one shown on the page",
  });

export default Image;
