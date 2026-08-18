"use client";

import { CheckIcon } from "@/components/icons/check";
import { XIcon } from "@/components/icons/x";
import { Sketch as SketchPicker } from "@uiw/react-color";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume";

import type useTemplateOptions from "../../hooks/useTemplateOptions";
import { TEMPLATES } from "./registry";
import TemplateThumbnail from "./template-thumbnail";

/** Enough range to suit any of the templates without opening the full picker. */
const SWATCHES = [
  { hex: "#02061b", label: "Ink" },
  { hex: "#2e404a", label: "Slate" },
  { hex: "#094c42", label: "Green" },
  { hex: "#2e4a6b", label: "Navy" },
  { hex: "#4a90b8", label: "Blue" },
  { hex: "#f2f2f2", label: "Light" },
];

/**
 * How the sheet looks — which template, and what colour it is tinted.
 *
 * This takes over the editing column rather than floating over the sheet. It was
 * a popover first, and that was wrong for what it holds: eight template
 * thumbnails want to be looked at and compared, and a 320px panel perched over
 * the preview both crowds them and covers the very thing they are previews of.
 * Given the whole column they can be large enough to actually judge, and the
 * sheet beside them stays completely unobscured while you flick between them.
 *
 * It is a mode, not a route. The palette button on the preview opens it and the
 * ✕ here closes it; the form underneath keeps its state throughout, because
 * nothing about it unmounts — the column simply renders this instead.
 */
const AppearancePanel = ({
  resume,
  options,
  onClose,
}: {
  /** Shown in the thumbnails, so the preview is of your resume and not a sample. */
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  onClose: () => void;
}) => {
  const {
    template,
    selectTemplate,
    backgroundColor,
    selectColor,
    displayColorPicker,
    toggleColorPicker,
    changeBackgroundColor,
  } = options;

  const isCurrentColor = (hex: string) => hex.toLowerCase() === backgroundColor.toLowerCase();

  return (
    // Capped rather than filling the column, and centred once the cap is reached.
    // The thumbnails are A4-proportioned, so an unbounded grid makes each one
    // taller than the pane on a wide monitor — you would scroll to compare
    // templates that are meant to be seen side by side.
    //
    // `max-w-5xl` rather than `2xl` because the grid below adds columns instead of
    // stretching two: the extra room buys a third and fourth card, not four bigger
    // ones. `mx-auto` is what stops the panel hugging the left edge of the preview
    // dialog, which gives it the whole screen.
    <div className="mx-4 my-10 max-w-5xl lg:mx-auto lg:px-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">Appearance</h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label="Close appearance"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Colour
      </p>
      <div className="mb-10 flex flex-wrap items-center gap-2">
        {SWATCHES.map(({ hex, label }) => (
          <button
            key={hex}
            type="button"
            aria-label={label}
            aria-pressed={isCurrentColor(hex)}
            onClick={() => selectColor(hex)}
            style={{ backgroundColor: hex }}
            // The hero's swatch row, at the editor's size: the same grow on hover
            // and the same offset ring on the chosen one, so the control reads as
            // one control across the two surfaces. The hairline stays on every
            // swatch here because this row has a near-white one and the hero
            // does not.
            className={cn(
              "size-8 rounded-full border border-foreground/20 transition-transform duration-200 hover:scale-110 motion-reduce:transition-none",
              isCurrentColor(hex) && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
          />
        ))}

        <button
          type="button"
          onClick={toggleColorPicker}
          aria-expanded={displayColorPicker}
          className="ml-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Custom…
        </button>
      </div>

      {displayColorPicker && (
        // The presets cover most cases; this is the escape hatch for an exact
        // colour. Inline rather than floating: there is room for it here, and a
        // popover over a panel is one surface too many.
        <div className="mb-10">
          <SketchPicker
            color={backgroundColor}
            onChange={changeBackgroundColor}
            className="!w-full !shadow-none"
          />
        </div>
      )}

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Template
      </p>
      {/* Shown as pages rather than named in a list. A layout is a visual thing,
          and "Timeline: timeline entries, details in a right-hand rail" asks you
          to picture it; a thumbnail of your own resume in that layout does not. */}
      {/* `auto-fill` rather than a fixed two columns: the cards are A4-proportioned,
          so two of them stretched across a wide pane become enormous and the grid
          reads as loose. Given a minimum width instead, the extra room buys another
          column and each card stays a size you can actually take in at a glance.
          `1fr` as the max so the last row's cards still fill the width evenly. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-x-4 gap-y-6">
        {TEMPLATES.map((entry) => {
          const isCurrent = entry.id === template.id;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => selectTemplate(entry.id)}
              // The description is the tooltip now that the page itself says more
              // about the layout than a sentence can. A thumbnail is no use to a
              // screen reader, so the label carries both.
              title={entry.description}
              aria-label={`${entry.label} — ${entry.description}`}
              aria-pressed={isCurrent}
              className="group flex flex-col items-stretch text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {/* The same card the landing page's gallery is made of: a one-pixel
                  frame that becomes the brand ramp on the chosen one, the sheet
                  mounted on the wash inside it, and a lift on hover. It was a
                  hairline border plus a brand ring here, which is the shadcn way
                  of saying "selected" and looked like a different product from the
                  gallery a visitor had just picked a template in. */}
              <div
                className={cn(
                  "rounded-lg p-px transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none",
                  isCurrent ? "bg-[image:var(--gradient)]" : "bg-border",
                )}
              >
                <div className="overflow-hidden rounded-[calc(var(--radius)-1px)] bg-secondary p-2 shadow-sm transition-shadow duration-200 group-hover:shadow-md motion-reduce:transition-none">
                  {/* The one on show keeps the colour you picked; the rest preview
                      the colour they would switch to, since picking a template
                      resets it to that template's own default. */}
                  <TemplateThumbnail
                    template={entry}
                    resume={resume}
                    backgroundColor={isCurrent ? backgroundColor : entry.defaultColor}
                  />
                </div>
              </div>

              {/* Name left, state right, in the gallery's own shape. The check is
                  decoration — `aria-pressed` is what carries the state — so it goes
                  with the word rather than in front of the name. */}
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{entry.label}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                    isCurrent ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  {isCurrent && <CheckIcon aria-hidden className="size-3 shrink-0" />}
                  {isCurrent ? "Selected" : "Select"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearancePanel;
