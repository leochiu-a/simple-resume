import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

export const alt = "AI in Open Resume — the model runs in the browser";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The AI page gets its own card rather than borrowing the root one.
 *
 * A segment's own image file is picked up automatically, which is also what removes
 * the hardcoded `images: ["/opengraph-image.png"]` this page used to need to stop its
 * `openGraph` object from replacing the root's image with nothing.
 */
const Image = () =>
  renderOgCard({
    lead: "The model runs",
    highlight: "in your browser.",
    tail: "",
    eyebrow: "On-device rewriting · 18 WebMCP tools · Nothing uploaded",
  });

export default Image;
