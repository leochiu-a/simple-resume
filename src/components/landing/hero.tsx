"use client";

import Link from "next/link";

import { TEMPLATES } from "@/app/resume-editor/components/template/registry";

import { SWATCHES, useAccent } from "./accent";
import TemplateSheet from "./template-sheet";

/** Each element of the hero arrives just after the one above it. See
 *  `.landing-rise` in globals.css for why this is CSS and not a JS animation. */
const rise = (step: number) => ({ animationDelay: `${0.05 + step * 0.08}s` });

const Hero = () => {
  const { templateId, color, setTemplateId, setColor } = useAccent();

  const template = TEMPLATES.find((entry) => entry.id === templateId) ?? TEMPLATES[0];
  const swatch = SWATCHES.find((entry) => entry.value === color);

  return (
    <section className="border-b border-[var(--rule)]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-y-16 px-6 pb-20 pt-12 lg:grid-cols-12 lg:gap-x-14 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="flex flex-col lg:col-span-6 lg:col-start-1">
          <p
            style={rise(0)}
            className="landing-rise font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--graphite-soft)]"
          >
            Free · Open source · No account
          </p>

          <h1
            style={rise(1)}
            className="landing-rise mt-7 font-display text-[clamp(2.9rem,6.4vw,5.1rem)] font-semibold leading-[0.95] tracking-[-0.025em]"
          >
            Your resume <br />
            <em className="font-normal italic">never leaves</em> <br />
            your browser<span className="text-[var(--accent)]">.</span>
          </h1>

          <p
            style={rise(2)}
            className="landing-rise mt-8 max-w-[46ch] text-[1.0625rem] leading-[1.7] text-[var(--graphite-soft)]"
          >
            Write it, pick a template, tint it to taste, then export a PDF — or a single
            self-contained HTML file. There is no account to make and no server to send it to. The
            whole thing lives in this browser&rsquo;s storage.
          </p>

          <div style={rise(3)} className="landing-rise mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/resume-editor"
              className="group inline-flex items-center gap-3 bg-[var(--accent)] px-7 py-3.5 text-[0.95rem] font-medium text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Create resume
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
            <Link
              href="https://github.com/leochiu-a/simple-resume"
              target="_blank"
              className="inline-flex items-center gap-2 border border-[var(--rule)] px-7 py-3.5 text-[0.95rem] font-medium transition-colors duration-200 hover:border-[var(--accent)]"
            >
              View source
            </Link>
          </div>

          {/* A colophon, in the space the sheet's height opens up beside it. Every
              line is a fact about the thing, not a claim about it. */}
          <dl
            style={rise(4)}
            className="landing-rise mt-14 grid grid-cols-2 gap-x-10 border-t border-[var(--rule)] pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)] lg:mt-auto lg:max-w-[30rem]"
          >
            {[
              ["Sheet", "A4 · 595 × 842 pt"],
              ["Exports", "PDF · HTML"],
              ["Stored in", "This browser only"],
              ["Price", "Free, no tiers"],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-col gap-1.5 py-2">
                <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                <dd className="text-[var(--graphite)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure style={rise(2)} className="landing-rise m-0 lg:col-span-5 lg:col-start-8 lg:pt-2">
          <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[var(--rule)] pb-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {TEMPLATES.map((entry) => {
                const active = entry.id === template.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setTemplateId(entry.id)}
                    aria-pressed={active}
                    className={`py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 ${
                      active
                        ? "text-[var(--accent)] underline decoration-[1.5px] underline-offset-[6px]"
                        : "text-[var(--graphite-soft)] hover:text-[var(--graphite)]"
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>

            {/* The dot is 16px because that is the size it wants to be; the button
                around it is padded out to a thumb. */}
            <div className="flex items-center gap-0.5 sm:ml-auto">
              {SWATCHES.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setColor(entry.value)}
                  title={entry.name}
                  aria-label={`Tint ${entry.name}`}
                  aria-pressed={entry.value === color}
                  className="group flex size-8 items-center justify-center"
                >
                  <span
                    className={`size-4 rounded-full transition-transform duration-200 group-hover:scale-125 ${
                      entry.value === color
                        ? "ring-1 ring-[var(--graphite)] ring-offset-2 ring-offset-[var(--paper)]"
                        : ""
                    }`}
                    style={{ backgroundColor: entry.value }}
                  />
                </button>
              ))}
            </div>
          </div>

          <TemplateSheet templateId={template.id} color={color} />

          <figcaption className="mt-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--graphite-soft)]">
              Fig. 1 — {template.label}, {swatch?.name ?? color}
            </span>
            <span className="mt-1.5 block font-display text-[0.95rem] italic text-[var(--graphite-soft)]">
              {template.description} Rendered live from the template itself, not a screenshot of
              one.
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

export default Hero;
