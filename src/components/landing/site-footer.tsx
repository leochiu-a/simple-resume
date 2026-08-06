import Link from "next/link";

const SiteFooter = () => (
  <footer>
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
      <div className="grid grid-cols-1 items-end gap-x-14 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="font-display text-[clamp(2.1rem,4.2vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.025em]">
            Start with a blank page<span className="text-[var(--accent)]">.</span>
          </p>
          <Link
            href="/resume-editor"
            className="group mt-9 inline-flex items-center gap-3 bg-[var(--accent)] px-7 py-3.5 text-[0.95rem] font-medium text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Create resume
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>

        <div className="lg:col-span-5">
          <p className="text-[0.95rem] leading-[1.72] text-[var(--graphite-soft)]">
            The source is public and short enough to read in an evening.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--rule)] pt-6 font-mono text-[11px] uppercase tracking-[0.18em]">
            <li>
              <Link
                href="https://github.com/leochiu-a/simple-resume"
                target="_blank"
                className="transition-colors duration-200 hover:text-[var(--accent)]"
              >
                GitHub
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/leochiu-a/simple-resume/blob/main/docs/webmcp.md"
                target="_blank"
                className="transition-colors duration-200 hover:text-[var(--accent)]"
              >
                WebMCP tools
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
