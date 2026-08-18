"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons/check";

import { TEMPLATES } from "@/app/resume-editor/components/template/registry";
import { editorHref } from "@/lib/appearance-link";

import { useAccent } from "./accent";
import TemplateSheet from "./template-sheet";

/**
 * Every registered template at once, each rendering the real thing.
 *
 * This replaces the tab strip the templates used to live in inside the hero. A grid
 * of the whole set is real, indexable content, and a row of tabs showed one of them
 * while claiming there were several — the grid is both the honest version and the
 * densest thing on the page, which is what stops a product page from being nothing
 * but headline-and-paragraph beats.
 *
 * It maps `TEMPLATES`, so adding a ninth adds a card here. The heading above says
 * the count in words, and that is the one line to keep in step with the registry.
 *
 * Every card is the same fixed A4 ratio with the metadata row in the same shape
 * underneath, because the craft in a grid like this shows up in whether the small
 * text lines up, not in the thumbnails.
 */
const Templates = () => {
  const { templateId, color, setTemplateId } = useAccent();

  return (
    <section id="templates" className="scroll-mt-24 border-t border-[var(--rule)]">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
              Templates
            </p>
            <h2 className="mt-3 max-w-[24ch] font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
              Eight to choose from, all print-ready.
            </h2>
          </div>
          <p className="max-w-[38ch] text-[0.9375rem] leading-[1.6] text-[var(--graphite-soft)]">
            Pick one to preview it above. Every template paginates properly and exports to the same
            PDF you see here.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template) => {
            const active = template.id === templateId;

            return (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  aria-pressed={active}
                  className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                >
                  {/* The gradient only shows as the edge of the chosen card, which is
                      one of the three places the ramp is reused as a system. */}
                  <div
                    className={`rounded-[var(--r-lg)] p-px transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none ${
                      active ? "bg-[image:var(--gradient)]" : "bg-[var(--rule)]"
                    }`}
                  >
                    <div className="overflow-hidden rounded-[calc(var(--r-lg)-1px)] bg-[var(--wash)] p-4 shadow-[var(--shadow-sm)] transition-shadow duration-200 group-hover:shadow-[var(--shadow-md)] motion-reduce:transition-none">
                      <TemplateSheet templateId={template.id} color={color} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="font-display text-[1rem] font-semibold tracking-[-0.01em]">
                      {template.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] ${
                        active ? "text-[var(--accent)]" : "text-[var(--graphite-soft)]"
                      }`}
                    >
                      {active ? (
                        <>
                          <CheckIcon aria-hidden className="size-3" />
                          Previewing
                        </>
                      ) : (
                        "Preview"
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)]">
                    {template.description}
                  </p>
                </button>
              </li>
            );
          })}

          {/* One more cell than the templates fill, carrying the action the grid is
              arguing for rather than leaving a hole at the end of the last row. */}
          <li className="flex">
            <div className="flex w-full flex-col justify-center gap-4 rounded-[var(--r-lg)] border border-dashed border-[var(--rule-strong)] p-8">
              <p className="font-display text-[1.0625rem] font-semibold tracking-[-0.01em]">
                Start with any of them.
              </p>
              <p className="text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)]">
                The template is a setting, not a commitment — switch it whenever, your content stays
                put.
              </p>
              {/* Carries the card that is showing, so "start with any of them"
                  starts with the one they actually chose. */}
              <Link
                href={editorHref({ templateId, backgroundColor: color })}
                className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--graphite)] px-5 py-2.5 text-[0.875rem] font-medium text-[var(--paper)] transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
              >
                Open the editor
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Templates;
