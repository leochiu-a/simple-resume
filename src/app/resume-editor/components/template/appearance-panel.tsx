"use client";

import { Check, X } from "lucide-react";
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
 * a popover first, and that was wrong for what it holds: four template
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
    <div className="mx-4 my-10 lg:mx-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">Appearance</h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label="Close appearance"
        >
          <X className="size-4" />
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
            className={cn(
              "size-8 rounded-full border transition-transform hover:scale-110",
              isCurrentColor(hex)
                ? "border-foreground ring-2 ring-foreground/25"
                : "border-foreground/20",
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
      <div className="grid grid-cols-2 gap-4">
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
              className="flex flex-col items-stretch gap-2 text-left"
            >
              <div
                className={cn(
                  "overflow-hidden rounded-sm border transition-colors",
                  isCurrent
                    ? "border-brand ring-2 ring-brand/25"
                    : "border-border hover:border-foreground/40",
                )}
              >
                {/* The one on show keeps the colour you picked; the rest preview
                    the colour they would switch to, since picking a template
                    resets it to that template's own default. */}
                <TemplateThumbnail
                  template={entry}
                  resume={resume}
                  backgroundColor={isCurrent ? backgroundColor : entry.defaultColor}
                />
              </div>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Check className={cn("size-3.5 shrink-0 text-brand", !isCurrent && "opacity-0")} />
                {entry.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearancePanel;
