import type { Metadata } from "next";

import { SITE_URL } from "@/constants/site";

const PAGE_URL = `${SITE_URL}/resume-editor`;

const TITLE = "Resume editor — write, preview and export in your browser";

const DESCRIPTION =
  "The editor itself: fill in the form, watch an A4 sheet redraw beside it, switch template and tint, and export a PDF or one self-contained HTML file. Everything is saved to this browser's local storage.";

/**
 * The editor's own title, rather than the root's.
 *
 * Without this the page inherited the landing page's title and description word for
 * word — two URLs in the sitemap describing themselves identically, which is what a
 * duplicate-title report is. A layout, because the page is a client component.
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
  },
  /* Restated whole — the root's block is replaced, not merged, and `card` falls back
     to `summary` if it is left out. */
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const EditorLayout = ({ children }: { children: React.ReactNode }) => children;

export default EditorLayout;
