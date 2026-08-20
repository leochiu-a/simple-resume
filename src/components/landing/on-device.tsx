import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { SparklesIcon } from "@/components/icons/sparkles";

/**
 * The built-in model, as a code/result pair.
 *
 * Deliberately a different shape from the bento above it and the split below it. The
 * old page gave all five sections the same skeleton — label in the left margin,
 * statement on the right, two columns under it — which is what made it read as a
 * document with chapters rather than a page with beats.
 *
 * The before/after is the argument here: the claim is that a rewrite improves a line
 * without inventing anything, and showing both lines makes that checkable.
 */
const ACTIONS = [
  ["Polish the wording", "Fixes phrasing and grammar, keeps every fact and the length"],
  ["Make it shorter", "Tightens to three or four sentences, keeps the strongest points"],
  ["Lead with strengths", "Reopens on your role, using only facts already there"],
];

const OnDevice = () => (
  <section className="border-t border-[var(--rule)] bg-[var(--wash)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
            <SparklesIcon aria-hidden className="size-3.5 text-[var(--accent)]" />
            On-device AI
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
            The model runs here too.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
            Chrome and Edge now ship a language model to the page itself. Open Resume uses it to
            rewrite and translate, which is the only reason a page that promises nothing leaves your
            browser can offer rewriting at all — there is no API key here, and no request to send
            one with.
          </p>

          <dl className="mt-8 space-y-3">
            {ACTIONS.map(([name, what]) => (
              <div key={name} className="flex gap-3">
                <dt className="mt-2 size-1.5 shrink-0 rounded-full bg-[image:var(--gradient)]" />
                <dd className="text-[0.9375rem] leading-[1.55]">
                  <span className="font-medium">{name}</span>
                  <span className="text-[var(--graphite-soft)]"> — {what}</span>
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/how-ai-works"
            className="group mt-8 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            How it works
            <ArrowRightIcon
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </div>

        {/* The result pair. Two stacked plates rather than a side-by-side diff, so the
            second one reads as "and then this happened" on a narrow screen too. */}
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-5 shadow-[var(--shadow-sm),var(--highlight)]">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
              Before
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--graphite-soft)]">
              I was responsible for the checkout rewrite and also helped with performance stuff on
              the team, working with designers and other engineers.
            </p>
          </div>

          <div className="relative my-3 flex justify-center">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-[image:var(--gradient)] text-white shadow-[0_4px_14px_-4px_hsl(184_80%_40%/0.6)]"
            >
              <SparklesIcon className="size-4" />
            </span>
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-5 shadow-[var(--shadow-md),var(--highlight)]">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-[var(--accent)]">
              After — polish the wording
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.6]">
              Led the checkout rewrite and drove the performance work alongside it, pairing with
              designers and engineers across the team.
            </p>
          </div>

          <p className="mt-5 text-[0.8125rem] leading-[1.55] text-[var(--graphite-soft)]">
            Every rewrite is shown before it is applied — the field keeps what it has until you take
            the new version. Where the model is missing you get a normal form, unchanged.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default OnDevice;
