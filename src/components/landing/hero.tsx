"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/arrow-right";

import { SWATCHES, useAccent } from "./accent";
import TemplateSheet from "./template-sheet";

/** Each element of the hero arrives just after the one above it. See
 *  `.landing-rise` in globals.css for why this is CSS and not a JS animation. */
const rise = (step: number) => ({ animationDelay: `${0.05 + step * 0.07}s` });

/**
 * Badge → headline → sub → two CTAs → the product's own UI.
 *
 * The product shot is the real editor template rendering the real showcase resume,
 * not a screenshot and not a mocked-up browser frame — which matters more here than
 * anywhere else on the page, because the claim being made is that this thing renders
 * a good-looking sheet. Showing a picture of one would be arguing it.
 *
 * The tint swatches stay in the hero rather than moving down to the gallery with the
 * template choice: they are the cheapest possible demonstration of "tint it to
 * taste", they pay off instantly, and they give the visitor something to do in the
 * first screen. Which *template* is showing is the gallery's job.
 */
const Hero = () => {
  const { templateId, color, setColor } = useAccent();

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="landing-ambient" />

      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 items-center gap-y-14 px-6 pb-24 pt-16 lg:grid-cols-12 lg:gap-x-12 lg:pb-32 lg:pt-24">
        <div className="lg:col-span-6">
          <p
            style={rise(0)}
            className="landing-rise inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-raised)] py-1.5 pl-2 pr-3.5 text-[0.8125rem] text-[var(--graphite-soft)] shadow-[var(--shadow-sm),var(--highlight)]"
          >
            <span
              aria-hidden
              className="size-2 rounded-full bg-[image:var(--gradient)] shadow-[0_0_0_3px_hsl(160_84%_39%/0.15)]"
            />
            Local-first · Free · No account
          </p>

          <h1
            style={rise(1)}
            className="landing-rise mt-6 font-display text-[clamp(2.6rem,5.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.032em]"
          >
            A resume builder that{" "}
            <span className="bg-[image:var(--gradient)] bg-clip-text text-transparent">
              never uploads
            </span>{" "}
            your resume.
          </h1>

          <p
            style={rise(2)}
            className="landing-rise mt-6 max-w-[54ch] text-[1.0625rem] leading-[1.65] text-[var(--graphite-soft)]"
          >
            Write it, pick a template, tint it to taste, then export a PDF or a single
            self-contained HTML file. There is no account to make and no server to send it to — the
            whole thing lives in this browser&rsquo;s storage.
          </p>

          <div style={rise(3)} className="landing-rise mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/resume-editor"
              className="group inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient)] px-6 py-3 text-[0.9375rem] font-medium text-white shadow-[0_6px_20px_-6px_hsl(184_80%_40%/0.55)] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_10px_28px_-6px_hsl(184_80%_40%/0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
            >
              Create your resume
              <ArrowRightIcon
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
            <Link
              href="/#templates"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-raised)] px-6 py-3 text-[0.9375rem] font-medium shadow-[var(--shadow-sm),var(--highlight)] transition-colors duration-200 hover:border-[var(--rule-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              See the templates
            </Link>
          </div>

          <dl
            style={rise(4)}
            className="landing-rise mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-[var(--rule)] pt-6"
          >
            {[
              ["5", "templates"],
              ["2", "export formats"],
              ["0", "bytes uploaded"],
            ].map(([figure, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="font-mono text-[1.125rem] font-medium tabular-nums">{figure}</dt>
                <dd className="text-[0.875rem] text-[var(--graphite-soft)]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The product shot, on a plate that lifts it off the ambient field.
            One frame, not two: the plate carries the wash itself, so the paper-white
            sheet reads against it directly instead of sitting in a second box with a
            second radius. The whole page shows — a resume that stops halfway down is
            the one thing this shot must not suggest. */}
        <figure style={rise(2)} className="landing-rise m-0 lg:col-span-6">
          <div className="overflow-hidden rounded-[var(--r-xl)] border border-[var(--rule)] bg-[var(--wash)] p-3 shadow-[var(--shadow-lg),var(--highlight)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4 px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--graphite-soft)]">
                Live preview
              </span>

              <div className="flex items-center gap-0.5">
                {SWATCHES.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    title={entry.name}
                    aria-label={`Tint ${entry.name}`}
                    aria-pressed={entry.value === color}
                    onClick={() => setColor(entry.value)}
                    className="group flex size-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                  >
                    <span
                      className={`size-3.5 rounded-full transition-transform duration-200 group-hover:scale-125 motion-reduce:transition-none ${
                        entry.value === color
                          ? "ring-2 ring-[var(--graphite)] ring-offset-2 ring-offset-[var(--wash)]"
                          : ""
                      }`}
                      style={{ backgroundColor: entry.value }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <TemplateSheet templateId={templateId} color={color} />
          </div>
        </figure>
      </div>
    </section>
  );
};

export default Hero;
