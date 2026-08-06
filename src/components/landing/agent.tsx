import SectionHeading from "./section-heading";

/**
 * The WebMCP section. Everything claimed here is checked against the editor: the
 * tool count is the number registered in `webmcp/resume-tools.ts`, and the prompt
 * is the one in the README, which is the one the tools were designed around.
 */
const Agent = () => (
  <section className="border-b border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
      <SectionHeading
        index="03"
        label="Agent · Experimental"
        title={
          <>
            Or don&rsquo;t type it <br />
            at all<span className="text-[var(--accent)]">.</span>
          </>
        }
      />

      <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:col-start-4">
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
            The editor registers itself as a set of{" "}
            <span className="text-[var(--graphite)]">WebMCP tools</span> — twelve of them, covering
            reading the resume and writing every section of it. A browser AI agent can see what is
            there and fill in the rest, while you watch the sheet update.
          </p>

          <dl className="mt-10 border-t border-[var(--rule)] font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
            {[
              ["Tools", "12 · read and write, per section"],
              ["Browsers", "Edge 147+ · Chrome behind a flag"],
              ["Status", "W3C community draft, still moving"],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-col gap-1.5 border-b border-[var(--rule)] py-4">
                <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                <dd className="text-[var(--graphite)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border border-[var(--rule)] bg-[var(--paper-raised)] p-7 lg:p-9">
            <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--graphite-soft)]">
              <span
                aria-hidden
                className="inline-block size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
              />
              Agent ready · 12 tools
            </p>

            <blockquote className="mt-6 font-display text-[1.35rem] italic leading-[1.5] tracking-[-0.01em] lg:text-[1.5rem]">
              &ldquo;Read my resume, then rewrite the profile summary for a staff frontend role and
              add my job at Northsail from March 2021 to now.&rdquo;
            </blockquote>

            <p className="mt-7 border-t border-[var(--rule)] pt-5 text-[0.9rem] leading-[1.65] text-[var(--graphite-soft)]">
              Turn the flag on at{" "}
              <code className="font-mono text-[0.82rem] text-[var(--graphite)]">
                chrome://flags/#enable-webmcp-testing
              </code>{" "}
              and the nav shows an <span className="text-[var(--graphite)]">Agent ready</span>{" "}
              badge. Where WebMCP is missing it says so, and everything else works exactly as
              before.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Agent;
