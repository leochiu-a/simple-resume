/** Helpers shared by the standalone HTML builders. */

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Only http(s) and mailto links survive; anything else (javascript:, data:, …)
 * is dropped so a pasted social link cannot turn into script in the exported
 * file.
 */
export const safeHref = (url: string) => {
  try {
    const parsed = new URL(url, "https://example.com");
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
};

export const GOOGLE_FONTS_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />`;
