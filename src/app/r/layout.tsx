import type { Metadata } from "next";

/**
 * The share viewer is kept out of the index.
 *
 * There is nothing at this URL for a crawler: the resume is in the fragment, which is
 * never sent to the server and which crawlers strip before fetching, so what gets
 * indexed is a loading state under a URL that looks like thousands of distinct pages.
 *
 * A layout rather than an export on the page, because the page is a client component
 * and `metadata` may only be exported from a server one. It renders nothing of its own.
 */
export const metadata: Metadata = {
  robots: { index: false },
};

const ShareLayout = ({ children }: { children: React.ReactNode }) => children;

export default ShareLayout;
