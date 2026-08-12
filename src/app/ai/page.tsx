import type { Metadata } from "next";
import Link from "next/link";

import AccentProvider from "@/components/landing/accent";
import SectionHeading from "@/components/landing/section-heading";
import SiteFooter from "@/components/landing/site-footer";
import SiteNav from "@/components/landing/site-nav";
import CopyablePrompt from "@/components/landing/ai/copyable-prompt";
import DemoVideo from "@/components/landing/ai/demo-video";
import ToolTable from "@/components/landing/ai/tool-table";

const DESCRIPTION =
  "Simple Resume runs the browser's own AI model to rewrite and translate a resume, and registers itself as 17 WebMCP tools so an agent like Claude Code can read, score, and edit it. Nothing is uploaded either way.";

export const metadata: Metadata = {
  title: "AI in Simple Resume — on-device rewriting and a WebMCP agent",
  description: DESCRIPTION,
  openGraph: {
    title: "AI in Simple Resume — on-device rewriting and a WebMCP agent",
    description: DESCRIPTION,
  },
};

/**
 * The AI page.
 *
 * The landing page states both AI features in a paragraph each; this page is for
 * the reader who wants to know how they work before pointing either at their own
 * resume. It is ordered the same way as the landing page and for the same reason
 * — the built-in model ships and works today, the agent needs a flag — but the
 * agent section is the longer one, because WebMCP is the part nobody has seen
 * before and the part that sounds least plausible without evidence.
 *
 * Every claim here is checked against the editor rather than written from
 * memory: the tool names are the ones in `webmcp/resume-tools.ts`, the rewrite
 * actions are `SECTION_GUIDES` (lib/rewrite.ts), the language pair is
 * `RESUME_LANGS` (lib/resume-doc.ts), and the two scores in the recording are
 * what `score-resume` actually returned on the resume in it.
 */

/** The prompt in the recording, as a visitor would paste it. */
const AGENT_PROMPT = `Open http://localhost:3000/resume-editor and use the page's
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

const Ai = () => (
  <AccentProvider>
    <SiteNav />

    <main>
      {/* The masthead states the one thing both features have in common, since
          that is the claim the rest of the page has to keep. */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1280px] px-6 pb-16 pt-12 lg:px-10 lg:pb-24 lg:pt-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--graphite-soft)]">
            AI · On-device model · WebMCP agent
          </p>

          <h1 className="mt-7 max-w-[24ch] font-display text-[clamp(2.6rem,5.6vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.025em]">
            AI that writes your resume <em className="font-normal italic">where it lives</em>
            <span className="text-[var(--accent)]">.</span>
          </h1>

          <p className="mt-8 max-w-[58ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
            Two different things get called AI here, and they are worth separating. The browser now
            ships a <span className="text-[var(--graphite)]">model of its own</span>, which Simple
            Resume uses to rewrite and translate. Separately, the editor registers itself as{" "}
            <span className="text-[var(--graphite)]">WebMCP tools</span>, so an agent such as Claude
            Code can read and edit the resume by calling functions instead of guessing where to
            click. Neither one uploads the resume.
          </p>

          <dl className="mt-14 grid grid-cols-2 gap-x-10 border-t border-[var(--rule)] pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)] lg:max-w-[52rem] lg:grid-cols-4">
            {[
              ["Model runs", "In your browser"],
              ["Agent tools", "17 · read and write"],
              ["Uploads", "None, either way"],
              ["Account", "Not required"],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-col gap-1.5 py-2">
                <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                <dd className="text-[var(--graphite)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 01 — the built-in model. First because it works today with no flag. */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            index="01"
            label="Built-in AI"
            title={
              <>
                The browser brought <br />
                its own model<span className="text-[var(--accent)]">.</span>
              </>
            }
          />

          <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:col-start-4">
              <p className="max-w-[46ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
                Chrome and Edge expose a language model and a translator to the page itself. The
                model is downloaded once and runs on your machine, which is the only reason a page
                that promises nothing leaves your browser can offer rewriting at all — there is no
                API key here, and no request to send one with.
              </p>

              <dl className="mt-10 border-t border-[var(--rule)] font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                {[
                  ["Rewrite", "Profile · role bullets"],
                  ["Translate", "中文 ⇄ English, whole sheet"],
                  ["Runs on", "Your device, after one download"],
                  ["Fallback", "A normal form, unchanged"],
                ].map(([term, value]) => (
                  <div
                    key={term}
                    className="flex flex-col gap-1.5 border-b border-[var(--rule)] py-4"
                  >
                    <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                    <dd className="text-[var(--graphite)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              {/* The three actions are the profile guide's, verbatim — a rewrite
                  is a named instruction, not a freeform "make it better". */}
              <div className="border border-[var(--rule)] bg-[var(--paper-raised)] p-7 lg:p-9">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--graphite-soft)]">
                  Improve → three named actions
                </p>

                <dl className="mt-6">
                  {REWRITE_ACTIONS.map(([label, detail]) => (
                    <div
                      key={label}
                      className="border-b border-dashed border-[var(--rule)] py-3.5 last:border-b-0"
                    >
                      <dt className="text-[0.95rem] text-[var(--graphite)]">{label}</dt>
                      <dd className="mt-1 text-[0.85rem] leading-[1.6] text-[var(--graphite-soft)]">
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-7 border-t border-[var(--rule)] pt-5 text-[0.9rem] leading-[1.65] text-[var(--graphite-soft)]">
                  Every rewrite is shown before it is applied — the field keeps what it has until
                  you take the new version. Translate twice and any wording you fixed by hand is
                  left alone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — the agent. The long section: the recording, the prompt, the tools. */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            index="02"
            label="Claude Code · WebMCP"
            title={
              <>
                Or hand the whole <br />
                editor to an agent<span className="text-[var(--accent)]">.</span>
              </>
            }
          />

          <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:col-start-4">
              <p className="max-w-[46ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
                <Link
                  href="https://webmachinelearning.github.io/webmcp/"
                  target="_blank"
                  className="text-[var(--graphite)] underline decoration-[var(--rule)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--accent)]"
                >
                  WebMCP
                </Link>{" "}
                lets a page hand an agent a set of functions instead of a screen to squint at.
                Simple Resume registers{" "}
                <span className="text-[var(--graphite)]">seventeen of them</span> when the editor
                opens: two that read the resume, fourteen that write to it, and one that publishes a
                written review.
              </p>

              <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
                The agent never touches the DOM. It calls{" "}
                <code className="font-mono text-[0.85rem] text-[var(--graphite)]">get-resume</code>,
                decides what is weak, writes the fields, and calls{" "}
                <code className="font-mono text-[0.85rem] text-[var(--graphite)]">
                  score-resume
                </code>{" "}
                to check whether it helped — a loop it can close by itself.
              </p>

              <dl className="mt-10 border-t border-[var(--rule)] font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
                {[
                  ["Tools", "17 · read and write, per section"],
                  ["Browsers", "Edge 147+ · Chrome behind a flag"],
                  ["Status", "W3C community draft, still moving"],
                  ["Leaves the page", "Nothing"],
                ].map(([term, value]) => (
                  <div
                    key={term}
                    className="flex flex-col gap-1.5 border-b border-[var(--rule)] py-4"
                  >
                    <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                    <dd className="text-[var(--graphite)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <DemoVideo
                sources={[
                  { src: "/ai-demo/webmcp-agent.webm", type: "video/webm" },
                  { src: "/ai-demo/webmcp-agent.mp4", type: "video/mp4" },
                ]}
                poster="/ai-demo/webmcp-agent-poster.jpg"
                caption={
                  <>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                      Fig. 1 — eight tool calls, unedited
                    </span>
                    <span className="mt-1.5 block">
                      A real run against the editor. The caption strip names each call as it is
                      made; the number in the header is the resume&rsquo;s score, moving from{" "}
                      <span className="text-[var(--graphite)]">59</span> to{" "}
                      <span className="text-[var(--graphite)]">91</span> as the agent works. Both
                      figures came from <code className="font-mono">score-resume</code> itself.
                    </span>
                  </>
                }
              />
            </div>
          </div>

          {/* The prompt, full width — it is the thing a visitor came to take. */}
          <div className="mt-20 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <h3 className="font-display text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.02em]">
                Try it yourself
              </h3>
              <p className="mt-4 text-[0.95rem] leading-[1.65] text-[var(--graphite-soft)]">
                Turn the flag on, open the editor, and give Claude Code the prompt beside this. The
                nav&rsquo;s sparkles icon reports whether the tools registered.
              </p>
              <p className="mt-5 font-mono text-[0.8rem] leading-[1.7] text-[var(--graphite-soft)]">
                chrome://flags/#enable-webmcp-testing
              </p>
              <Link
                href="/resume-editor"
                className="mt-7 inline-flex items-center gap-3 border border-[var(--rule)] px-6 py-3 text-[0.9rem] font-medium transition-colors duration-200 hover:border-[var(--accent)]"
              >
                Open the editor
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="lg:col-span-9">
              <CopyablePrompt label="Prompt · paste into Claude Code" prompt={AGENT_PROMPT} />

              <p className="mt-5 max-w-[70ch] text-[0.9rem] leading-[1.7] text-[var(--graphite-soft)]">
                The last two lines are the ones worth keeping. An agent asked to improve a resume
                will otherwise invent a plausible employer to improve it with, and a resume that
                reads well and is not true is worse than the one you started with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — the reference. Named tools, so the section above is checkable. */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeading
            index="03"
            label="Tool reference"
            title={
              <>
                Seventeen functions, <br />
                and their limits<span className="text-[var(--accent)]">.</span>
              </>
            }
          />

          <div className="mt-14">
            <ToolTable />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-5 lg:col-start-4">
              <h3 className="font-display text-[1.35rem] font-semibold leading-[1.2] tracking-[-0.02em]">
                What an agent cannot do
              </h3>
              <ul className="mt-6 border-t border-[var(--rule)]">
                {[
                  ["Download the PDF", "Export stays a user action"],
                  ["Change the template or tint", "That is how it looks, not what it says"],
                  ["Reorder entries", "It can remove and re-add; there is no move tool"],
                  ["Reach anything outside the page", "No storage, network, or navigation tool"],
                  ["Set its own score", "A review carries notes, never a number"],
                ].map(([claim, detail]) => (
                  <li
                    key={claim}
                    className="flex flex-col gap-1 border-b border-[var(--rule)] py-3.5"
                  >
                    <span className="text-[0.95rem] text-[var(--graphite)]">{claim}</span>
                    <span className="text-[0.85rem] leading-[1.6] text-[var(--graphite-soft)]">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <div className="border border-[var(--rule)] bg-[var(--paper-raised)] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                  Still a draft
                </p>
                <p className="mt-4 text-[0.88rem] leading-[1.65] text-[var(--graphite-soft)]">
                  WebMCP is a W3C community group draft, not a standard. The API has already moved
                  once — the getter went from{" "}
                  <code className="font-mono text-[0.8rem]">navigator</code> to{" "}
                  <code className="font-mono text-[0.8rem]">document</code> — so treat this as
                  experimental.
                </p>
                <Link
                  href="https://github.com/leochiu-a/simple-resume/blob/main/docs/webmcp.md"
                  target="_blank"
                  className="mt-5 inline-block font-mono text-[0.8rem] text-[var(--graphite)] underline decoration-[var(--rule)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--accent)]"
                >
                  docs/webmcp.md →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The privacy claim, restated where an AI page has to earn it. */}
      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--graphite-soft)] lg:col-span-3 lg:pt-3">
              <span className="text-[var(--accent)]">04</span> / Privacy
            </p>
            <div className="lg:col-span-9">
              <p className="max-w-[54ch] font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-normal italic leading-[1.32] tracking-[-0.015em]">
                An AI feature is the obvious place a local-first promise would quietly break.
              </p>
              <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
                It does not break here. The rewrite and the translation run on a model inside your
                browser, and the agent&rsquo;s tools only mutate in-page form state — there is no
                storage, network, or navigation tool among the seventeen. Your resume stays in this
                browser&rsquo;s <code className="font-mono text-[0.9rem]">localStorage</code>,
                exactly as it does when you type it in yourself.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />
  </AccentProvider>
);

export default Ai;
