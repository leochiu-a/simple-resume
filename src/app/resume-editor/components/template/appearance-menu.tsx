"use client";

import { Check, ChevronDown } from "lucide-react";
import { FaTableColumns } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume";

import { TEMPLATES, TemplateDefinition } from "./registry";
import TemplateThumbnail from "./template-thumbnail";

/**
 * The one place the preview's appearance is chosen: which template, and what
 * colour it is tinted.
 *
 * These used to be two buttons in the nav. Folding them together is what keeps the
 * bar quiet — and they belong together anyway, since each template tints a
 * different part of the page.
 *
 * The templates are shown as pages rather than named in a list. A layout is a
 * visual thing, and "Timeline: timeline entries, details in a right-hand rail" asks
 * you to picture it; a thumbnail of your own resume in that layout does not.
 */

/** Enough range to suit any of the templates without opening the full picker. */
const SWATCHES = [
  { hex: "#02061b", label: "Ink" },
  { hex: "#2e404a", label: "Slate" },
  { hex: "#094c42", label: "Green" },
  { hex: "#2e4a6b", label: "Navy" },
  { hex: "#4a90b8", label: "Blue" },
  { hex: "#f2f2f2", label: "Light" },
];

const AppearanceMenu = ({
  resume,
  template,
  color,
  onSelectTemplate,
  onSelectColor,
  onOpenColorPicker,
}: {
  /** Shown in the thumbnails, so the preview is of your resume and not a sample. */
  resume: Resume;
  template: TemplateDefinition;
  color: string;
  onSelectTemplate: (id: string) => void;
  onSelectColor: (hex: string) => void;
  onOpenColorPicker: () => void;
}) => {
  const isCurrent = (hex: string) => hex.toLowerCase() === color.toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button" aria-label="Change template">
          <FaTableColumns />
          <span className="ml-2 hidden sm:inline">{template.label}</span>
          {/* The current colour, so both halves of the state show on the trigger.
              The border keeps a pale swatch visible against the button. */}
          <span
            aria-hidden
            className="ml-2 size-3 rounded-full border border-foreground/20"
            style={{ backgroundColor: color }}
          />
          <ChevronDown className="ml-1 size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      {/* Tall enough to need a ceiling on a short laptop, hence the scroll. */}
      <DropdownMenuContent align="end" className="max-h-[80vh] w-80 overflow-y-auto">
        <DropdownMenuLabel>Template</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1">
          {TEMPLATES.map((entry) => {
            const isCurrent = entry.id === template.id;

            return (
              <DropdownMenuItem
                key={entry.id}
                onClick={() => onSelectTemplate(entry.id)}
                // The description is the tooltip now that the page itself says more
                // about the layout than a sentence can. The label alone is what
                // shows, so the name has to carry both — a thumbnail is no use to a
                // screen reader.
                title={entry.description}
                aria-label={`${entry.label} — ${entry.description}`}
                className="flex-col items-stretch gap-1.5 p-1.5"
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-sm border",
                    isCurrent ? "border-foreground ring-2 ring-foreground/20" : "border-border",
                  )}
                >
                  {/* The one on show keeps the colour you picked; the rest preview
                      the colour they would switch to, since picking a template
                      resets it to that template's own default. */}
                  <TemplateThumbnail
                    template={entry}
                    resume={resume}
                    backgroundColor={isCurrent ? color : entry.defaultColor}
                  />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Check className={cn("size-3 shrink-0", !isCurrent && "opacity-0")} />
                  {entry.label}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Colour</DropdownMenuLabel>
        <div className="flex items-center gap-1.5 px-2 pb-1">
          {SWATCHES.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              aria-label={label}
              aria-pressed={isCurrent(hex)}
              onClick={() => onSelectColor(hex)}
              style={{ backgroundColor: hex }}
              className={cn(
                "size-6 rounded-full border transition-transform hover:scale-110",
                isCurrent(hex)
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-foreground/20",
              )}
            />
          ))}
        </div>

        <DropdownMenuItem onClick={onOpenColorPicker}>Custom colour…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppearanceMenu;
