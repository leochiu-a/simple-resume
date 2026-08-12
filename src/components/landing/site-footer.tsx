import Link from "next/link";

/**
 * Quiet on purpose.
 *
 * The closing band above it already makes the ask, so the footer's only job is to be
 * a sitemap and get out of the way — the old one carried a second oversized headline
 * and a second primary button, which meant the page ended by asking twice.
 */
const LINKS = [
  { label: "Editor", href: "/resume-editor" },
  { label: "Templates", href: "/#templates" },
  { label: "How AI works", href: "/ai" },
  { label: "Privacy", href: "/#privacy" },
];

const EXTERNAL = [
  { label: "GitHub", href: "https://github.com/leochiu-a/simple-resume" },
  {
    label: "WebMCP tools",
    href: "https://github.com/leochiu-a/simple-resume/blob/main/docs/webmcp.md",
  },
];

/** `block` with vertical padding rather than a bare inline link: at 14px the text box
 *  is only 17px tall, which is not a tap target. The padding carries the list's rhythm
 *  too, so there is no `space-y` on the lists themselves. */
const LINK_CLASS =
  "block rounded py-3 text-[0.875rem] text-[var(--graphite-soft)] transition-colors duration-200 hover:text-[var(--graphite)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

const SiteFooter = () => (
  <footer className="mt-4 border-t border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 py-14">
      <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded-[8px] bg-[image:var(--gradient)]"
            >
              <span className="block size-2 rounded-[2px] bg-white/95" />
            </span>
            <span className="font-display text-[0.9375rem] font-semibold tracking-[-0.015em]">
              Simple Resume
            </span>
          </Link>
          <p className="mt-4 max-w-[36ch] text-[0.875rem] leading-[1.6] text-[var(--graphite-soft)]">
            A local-first resume builder. The source is public and short enough to read in an
            evening.
          </p>
        </div>

        <div className="flex gap-14">
          <nav>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--graphite-soft)]">
              Product
            </p>
            <ul className="mt-2">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--graphite-soft)]">
              Source
            </p>
            <ul className="mt-2">
              {EXTERNAL.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} target="_blank" className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
