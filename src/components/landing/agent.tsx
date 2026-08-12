import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

/**
 * The WebMCP section, as a terminal-ish transcript.
 *
 * Everything claimed here is checked against the editor: the tool count is the number
 * registered in `webmcp/resume-tools.ts`, and the calls listed are real tool names.
 * This is the summary; `/how-ai-works` is the same argument at length, with the score panel
 * before and after a real run and the tools named one by one.
 *
 * The transcript is the third distinct section shape on this page — bento, then a
 * result pair, now a log — which is what keeps the scroll from feeling like one
 * template repeated.
 */
const CALLS = [
  ["get-resume", "read the whole sheet"],
  ["score-resume", "59 · four rules failing"],
  ["update-employment", "rewrote two weak bullets"],
  ["score-resume", "91 · interview ready"],
];

const Agent = () => (
  <section className="border-t border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
        {/* Transcript first on desktop — the evidence leads, the explanation follows. */}
        <div className="lg:col-span-6 lg:order-2">
          <p className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
            <Terminal aria-hidden className="size-3.5 text-[var(--accent)]" />
            Claude Code · WebMCP
          </p>
          <h2 className="mt-3 max-w-[22ch] font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
            Or hand the whole editor to an agent.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
            The editor registers itself as{" "}
            <span className="font-medium text-[var(--graphite)]">seventeen WebMCP tools</span> — two
            that read the resume, fourteen that write to it, one that publishes a review. An agent
            calls functions instead of guessing where to click, and never touches the DOM.
          </p>

          <Link
            href="/how-ai-works"
            className="group mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            The 17 tools
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </div>

        <div className="lg:col-span-6 lg:order-1">
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--graphite-fixed)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <span aria-hidden className="size-2 rounded-full bg-[var(--g1)]" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-white/55">
                Agent ready · 17 tools
              </span>
            </div>

            <ol className="divide-y divide-white/[0.07]">
              {CALLS.map(([tool, result], index) => (
                <li key={`${tool}-${index}`} className="flex items-baseline gap-3 px-5 py-3.5">
                  <span className="font-mono text-[0.6875rem] text-white/35 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <code className="font-mono text-[0.8125rem] text-white/95">{tool}</code>
                  <span className="ml-auto text-right font-mono text-[0.6875rem] text-white/50">
                    {result}
                  </span>
                </li>
              ))}
            </ol>

            <p className="border-t border-white/10 px-5 py-4 text-[0.8125rem] leading-[1.55] text-white/55">
              A real run. The score moved because the agent re-scored its own work, not because
              anything here is staged.
            </p>
          </div>

          <p className="mt-4 text-[0.8125rem] leading-[1.55] text-[var(--graphite-soft)]">
            Edge 147+ today, Chrome behind{" "}
            <code className="font-mono text-[0.75rem]">#enable-webmcp-testing</code>. Where WebMCP
            is missing the editor says so and works exactly as before.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Agent;
