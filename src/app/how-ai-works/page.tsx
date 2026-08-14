import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { BanIcon } from "@/components/icons/ban";
import { SparklesIcon } from "@/components/icons/sparkles";
import { TerminalIcon } from "@/components/icons/terminal";

import AccentProvider from "@/components/landing/accent";
import SiteFooter from "@/components/landing/site-footer";
import SiteNav from "@/components/landing/site-nav";
import CopyablePrompt from "@/components/landing/ai/copyable-prompt";
import { AFTER_REPORT, BEFORE_REPORT } from "@/components/landing/ai/score-fixtures";
import ScoreStoryboard from "@/components/landing/ai/score-storyboard";
import ToolTable from "@/components/landing/ai/tool-table";
import { SITE_URL } from "@/constants/site";

const DESCRIPTION =
  "Open Resume runs the browser's own AI model to rewrite and translate a resume, and registers itself as 17 WebMCP tools so an agent like Claude Code can read, score, and edit it. Nothing is uploaded either way.";

const TITLE = "AI in Open Resume — on-device rewriting and a WebMCP agent";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/how-ai-works`,
    /* Stated even though the root layout has it. A child's `openGraph` replaces the
       parent's object rather than merging into it, so declaring one here without
       `images` dropped the root `opengraph-image.png` and this page shared with no
       image at all. */
    images: ["/opengraph-image.png"],
  },
};

/**
 * The AI page.
 *
 * The landing page states both AI features in a paragraph each; this page is for the
 * reader who wants to know how they work before pointing either at their own resume.
 * It is ordered the same way as the landing page and for the same reason — the
 * built-in model ships and works today, the agent needs a flag.
 *
 * Every number here is checkable against the source: the tool count is what
 * `webmcp/resume-tools.ts` registers, the three rewrite actions are `SECTION_GUIDES`
 * (lib/rewrite.ts), the language pair is `RESUME_LANGS` (lib/resume-doc.ts), and the
 * two scores in the storyboard are what `score-resume` actually returned.
 */

/** The prompt from the run in the storyboard, as a visitor would paste it.
 *  `{{origin}}` is resolved against the live page by `CopyablePrompt` — the URL a
 *  reader needs is the site they are on, not the one this was written on. */
const AGENT_PROMPT = `Open {{origin}}/resume-editor and use the page's
WebMCP tools to improve my resume.

1. Call get-resume to see what is there, then score-resume
   for the current grade.
2. Fix the findings it reports — rewrite weak bullets so each
   one names what changed and by how much, and keep every
   fact that is already there.
3. Call score-resume again to check the score actually moved.
   Stop when it stops improving.
4. Finish with submit-review: a short summary plus notes on
   the bullets worth another pass.

Do not invent employers, dates, or numbers. If something is
missing, leave it and say so in the review.`;

const REWRITE_ACTIONS = [
  ["Polish the wording", "Fixes phrasing and grammar, keeps every fact and the length"],
  ["Make it shorter", "Tightens to three or four sentences, keeps the strongest points"],
  ["Lead with strengths", "Reopens on your role and expertise, using only facts already there"],
];

const LIMITS = [
  ["Download the PDF", "Export stays a user action"],
  ["Change the template or tint", "That is how it looks, not what it says"],
  ["Reorder entries", "It can remove and re-add; there is no move tool"],
  ["Reach anything outside the page", "No storage, network, or navigation tool"],
  ["Set its own score", "A review carries notes, never a number"],
];

const FACTS = [
  ["Model runs", "In your browser"],
  ["Agent tools", "17 · read and write"],
  ["Uploads", "None, either way"],
  ["Account", "Not required"],
];

const SECTION_LABEL =
  "inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]";
const SECTION_TITLE =
  "mt-3 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]";

const Ai = () => (
  <AccentProvider>
    <SiteNav />

    <main>
      {/* The masthead states the one thing both features have in common, since that is
          the claim the rest of the page has to keep. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="landing-ambient" />

        <div className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-16 lg:pb-24 lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-raised)] py-1.5 pl-2 pr-3.5 text-[0.8125rem] text-[var(--graphite-soft)] shadow-[var(--shadow-sm),var(--highlight)]">
            <span
              aria-hidden
              className="size-2 rounded-full bg-[image:var(--gradient)] shadow-[0_0_0_3px_hsl(160_84%_39%/0.15)]"
            />
            On-device model · WebMCP agent
          </p>

          <h1 className="mt-6 max-w-[26ch] font-display text-[clamp(2.5rem,5.2vw,4rem)] font-semibold leading-[1.02] tracking-[-0.032em]">
            AI that writes your resume{" "}
            <span className="bg-[image:var(--gradient)] bg-clip-text text-transparent">
              where it lives
            </span>
            .
          </h1>

          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.65] text-[var(--graphite-soft)]">
            Two different things get called AI here, and they are worth separating. The browser now
            ships a <span className="font-medium text-[var(--graphite)]">model of its own</span>,
            which Open Resume uses to rewrite and translate. Separately, the editor registers itself
            as <span className="font-medium text-[var(--graphite)]">WebMCP tools</span>, so an agent
            such as Claude Code can read and edit the resume by calling functions instead of
            guessing where to click. Neither one uploads the resume.
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {FACTS.map(([term, value]) => (
              <div
                key={term}
                className="rounded-[var(--r-md)] border border-[var(--rule)] bg-[var(--paper-raised)] p-4 shadow-[var(--shadow-sm),var(--highlight)]"
              >
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                  {term}
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 01 — the built-in model. First because it works today with no flag. */}
      <section className="border-t border-[var(--rule)] bg-[var(--wash)]">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className={SECTION_LABEL}>
                <SparklesIcon aria-hidden className="size-3.5 text-[var(--accent)]" />
                Built-in AI
              </p>
              <h2 className={SECTION_TITLE}>The browser brought its own model.</h2>
              <p className="mt-5 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
                Chrome and Edge expose a language model and a translator to the page itself. The
                model is downloaded once and runs on your machine, which is the only reason a page
                that promises nothing leaves your browser can offer rewriting at all — there is no
                API key here, and no request to send one with.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
                {[
                  ["Rewrite", "Profile · role bullets"],
                  ["Translate", "中文 ⇄ English, whole sheet"],
                  ["Runs on", "Your device, after one download"],
                  ["Fallback", "A normal form, unchanged"],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                      {term}
                    </dt>
                    <dd className="mt-1 text-[0.9375rem] leading-[1.45]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The three actions are the profile guide's, verbatim — a rewrite is a
                named instruction, not a freeform "make it better". */}
            <div className="lg:col-span-6 lg:col-start-7">
              <div className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 shadow-[var(--shadow-md),var(--highlight)] lg:p-8">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                  Improve → three named actions
                </p>

                <dl className="mt-5">
                  {REWRITE_ACTIONS.map(([label, detail], index) => (
                    <div
                      key={label}
                      className={`py-4 ${index === 0 ? "" : "border-t border-[var(--rule)]"}`}
                    >
                      <dt className="flex items-center gap-2.5 text-[0.9375rem] font-medium">
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-[image:var(--gradient)]"
                        />
                        {label}
                      </dt>
                      <dd className="mt-1.5 pl-[1.0625rem] text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)]">
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-2 border-t border-[var(--rule)] pt-5 text-[0.875rem] leading-[1.6] text-[var(--graphite-soft)]">
                  Every rewrite is shown before it is applied — the field keeps what it has until
                  you take the new version. Translate twice and any wording you fixed by hand is
                  left alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — the agent. The long section: the evidence, the prompt, the tools. */}
      <section className="border-t border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <p className={SECTION_LABEL}>
                <TerminalIcon aria-hidden className="size-3.5 text-[var(--accent)]" />
                Claude Code · WebMCP
              </p>
              <h2 className={SECTION_TITLE}>Or hand the whole editor to an agent.</h2>

              <p className="mt-5 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
                <Link
                  href="https://webmachinelearning.github.io/webmcp/"
                  target="_blank"
                  className="font-medium text-[var(--graphite)] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  WebMCP
                </Link>{" "}
                lets a page hand an agent a set of functions instead of a screen to squint at. Open
                Resume registers{" "}
                <span className="font-medium text-[var(--graphite)]">seventeen of them</span> when
                the editor opens: two that read the resume, fourteen that write to it, and one that
                publishes a written review.
              </p>

              <p className="mt-5 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
                The agent never touches the DOM. It calls{" "}
                <code className="font-mono text-[0.85rem] text-[var(--graphite)]">get-resume</code>,
                decides what is weak, writes the fields, and calls{" "}
                <code className="font-mono text-[0.85rem] text-[var(--graphite)]">
                  score-resume
                </code>{" "}
                to check whether it helped — a loop it can close by itself.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
                {[
                  ["Tools", "17 · read and write"],
                  ["Browsers", "Edge 147+ · Chrome behind a flag"],
                  ["Status", "W3C draft, still moving"],
                  ["Leaves the page", "Nothing"],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                      {term}
                    </dt>
                    <dd className="mt-1 text-[0.9375rem] leading-[1.45]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Full width, not a side column: the number in the panel is the whole
                argument, so it has to be big enough to read. Squeezed into half a row
                the panels were 226px wide and illegible — which was the exact failing
                of the screen recording they replaced. */}
            <div className="lg:col-span-12">
              <ScoreStoryboard
                caption={
                  <>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em]">
                      Fig. 1 — the score panel, before and after
                    </span>
                    <span className="mt-1.5 block">
                      The agent called <code className="font-mono">get-resume</code>, rewrote the
                      weak bullets, and called <code className="font-mono">score-resume</code> again
                      to check it — moving the score from{" "}
                      <span className="font-medium text-[var(--graphite)]">
                        {BEFORE_REPORT.score}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-[var(--graphite)]">
                        {AFTER_REPORT.score}
                      </span>
                      . Both panels above are the editor&rsquo;s own component, scoring the two
                      drafts in this browser as you read — not screenshots.
                    </span>
                  </>
                }
              />
            </div>
          </div>

          {/* The prompt, full width — it is the thing a visitor came to take. */}
          <div className="mt-20 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h3 className="font-display text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.022em]">
                Try it yourself
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-[1.6] text-[var(--graphite-soft)]">
                Turn the flag on, open the editor, and give Claude Code the prompt beside this. The
                nav&rsquo;s sparkles icon reports whether the tools registered.
              </p>
              <p className="mt-4 rounded-[var(--r-sm)] bg-[var(--wash)] px-3 py-2 font-mono text-[0.78rem] text-[var(--graphite-soft)]">
                chrome://flags/#enable-webmcp-testing
              </p>
              <Link
                href="/resume-editor"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--graphite)] px-5 py-2.5 text-[0.9375rem] font-medium text-[var(--paper)] transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
              >
                Open the editor
                <ArrowRightIcon
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Link>
            </div>

            <div className="lg:col-span-8">
              <CopyablePrompt label="Prompt · paste into Claude Code" prompt={AGENT_PROMPT} />

              <p className="mt-5 max-w-[70ch] text-[0.9375rem] leading-[1.65] text-[var(--graphite-soft)]">
                The last two lines are the ones worth keeping. An agent asked to improve a resume
                will otherwise invent a plausible employer to improve it with, and a resume that
                reads well and is not true is worse than the one you started with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — the reference. Named tools, so the section above is checkable. */}
      <section className="border-t border-[var(--rule)] bg-[var(--wash)]">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
          <p className={SECTION_LABEL}>Tool reference</p>
          <h2 className={SECTION_TITLE}>Seventeen functions, and their limits.</h2>

          <div className="mt-12">
            <ToolTable />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 shadow-[var(--shadow-sm),var(--highlight)]">
              <p className="inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--graphite-soft)]">
                <BanIcon aria-hidden className="size-3.5" />
                What an agent cannot do
              </p>
              <dl className="mt-5">
                {LIMITS.map(([claim, detail], index) => (
                  <div
                    key={claim}
                    className={`py-3 ${index === 0 ? "" : "border-t border-[var(--rule)]"}`}
                  >
                    <dt className="text-[0.9375rem] font-medium">{claim}</dt>
                    <dd className="mt-1 text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)]">
                      {detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col rounded-[var(--r-lg)] border border-dashed border-[var(--rule-strong)] p-6">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                Still a draft
              </p>
              <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-[1.65] text-[var(--graphite-soft)]">
                WebMCP is a W3C community group draft, not a standard. The API has already moved
                once — the getter went from{" "}
                <code className="font-mono text-[0.8rem]">navigator</code> to{" "}
                <code className="font-mono text-[0.8rem]">document</code> — so treat this as
                experimental.
              </p>
              <Link
                href="https://github.com/leochiu-a/simple-resume/blob/main/docs/webmcp.md"
                target="_blank"
                className="mt-5 inline-flex w-fit items-center gap-2 font-mono text-[0.8125rem] font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                docs/webmcp.md
                <ArrowRightIcon aria-hidden className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The privacy claim, restated where an AI page has to earn it. */}
      <section className="border-t border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-28">
          <p className={SECTION_LABEL}>Privacy</p>
          <p className="mt-4 max-w-[46ch] font-display text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.026em]">
            An AI feature is the obvious place a local-first promise would quietly break.
          </p>
          <p className="mt-6 max-w-[68ch] text-[1.0625rem] leading-[1.7] text-[var(--graphite-soft)]">
            It does not break here. The rewrite and the translation run on a model inside your
            browser, and the agent&rsquo;s tools only mutate in-page form state — there is no
            storage, network, or navigation tool among the seventeen. Your resume stays in this
            browser&rsquo;s <code className="font-mono text-[0.9rem]">localStorage</code>, exactly
            as it does when you type it in yourself.
          </p>
        </div>
      </section>
    </main>

    <SiteFooter />
  </AccentProvider>
);

export default Ai;
